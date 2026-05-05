from __future__ import annotations

import json
from typing import Any

from redis.asyncio import Redis

from app.config import settings
from app.db.timescale import insert_candle_from_tick


redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


async def publish_tick(symbol: str, payload: dict[str, Any]) -> None:
    await redis_client.xadd("ticks", {"symbol": symbol, "payload": json.dumps(payload)}, maxlen=50000, approximate=True)
    # Keep a latest-tick cache per symbol for pollers/enrichers.
    try:
        await redis_client.hset(f"tick:{symbol}", mapping={k: json.dumps(v) for k, v in payload.items()})
        await redis_client.expire(f"tick:{symbol}", 60 * 60 * 6)  # 6 hours
    except Exception:
        # Cache is optional.
        pass
    # Best-effort persistence: keep the stream as source of truth, but store to Timescale when available.
    try:
        await insert_candle_from_tick(symbol, payload)
    except Exception:
        # Do not block tick publishing on DB failures.
        return


async def set_sentiment(symbol: str, score: float, ttl: int = 3600) -> None:
    await redis_client.set(f"sentiment:{symbol}", score, ex=ttl)


async def get_sentiment(symbol: str) -> float | None:
    value = await redis_client.get(f"sentiment:{symbol}")
    if value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None


async def get_tick_cache(symbol: str) -> dict[str, Any]:
    raw = await redis_client.hgetall(f"tick:{symbol}")
    parsed: dict[str, Any] = {}
    for key, value in raw.items():
        try:
            parsed[key] = json.loads(value)
        except Exception:
            parsed[key] = value
    return parsed


async def set_market_vix(vix: float, *, source: str = "fallback", ttl: int = 90) -> None:
    payload = {"vix": vix, "source": source}
    await redis_client.set("market:vix", json.dumps(payload), ex=ttl)


async def get_market_vix() -> dict[str, Any] | None:
    raw = await redis_client.get("market:vix")
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


async def health_snapshot() -> dict[str, str]:
    pong = await redis_client.ping()
    return {"redis": "up" if pong else "down"}
