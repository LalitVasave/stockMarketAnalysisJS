from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncIterator

import asyncpg

from app.config import settings


_pool: asyncpg.Pool | None = None


async def init_pool() -> None:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(settings.database_url, min_size=1, max_size=5)


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_connection() -> AsyncIterator[asyncpg.Connection]:
    if _pool is None:
        await init_pool()
    assert _pool is not None
    async with _pool.acquire() as connection:
        yield connection


def parse_ts(value: str | None) -> datetime:
    """
    Parse ISO timestamps coming from the tick stream.
    Defaults to 'now' if missing/unparseable.
    """
    if not value:
        return datetime.now(timezone.utc)
    try:
        # Handle 'Z' suffix.
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


async def insert_candle_from_tick(symbol: str, payload: dict) -> None:
    """
    Minimal Timescale persistence: treat a tick as a 1-point candle.
    Continuous aggregates can roll this up to 5m/1h later.
    """
    ltp = payload.get("ltp")
    if ltp is None:
        return
    try:
        price = float(ltp)
    except Exception:
        return

    ts = parse_ts(payload.get("ts"))
    volume = payload.get("volume")
    try:
        vol = int(volume) if volume is not None else None
    except Exception:
        vol = None

    async with get_connection() as conn:
        await conn.execute(
            """
            INSERT INTO candles(time, symbol, open, high, low, close, volume)
            VALUES ($1, $2, $3, $3, $3, $3, $4)
            ON CONFLICT (time, symbol) DO UPDATE
            SET close = EXCLUDED.close,
                high  = GREATEST(candles.high, EXCLUDED.high),
                low   = LEAST(candles.low, EXCLUDED.low),
                volume = COALESCE(EXCLUDED.volume, candles.volume)
            """,
            ts,
            symbol,
            price,
            vol,
        )


async def insert_oi_snapshot(
    *,
    symbol: str,
    ts: datetime,
    oi_state: str,
    pcr: float | None,
    delivery_pct: float | None,
    long_oi: int | None,
    short_oi: int | None,
) -> None:
    async with get_connection() as conn:
        await conn.execute(
            """
            INSERT INTO oi_snapshots(time, symbol, long_oi, short_oi, pcr, oi_state, delivery_pct)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (time, symbol) DO UPDATE
            SET long_oi = EXCLUDED.long_oi,
                short_oi = EXCLUDED.short_oi,
                pcr = EXCLUDED.pcr,
                oi_state = EXCLUDED.oi_state,
                delivery_pct = EXCLUDED.delivery_pct
            """,
            ts,
            symbol,
            long_oi,
            short_oi,
            pcr,
            oi_state,
            delivery_pct,
        )


async def insert_prediction(
    *,
    symbol: str,
    ts: datetime,
    direction: int,
    confidence: float,
    vix_discounted: float,
    model_version: str,
) -> None:
    async with get_connection() as conn:
        await conn.execute(
            """
            INSERT INTO predictions(time, symbol, direction, confidence, vix_discounted, model_version)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (time, symbol) DO UPDATE
            SET direction = EXCLUDED.direction,
                confidence = EXCLUDED.confidence,
                vix_discounted = EXCLUDED.vix_discounted,
                model_version = EXCLUDED.model_version
            """,
            ts,
            symbol,
            direction,
            confidence,
            vix_discounted,
            model_version,
        )
