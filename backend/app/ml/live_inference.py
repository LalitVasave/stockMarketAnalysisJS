from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone

from app.config import settings
from app.db.timescale import insert_prediction, parse_ts
from app.ml.inference import infer_direction
from app.ml.regime_hmm import infer_regime
from app.redis_client import get_market_vix, publish_tick, redis_client


def _loads(value: str | None):
    if value is None:
        return None
    try:
        return json.loads(value)
    except Exception:
        return value


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _score_from_change_pct(change_pct: float) -> float:
    # Maps roughly [-3%, +3%] into [0.12, 0.92] like the demo API.
    return round(_clamp((change_pct + 3.0) / 6.0, 0.12, 0.92), 2)


def _oi_score_from_divergence(oi_price_divergence: float | None) -> float:
    # Divergence is (oi_change_pct - price_change_pct); keep bounded.
    if oi_price_divergence is None:
        return 0.62
    return round(_clamp(0.62 + (oi_price_divergence * 2.5), 0.1, 0.95), 2)


def _sentiment_score_to_unit(sentiment: float | None) -> float:
    # Sentiment is roughly [-1, 1]; map to [0.05, 0.95].
    if sentiment is None:
        return 0.5
    return round(_clamp(0.5 + (sentiment / 2.0), 0.05, 0.95), 2)


def _direction_to_int(direction: str) -> int:
    if direction == "bullish":
        return 1
    if direction == "bearish":
        return -1
    return 0


async def run_live_inference(*, symbols: list[str], interval_s: float) -> None:
    """
    Production-shaped live inference loop:
    - reads latest tick cache from Redis
    - builds simple stationary-ish scores
    - runs infer_direction + infer_regime
    - writes Timescale prediction row
    - publishes an enriched tick to the tick stream for UI updates
    """
    while True:
        for symbol in symbols:
            tick_map = await redis_client.hgetall(f"tick:{symbol}")
            if not tick_map:
                continue

            change_pct = _loads(tick_map.get("change_pct"))
            ltp = _loads(tick_map.get("ltp"))
            volume = _loads(tick_map.get("volume"))
            ts_raw = _loads(tick_map.get("ts"))
            sentiment_score = _loads(tick_map.get("sentiment_score"))
            oi_state = _loads(tick_map.get("oi_state"))
            oi_price_divergence = _loads(tick_map.get("oi_price_divergence"))

            try:
                change_pct_f = float(change_pct)
            except Exception:
                change_pct_f = 0.0

            technical_score = _score_from_change_pct(change_pct_f)
            oi_score = _oi_score_from_divergence(float(oi_price_divergence) if oi_price_divergence is not None else None)
            sentiment_unit = _sentiment_score_to_unit(float(sentiment_score) if sentiment_score is not None else None)

            vix_payload = await get_market_vix()
            vix = float(vix_payload["vix"]) if vix_payload and "vix" in vix_payload else 16.8
            inference = infer_direction(technical_score, oi_score, sentiment_unit, vix)

            # Simple regime estimate based on volatility proxy and volume trend proxy.
            # TODO: replace with real walk-forward / HMM input pipeline.
            volatility = abs(change_pct_f) / 100.0
            volume_trend = 1.04
            regime = infer_regime(volatility, volume_trend, vix)

            ts = parse_ts(ts_raw) if isinstance(ts_raw, str) else datetime.now(timezone.utc)
            await insert_prediction(
                symbol=symbol,
                ts=ts,
                direction=_direction_to_int(inference["direction"]),
                confidence=float(inference["raw_confidence"]),
                vix_discounted=float(inference["vix_discounted_confidence"]),
                model_version=settings.model_version,
            )

            # Publish enriched tick for frontend.
            enriched = {
                "ltp": ltp,
                "change_pct": change_pct_f,
                "volume": volume,
                "ts": (ts_raw if isinstance(ts_raw, str) else ts.isoformat()),
                "direction": inference["direction"],
                "confidence": inference["raw_confidence"],
                "vix_discounted_confidence": inference["vix_discounted_confidence"],
                "regime": regime,
                "sentiment_score": float(sentiment_score) if sentiment_score is not None else 0.0,
                "oi_state": oi_state or "neutral",
                "positioning_alignment": inference["positioning_alignment"],
            }
            await publish_tick(symbol, enriched)

        await asyncio.sleep(interval_s)

