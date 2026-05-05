from __future__ import annotations

import json
from typing import Any

from redis.asyncio import Redis

from app.config import settings


redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


async def publish_tick(symbol: str, payload: dict[str, Any]) -> None:
    await redis_client.xadd("ticks", {"symbol": symbol, "payload": json.dumps(payload)}, maxlen=50000, approximate=True)


async def set_sentiment(symbol: str, score: float, ttl: int = 3600) -> None:
    await redis_client.set(f"sentiment:{symbol}", score, ex=ttl)


async def health_snapshot() -> dict[str, str]:
    pong = await redis_client.ping()
    return {"redis": "up" if pong else "down"}
