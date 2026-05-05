from __future__ import annotations

import asyncio
import random
from datetime import datetime, timezone
from typing import Any

from app.features.oi_features import classify_oi_state
from app.redis_client import get_sentiment, publish_tick


DEFAULT_SYMBOLS: list[dict[str, Any]] = [
    {"symbol": "RELIANCE", "ltp": 2847.5, "change_pct": 1.23, "sentiment_score": 0.42, "volume": 2_481_000, "oi": 1_320_000},
    {"symbol": "HDFCBANK", "ltp": 1628.35, "change_pct": 0.84, "sentiment_score": 0.27, "volume": 1_930_000, "oi": 980_000},
    {"symbol": "ICICIBANK", "ltp": 1194.8, "change_pct": -0.62, "sentiment_score": -0.11, "volume": 1_540_000, "oi": 1_120_000},
    {"symbol": "INFY", "ltp": 1492.1, "change_pct": 1.88, "sentiment_score": 0.35, "volume": 1_120_000, "oi": 740_000},
    {"symbol": "TCS", "ltp": 3842.55, "change_pct": -1.16, "sentiment_score": -0.18, "volume": 610_000, "oi": 690_000},
    {"symbol": "SBIN", "ltp": 812.9, "change_pct": 2.32, "sentiment_score": 0.52, "volume": 3_230_000, "oi": 1_480_000},
    {"symbol": "LT", "ltp": 3710.25, "change_pct": 0.42, "sentiment_score": 0.16, "volume": 880_000, "oi": 530_000},
    {"symbol": "TATAMOTORS", "ltp": 986.4, "change_pct": -1.94, "sentiment_score": -0.33, "volume": 1_610_000, "oi": 820_000},
]


def _regime_from_change(change_pct: float) -> str:
    if change_pct > 0.9:
        return "bull"
    if change_pct < -0.9:
        return "bear"
    return "sideways"


async def run_mock_tick_stream(*, interval_s: float = 2.0) -> None:
    """
    Publish a realistic-ish market tape into Redis Streams under key "ticks".
    This is intentionally "production-shaped" (Redis stream) but uses synthetic ticks.
    """
    symbols = [dict(row) for row in DEFAULT_SYMBOLS]

    # Track a tiny bit of state so OI and price move together-ish.
    for row in symbols:
        row["_base_price"] = float(row["ltp"])
        row["_base_oi"] = int(row["oi"])

    while True:
        now = datetime.now(timezone.utc).isoformat()
        for row in symbols:
            # Random-walk price with small drift in direction of current change_pct sign.
            direction_bias = 1 if row["change_pct"] >= 0 else -1
            drift = (random.random() - 0.45) * 0.35 * direction_bias
            row["change_pct"] = float(round(row["change_pct"] + drift / 10, 2))
            row["ltp"] = float(round(row["ltp"] * (1 + (drift / 1000)), 2))

            # OI changes slowly, correlated with drift.
            oi_drift = int((random.random() - 0.5) * 12_000 + (drift * 9_000))
            row["oi"] = max(0, int(row["oi"]) + oi_drift)

            # Derive OI state from (oi change %, price change %)
            oi_change_pct = 0.0
            if row.get("_base_oi"):
                oi_change_pct = (row["oi"] - row["_base_oi"]) / max(row["_base_oi"], 1)
            price_change_pct = row["change_pct"] / 100.0
            oi_state = classify_oi_state(oi_change_pct, price_change_pct)

            direction = "bullish" if row["change_pct"] > 0.2 else "bearish" if row["change_pct"] < -0.2 else "neutral"
            confidence = float(round(max(0.42, min(0.9, 0.62 + abs(row["change_pct"]) / 6 + (random.random() - 0.5) * 0.06)), 2))

            cached_sentiment = await get_sentiment(row["symbol"])
            payload = {
                "ltp": row["ltp"],
                "change_pct": row["change_pct"],
                "direction": direction,
                "oi_state": oi_state,
                "confidence": confidence,
                "regime": _regime_from_change(row["change_pct"]),
                "sentiment_score": float(cached_sentiment) if cached_sentiment is not None else row["sentiment_score"],
                "volume": int(row["volume"]) + random.randint(0, 50_000),
                "oi": int(row["oi"]),
                "ts": now,
                "vix_discounted_confidence": confidence,
            }
            await publish_tick(row["symbol"], payload)

        await asyncio.sleep(interval_s)

