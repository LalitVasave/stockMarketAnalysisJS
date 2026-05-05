from __future__ import annotations

import asyncio
import json
import random
from datetime import datetime, timezone

from app.db.timescale import insert_oi_snapshot, parse_ts
from app.features.oi_features import classify_oi_state, oi_price_divergence
from app.redis_client import redis_client


def build_oi_snapshot(symbol: str, oi_change_pct: float, price_change_pct: float) -> dict:
    return {
        "symbol": symbol,
        "oi_state": classify_oi_state(oi_change_pct, price_change_pct),
        "oi_price_divergence": oi_price_divergence(oi_change_pct, price_change_pct),
    }


def _loads(value: str | None):
    if value is None:
        return None
    try:
        return json.loads(value)
    except Exception:
        return value


async def run_oi_poller(*, symbols: list[str], interval_s: float = 180.0) -> None:
    """
    Every ~3 minutes:
    - read latest tick cache for each symbol (tick:{SYMBOL})
    - compute oi_change_pct vs price_change_pct since last poll
    - classify OI state
    - write oi_snapshots row to Timescale
    - update tick cache with computed oi_state + oi_price_divergence
    """
    last_seen: dict[str, dict[str, float]] = {}

    while True:
        now = datetime.now(timezone.utc)
        for symbol in symbols:
            tick_map = await redis_client.hgetall(f"tick:{symbol}")
            if not tick_map:
                continue

            ltp = _loads(tick_map.get("ltp"))
            oi = _loads(tick_map.get("oi"))
            ts = parse_ts(_loads(tick_map.get("ts")) if "ts" in tick_map else None)

            try:
                price = float(ltp)
            except Exception:
                continue
            try:
                oi_val = float(oi) if oi is not None else None
            except Exception:
                oi_val = None

            prev = last_seen.get(symbol)
            if not prev:
                # Seed baseline on first run.
                last_seen[symbol] = {"price": price, "oi": float(oi_val or 0.0)}
                continue

            price_change_pct = 0.0 if prev["price"] == 0 else (price - prev["price"]) / prev["price"]
            oi_change_pct = 0.0
            if oi_val is not None and prev["oi"] != 0:
                oi_change_pct = (oi_val - prev["oi"]) / prev["oi"]

            snapshot = build_oi_snapshot(symbol, oi_change_pct, price_change_pct)

            # Simple demo PCR/delivery approximations (real poller will replace these).
            pcr = round(max(0.4, min(1.6, 1.0 + (random.random() - 0.5) * 0.5)), 2)
            delivery_pct = round(max(18.0, min(65.0, 35.0 + (random.random() - 0.5) * 10.0)), 1)

            # Split OI into long/short buckets for the hypertable shape.
            long_oi = int(max(0, (oi_val or 0) * (0.52 + random.random() * 0.18)))
            short_oi = int(max(0, (oi_val or 0) - long_oi))

            await insert_oi_snapshot(
                symbol=symbol,
                ts=ts or now,
                oi_state=snapshot["oi_state"],
                pcr=pcr,
                delivery_pct=delivery_pct,
                long_oi=long_oi,
                short_oi=short_oi,
            )

            # Update tick cache so UI can show the latest OI posture immediately.
            try:
                await redis_client.hset(
                    f"tick:{symbol}",
                    mapping={
                        "oi_state": json.dumps(snapshot["oi_state"]),
                        "oi_price_divergence": json.dumps(snapshot["oi_price_divergence"]),
                        "pcr": json.dumps(pcr),
                        "delivery_pct": json.dumps(delivery_pct),
                    },
                )
            except Exception:
                pass

            # Move baseline forward.
            last_seen[symbol] = {"price": price, "oi": float(oi_val or prev["oi"])}

        await asyncio.sleep(interval_s)
