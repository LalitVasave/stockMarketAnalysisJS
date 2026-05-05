from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.db.timescale import close_pool, init_pool
from app.ingest.mock_stream import run_mock_tick_stream
from app.ingest.oi_poller import run_oi_poller
from app.ingest.sentiment_scheduler import run_sentiment_scheduler
from app.ingest.vix_poller import run_vix_poller
from app.ml.live_inference import run_live_inference


@asynccontextmanager
async def lifespan(_: FastAPI):
    mock_task = None
    oi_task = None
    sentiment_task = None
    inference_task = None
    vix_task = None
    try:
        await init_pool()
    except Exception:
        if settings.app_env != "development":
            raise
    if settings.allow_mock_data:
        mock_task = asyncio.create_task(run_mock_tick_stream())
        vix_task = asyncio.create_task(run_vix_poller(interval_s=settings.vix_poll_interval_s))
        oi_task = asyncio.create_task(
            run_oi_poller(
                symbols=["RELIANCE", "HDFCBANK", "ICICIBANK", "INFY", "TCS", "SBIN", "LT", "TATAMOTORS"],
                interval_s=settings.oi_poll_interval_s,
            )
        )
        sentiment_task = asyncio.create_task(
            run_sentiment_scheduler(
                symbols=["RELIANCE", "HDFCBANK", "ICICIBANK", "INFY", "TCS", "SBIN", "LT", "TATAMOTORS"],
                interval_s=45.0,
            )
        )
        inference_task = asyncio.create_task(
            run_live_inference(
                symbols=["RELIANCE", "HDFCBANK", "ICICIBANK", "INFY", "TCS", "SBIN", "LT", "TATAMOTORS"],
                interval_s=settings.inference_interval_s,
            )
        )
    yield
    if mock_task:
        mock_task.cancel()
    if oi_task:
        oi_task.cancel()
    if sentiment_task:
        sentiment_task.cancel()
    if inference_task:
        inference_task.cancel()
    if vix_task:
        vix_task.cancel()
    await close_pool()


app = FastAPI(title=settings.app_name, version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
