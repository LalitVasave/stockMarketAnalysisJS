from __future__ import annotations

from contextlib import asynccontextmanager
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
