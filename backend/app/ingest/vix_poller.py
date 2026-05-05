from __future__ import annotations

import asyncio
import random

import httpx

from app.redis_client import set_market_vix


async def _fetch_nse_vix() -> float | None:
    """
    Best-effort NSE VIX fetch. Falls back gracefully if unavailable/rate-limited.
    """
    url = "https://www.nseindia.com/api/allIndices"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://www.nseindia.com/",
    }
    try:
        async with httpx.AsyncClient(timeout=6.0, headers=headers, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            for row in data.get("data", []):
                index_name = str(row.get("index", "")).upper()
                if "VIX" in index_name:
                    value = row.get("last")
                    if value is not None:
                        return float(value)
    except Exception:
        return None
    return None


async def run_vix_poller(*, interval_s: float = 30.0) -> None:
    last_vix = 16.8
    while True:
        live_vix = await _fetch_nse_vix()
        if live_vix is not None:
            last_vix = round(float(live_vix), 2)
            await set_market_vix(last_vix, source="nse", ttl=max(60, int(interval_s * 3)))
        else:
            # Soft fallback around last known level.
            last_vix = round(max(10.0, min(32.0, last_vix + (random.random() - 0.5) * 0.4)), 2)
            await set_market_vix(last_vix, source="fallback", ttl=max(60, int(interval_s * 3)))
        await asyncio.sleep(interval_s)

