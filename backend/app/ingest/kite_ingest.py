from __future__ import annotations

from datetime import datetime, timezone

from app.redis_client import publish_tick


async def publish_mock_tick(symbol: str, price: float, volume: int, oi: int) -> None:
    await publish_tick(
        symbol,
        {
            "ltp": price,
            "volume": volume,
            "oi": oi,
            "ts": datetime.now(timezone.utc).isoformat(),
        },
    )
