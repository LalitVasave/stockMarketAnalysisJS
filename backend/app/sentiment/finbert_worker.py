from __future__ import annotations

from celery import Celery

from app.config import settings
from app.redis_client import set_sentiment


celery = Celery("nse_pulse", broker=settings.redis_url, backend=settings.redis_url)


@celery.task
def score_headlines(symbol: str, headlines: list[str]) -> dict:
    if not headlines:
        return {"symbol": symbol, "score": 0.0, "headline_count": 0}

    positive_bias = sum(1 for headline in headlines if any(token in headline.lower() for token in ["beats", "surges", "upgrade", "wins"]))
    negative_bias = sum(1 for headline in headlines if any(token in headline.lower() for token in ["miss", "slides", "cuts", "probe"]))
    aggregate = round((positive_bias - negative_bias) / max(len(headlines), 1), 3)
    import asyncio

    asyncio.run(set_sentiment(symbol, aggregate, ttl=3600))
    return {"symbol": symbol, "score": aggregate, "headline_count": len(headlines)}
