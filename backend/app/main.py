from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.db.timescale import close_pool, init_pool


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        await init_pool()
    except Exception:
        if settings.app_env != "development":
            raise
    yield
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
