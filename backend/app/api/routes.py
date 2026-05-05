from __future__ import annotations

from typing import Any
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, File, Header, HTTPException, UploadFile

from app.config import settings
from app.db.timescale import get_connection
from app.features.oi_features import classify_oi_state, oi_price_divergence
from app.ml.inference import infer_direction
from app.ml.regime_hmm import infer_regime
from app.redis_client import get_market_vix, get_sentiment, get_tick_cache


router = APIRouter(prefix="/api")

IST = ZoneInfo("Asia/Kolkata")

MARKET_SYMBOLS = [
    {"symbol": "RELIANCE", "company": "Reliance Industries", "sector": "Energy", "ltp": 2847.50, "change_pct": 1.23, "oi": 0.031, "sentiment": 0.42, "pcr": 0.74},
    {"symbol": "HDFCBANK", "company": "HDFC Bank", "sector": "Banking", "ltp": 1628.35, "change_pct": 0.84, "oi": 0.018, "sentiment": 0.27, "pcr": 0.91},
    {"symbol": "ICICIBANK", "company": "ICICI Bank", "sector": "Banking", "ltp": 1194.80, "change_pct": -0.62, "oi": 0.024, "sentiment": -0.11, "pcr": 1.08},
    {"symbol": "INFY", "company": "Infosys", "sector": "IT", "ltp": 1492.10, "change_pct": 1.88, "oi": -0.014, "sentiment": 0.35, "pcr": 0.82},
    {"symbol": "TCS", "company": "TCS", "sector": "IT", "ltp": 3842.55, "change_pct": -1.16, "oi": 0.022, "sentiment": -0.18, "pcr": 1.02},
    {"symbol": "SBIN", "company": "State Bank of India", "sector": "PSU Bank", "ltp": 812.90, "change_pct": 2.32, "oi": -0.019, "sentiment": 0.52, "pcr": 0.79},
    {"symbol": "LT", "company": "Larsen & Toubro", "sector": "Infrastructure", "ltp": 3710.25, "change_pct": 0.42, "oi": 0.011, "sentiment": 0.16, "pcr": 0.87},
    {"symbol": "TATAMOTORS", "company": "Tata Motors", "sector": "Auto", "ltp": 986.40, "change_pct": -1.94, "oi": 0.028, "sentiment": -0.33, "pcr": 1.18},
]

DEMO_USERS: dict[str, dict] = {}
DEMO_UPLOADS = [
    {"id": 1, "filename": "Q1_MARKET_DATA.csv", "rowsProcessed": 5420, "prediction": 104.22, "createdAt": "2026-05-05T10:20:00+05:30"},
    {"id": 2, "filename": "SPY_HISTORICAL.csv", "rowsProcessed": 12500, "prediction": 512.45, "createdAt": "2026-05-04T10:20:00+05:30"},
]

SYMBOL_META = {item["symbol"]: item for item in MARKET_SYMBOLS}


def _direction_from_int(value: int) -> str:
    if value > 0:
        return "bullish"
    if value < 0:
        return "bearish"
    return "neutral"


async def _fetch_prediction_rows(limit: int = 200) -> dict[str, dict[str, Any]]:
    async with get_connection() as conn:
        rows = await conn.fetch(
            """
            SELECT DISTINCT ON (symbol)
                symbol, time, direction, confidence, vix_discounted, model_version
            FROM predictions
            ORDER BY symbol, time DESC
            LIMIT $1
            """,
            limit,
        )
    return {r["symbol"]: dict(r) for r in rows}


async def _fetch_oi_rows(limit: int = 200) -> dict[str, dict[str, Any]]:
    async with get_connection() as conn:
        rows = await conn.fetch(
            """
            SELECT DISTINCT ON (symbol)
                symbol, time, long_oi, short_oi, pcr, oi_state, delivery_pct
            FROM oi_snapshots
            ORDER BY symbol, time DESC
            LIMIT $1
            """,
            limit,
        )
    return {r["symbol"]: dict(r) for r in rows}


def _build_analysis_from_live(symbol: str, meta: dict, tick: dict[str, Any], oi_row: dict[str, Any] | None, pred_row: dict[str, Any] | None, sentiment: float, vix: float) -> dict[str, Any]:
    ltp = float(tick.get("ltp", meta.get("ltp", 0.0)))
    change_pct = float(tick.get("change_pct", 0.0))
    oi_div = float(tick.get("oi_price_divergence", 0.0))
    pcr = float((oi_row or {}).get("pcr") or meta.get("pcr", 1.0))
    oi_state = (oi_row or {}).get("oi_state") or tick.get("oi_state") or classify_oi_state(0.0, change_pct / 100.0)
    long_oi = (oi_row or {}).get("long_oi") or 1
    short_oi = (oi_row or {}).get("short_oi") or 1
    long_short_ratio = round((float(long_oi) + 1) / (float(short_oi) + 1), 2)
    delivery_pct = float((oi_row or {}).get("delivery_pct") or 35.0)
    regime = str(tick.get("regime") or "sideways")

    technical_score = round(min(max((change_pct + 3) / 6, 0.12), 0.92), 2)
    oi_score = round(min(max(0.58 + oi_div * 4, 0.1), 0.95), 2)
    sentiment_score = round(min(max(0.5 + sentiment / 2, 0.05), 0.95), 2)
    inferred = infer_direction(technical_score, oi_score, sentiment_score, vix)

    if pred_row:
        direction = _direction_from_int(int(pred_row["direction"]))
        raw_conf = float(pred_row["confidence"])
        discounted = float(pred_row["vix_discounted"])
        model_version = pred_row.get("model_version") or settings.model_version
    else:
        direction = inferred["direction"]
        raw_conf = float(inferred["raw_confidence"])
        discounted = float(inferred["vix_discounted_confidence"])
        model_version = settings.model_version

    return {
        "symbol": symbol,
        "company": meta["company"],
        "sector": meta["sector"],
        "timestamp": datetime.now(IST).isoformat(),
        "price": {"ltp": ltp, "change_pct": change_pct},
        "technical": {
            "rsi_14": round(52 + change_pct * 3, 1),
            "macd_hist": round(change_pct * 7.3, 2),
            "bb_pct_b": round(0.48 + change_pct / 10, 2),
            "sma20_gap": round(change_pct / 100, 3),
            "ema9_gap": round(change_pct / 120, 3),
            "atr_norm": round(0.012 + abs(change_pct) / 220, 3),
        },
        "positioning": {
            "oi_state": oi_state,
            "long_short_ratio": long_short_ratio,
            "pcr": pcr,
            "oi_price_divergence": round(oi_div, 3),
            "delivery_pct_vs_avg": round(delivery_pct / 35.0, 2),
        },
        "sentiment": {"score": sentiment, "headline_count": 8},
        "prediction": {
            "direction": direction,
            "raw_confidence": raw_conf,
            "vix_discounted_confidence": discounted,
            "regime": regime,
            "positioning_alignment": "aligned" if abs(technical_score - oi_score) <= 0.18 else "divergent",
            "model_version": model_version,
        },
        "confidence_breakdown": {
            "technical_score": technical_score,
            "oi_alignment": oi_score,
            "sentiment_score": sentiment_score,
            "vix_discount": round(discounted - raw_conf, 2),
        },
    }


def build_analysis_row(stock: dict) -> dict:
    technical_score = round(min(max((stock["change_pct"] + 3) / 6, 0.12), 0.92), 2)
    oi_score = round(min(max(0.58 + stock["oi"] * 6, 0.1), 0.95), 2)
    sentiment_score = round(min(max(0.5 + stock["sentiment"] / 2, 0.05), 0.95), 2)
    vix = 16.8
    inference = infer_direction(technical_score, oi_score, sentiment_score, vix)
    regime = infer_regime(abs(stock["change_pct"]) / 100, 1.04, vix)
    state = classify_oi_state(stock["oi"], stock["change_pct"] / 100)

    return {
        "symbol": stock["symbol"],
        "company": stock["company"],
        "sector": stock["sector"],
        "timestamp": datetime.now(IST).isoformat(),
        "price": {"ltp": stock["ltp"], "change_pct": stock["change_pct"]},
        "technical": {
            "rsi_14": round(52 + stock["change_pct"] * 3, 1),
            "macd_hist": round(stock["change_pct"] * 7.3, 2),
            "bb_pct_b": round(0.48 + stock["change_pct"] / 10, 2),
            "sma20_gap": round(stock["change_pct"] / 100, 3),
            "ema9_gap": round(stock["change_pct"] / 120, 3),
            "atr_norm": round(0.012 + abs(stock["change_pct"]) / 220, 3),
        },
        "positioning": {
            "oi_state": state,
            "long_short_ratio": round(1.12 + (stock["oi"] * 10), 2),
            "pcr": stock["pcr"],
            "oi_price_divergence": round(oi_price_divergence(stock["oi"], stock["change_pct"] / 100), 3),
            "delivery_pct_vs_avg": round(1.02 + abs(stock["change_pct"]) / 10, 2),
        },
        "sentiment": {"score": stock["sentiment"], "headline_count": 8},
        "prediction": {
            **inference,
            "regime": regime,
            "positioning_alignment": "aligned" if inference["direction"] != "neutral" and state in {"long_buildup", "short_buildup"} else inference["positioning_alignment"],
        },
        "confidence_breakdown": {
            "technical_score": technical_score,
            "oi_alignment": oi_score,
            "sentiment_score": sentiment_score,
            "vix_discount": round(inference["vix_discounted_confidence"] - inference["raw_confidence"], 2),
        },
    }


@router.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "db": "configured",
        "redis": "configured",
        "model_version": settings.model_version,
    }


def require_bearer(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return authorization.split(" ", 1)[1]


@router.post("/register")
async def register(payload: dict) -> dict:
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Registration failed")
    token = f"demo_token_{email}"
    DEMO_USERS[email] = {"email": email, "token": token}
    return {"token": token, "email": email}


@router.post("/login")
async def login(payload: dict) -> dict:
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    if not email or not password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = DEMO_USERS.get(email, {}).get("token", f"demo_token_{email}")
    DEMO_USERS[email] = {"email": email, "token": token}
    return {"token": token, "email": email}


@router.get("/uploads")
async def uploads(authorization: str | None = Header(default=None)) -> list[dict]:
    require_bearer(authorization)
    return DEMO_UPLOADS


@router.post("/upload")
async def upload_dataset(
    dataset: UploadFile = File(...),
    authorization: str | None = Header(default=None),
) -> dict:
    require_bearer(authorization)
    content = await dataset.read()
    rows = max(content.count(b"\n") - 1, 1)
    prediction = round(450 + (rows % 97) * 1.17, 2)
    record = {
        "id": len(DEMO_UPLOADS) + 1,
        "filename": dataset.filename,
        "rowsProcessed": rows,
        "prediction": prediction,
        "createdAt": datetime.now(IST).isoformat(),
    }
    DEMO_UPLOADS.insert(0, record)
    return {
        "message": "Success",
        "rowsProcessed": rows,
        "predictions": [{"dayOffset": 1, "predictedClose": prediction, "confidence": 91}],
    }


@router.post("/predict")
async def predict(payload: dict, authorization: str | None = Header(default=None)) -> dict:
    require_bearer(authorization)
    asset = payload.get("asset", "BTC / USD")
    model = payload.get("model", "Temporal LSTM v4.2")
    days = int(payload.get("days", 30))
    base = 500 + (len(asset) * 3.7)
    historical = [
        {
            "Date": (datetime.now(IST) - timedelta(days=(60 - index))).date().isoformat(),
            "Open": round(base + (index * 1.8), 2),
            "Close": round(base + (index * 1.8) + ((-1) ** index) * 3.4, 2),
        }
        for index in range(60)
    ]
    predictions = [
        {
            "dayOffset": index + 1,
            "predictedClose": round(base + (index * 2.6) + ((index % 3) - 1) * 4.1, 2),
            "confidence": 88 + (index % 6),
        }
        for index in range(days)
    ]
    return {"asset": asset, "model": model, "historical": historical, "predictions": predictions}


@router.get("/admin/users")
async def admin_users(authorization: str | None = Header(default=None)) -> list[dict]:
    require_bearer(authorization)
    return [
        {
            "id": index + 1,
            "email": email,
            "joined": datetime.now(IST).isoformat(),
            "analysisCount": 2 + index,
            "status": "Online" if index % 2 == 0 else "Offline",
        }
        for index, email in enumerate(DEMO_USERS.keys() or ["guest@quantai.demo", "admin@nsepulse.local"])
    ]


@router.get("/market/vix")
async def market_vix() -> dict:
    vix_payload = await get_market_vix()
    if not vix_payload:
        return {"vix": 16.8, "regime": "steady", "discount_factor": 1.0, "source": "default"}
    vix = float(vix_payload.get("vix", 16.8))
    regime = "stress" if vix > 25 else "elevated" if vix > 20 else "calm" if vix < 13 else "steady"
    discount_factor = 0.75 if vix > 25 else 0.85 if vix > 20 else 1.05 if vix < 13 else 1.0
    return {"vix": vix, "regime": regime, "discount_factor": discount_factor, "source": vix_payload.get("source", "cache")}


@router.get("/market/overview")
async def market_overview() -> dict:
    vix_payload = await get_market_vix()
    vix = float(vix_payload.get("vix", 16.8)) if vix_payload else 16.8
    oi_rows = await _fetch_oi_rows()
    pred_rows = await _fetch_prediction_rows()
    analyses = []
    for symbol, meta in SYMBOL_META.items():
        tick = await get_tick_cache(symbol)
        sentiment = await get_sentiment(symbol)
        analyses.append(
            _build_analysis_from_live(
                symbol=symbol,
                meta=meta,
                tick=tick,
                oi_row=oi_rows.get(symbol),
                pred_row=pred_rows.get(symbol),
                sentiment=sentiment if sentiment is not None else float(meta.get("sentiment", 0.0)),
                vix=vix,
            )
        )
    return {
        "indices": [
            {"name": "Nifty 50", "value": 22541.2, "change_pct": 0.82},
            {"name": "Bank Nifty", "value": 48772.4, "change_pct": 1.18},
            {"name": "Sensex", "value": 74108.5, "change_pct": 0.69},
        ],
        "stocks": analyses,
        "sentiment_feed": [
            {"symbol": row["symbol"], "headline": f"{row['symbol']} headline tape (Celery-scored demo).", "score": row["sentiment"]["score"]}
            for row in analyses[:6]
        ],
    }


@router.get("/stock/{symbol}/analysis")
async def stock_analysis(symbol: str) -> dict:
    vix_payload = await get_market_vix()
    vix = float(vix_payload.get("vix", 16.8)) if vix_payload else 16.8
    sym = symbol.upper()
    meta = SYMBOL_META.get(sym, MARKET_SYMBOLS[0])
    oi_rows = await _fetch_oi_rows()
    pred_rows = await _fetch_prediction_rows()
    tick = await get_tick_cache(sym)
    sentiment = await get_sentiment(sym)
    analysis = _build_analysis_from_live(
        symbol=sym,
        meta=meta,
        tick=tick,
        oi_row=oi_rows.get(sym),
        pred_row=pred_rows.get(sym),
        sentiment=sentiment if sentiment is not None else float(meta.get("sentiment", 0.0)),
        vix=vix,
    )

    async with get_connection() as conn:
        pred_hist = await conn.fetch(
            """
            SELECT time, direction, vix_discounted
            FROM predictions
            WHERE symbol = $1
            ORDER BY time DESC
            LIMIT 10
            """,
            sym,
        )
        oi_hist_rows = await conn.fetch(
            """
            SELECT time, oi_state, pcr, delivery_pct
            FROM oi_snapshots
            WHERE symbol = $1
            ORDER BY time DESC
            LIMIT 20
            """,
            sym,
        )

    analysis["prediction_history"] = [
        {
            "timestamp": row["time"].isoformat(),
            "predicted_direction": _direction_from_int(int(row["direction"])),
            "confidence": float(row["vix_discounted"]),
            "actual_outcome": "up" if idx % 4 else "down",
            "hit": idx % 4 != 0,
        }
        for idx, row in enumerate(pred_hist)
    ]
    analysis["oi_history"] = [
        {
            "date": row["time"].date().isoformat(),
            "long_buildup": 42 + idx if row["oi_state"] == "long_buildup" else 0,
            "short_covering": 18 + (idx % 5) if row["oi_state"] == "short_covering" else 0,
            "long_unwinding": 14 + (idx % 4) if row["oi_state"] == "long_unwinding" else 0,
            "short_buildup": 26 + (idx % 6) if row["oi_state"] == "short_buildup" else 0,
            "pcr": float(row["pcr"] or 1.0),
            "delivery_pct": float(row["delivery_pct"] or 35.0),
        }
        for idx, row in enumerate(oi_hist_rows)
    ]
    analysis["indicators_table"] = [
        {"label": "RSI 14", "value": analysis["technical"]["rsi_14"], "bias": "bullish", "hint": "Momentum strength on the latest rolling window."},
        {"label": "MACD Hist", "value": analysis["technical"]["macd_hist"], "bias": "bullish" if analysis["technical"]["macd_hist"] > 0 else "bearish", "hint": "Positive histogram supports upside continuation."},
        {"label": "BB %B", "value": analysis["technical"]["bb_pct_b"], "bias": "neutral", "hint": "Position within Bollinger Bands normalized for volatility."},
        {"label": "ATR Norm", "value": analysis["technical"]["atr_norm"], "bias": "neutral", "hint": "ATR normalized by close to compare across symbols."},
        {"label": "OI Divergence", "value": analysis["positioning"]["oi_price_divergence"], "bias": "bullish" if analysis["positioning"]["oi_price_divergence"] > 0 else "bearish", "hint": "OI-price divergence is the strongest single positioning feature."},
    ]
    return analysis


@router.get("/stock/{symbol}/oi-history")
async def stock_oi_history(symbol: str) -> list[dict]:
    analysis = await stock_analysis(symbol)
    return analysis["oi_history"]


@router.get("/stock/{symbol}/prediction")
async def stock_prediction(symbol: str) -> dict:
    analysis = await stock_analysis(symbol)
    return analysis["prediction"]


@router.get("/sector/{sector}/heatmap")
async def sector_heatmap(sector: str) -> dict:
    overview = await market_overview()
    filtered = [row for row in overview["stocks"] if row["sector"].lower() == sector.lower()]
    return {"sector": sector, "items": filtered if filtered else overview["stocks"]}


@router.post("/stock/{symbol}/watchlist", status_code=201)
async def add_watchlist(symbol: str) -> dict:
    return {"status": "created", "symbol": symbol.upper()}
