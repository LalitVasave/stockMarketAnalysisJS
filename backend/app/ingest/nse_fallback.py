from __future__ import annotations

from typing import Any


async def fetch_quote_equity(symbol: str) -> dict[str, Any]:
    return {
        "symbol": symbol,
        "source": "mock-fallback",
        "ltp": 2847.5,
        "change_pct": 1.23,
    }
