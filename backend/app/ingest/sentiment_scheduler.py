from __future__ import annotations

import asyncio
import random
from datetime import datetime

from app.sentiment.finbert_worker import score_headlines


POSITIVE = [
    "beats estimates in early channel checks",
    "surges on upgrade and strong guidance",
    "wins new large enterprise deal",
    "raises FY outlook after margin expansion",
]

NEGATIVE = [
    "slides after earnings miss and cautious commentary",
    "cuts guidance amid demand slowdown",
    "faces probe after compliance concerns",
    "misses street expectations on revenue",
]

NEUTRAL = [
    "trades flat as market digests mixed macro signals",
    "holds steady ahead of results",
    "range-bound session with balanced flows",
    "consolidates after recent rally",
]


def _sample_headlines(symbol: str, count: int = 6) -> list[str]:
    items: list[str] = []
    for _ in range(count):
        bucket = random.random()
        if bucket < 0.38:
            items.append(f"{symbol} {random.choice(POSITIVE)}")
        elif bucket < 0.70:
            items.append(f"{symbol} {random.choice(NEUTRAL)}")
        else:
            items.append(f"{symbol} {random.choice(NEGATIVE)}")
    return items


async def run_sentiment_scheduler(*, symbols: list[str], interval_s: float = 60.0) -> None:
    """
    Production-shaped scheduler for demo:
    periodically enqueues Celery tasks to score headlines per symbol.
    """
    while True:
        for symbol in symbols:
            headlines = _sample_headlines(symbol)
            # Celery task enqueue (async-safe, fire-and-forget).
            score_headlines.delay(symbol, headlines)
        await asyncio.sleep(interval_s)

