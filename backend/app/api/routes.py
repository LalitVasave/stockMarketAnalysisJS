from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, File, Header, HTTPException, UploadFile

from app.config import settings
from app.features.oi_features import classify_oi_state, oi_price_divergence
from app.ml.inference import infer_direction
from app.ml.regime_hmm import infer_regime


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
    return {"vix": 16.8, "regime": "steady", "discount_factor": 1.0}


@router.get("/market/overview")
async def market_overview() -> dict:
    analyses = [build_analysis_row(stock) for stock in MARKET_SYMBOLS]
    return {
        "indices": [
            {"name": "Nifty 50", "value": 22541.2, "change_pct": 0.82},
            {"name": "Bank Nifty", "value": 48772.4, "change_pct": 1.18},
            {"name": "Sensex", "value": 74108.5, "change_pct": 0.69},
        ],
        "stocks": analyses,
        "sentiment_feed": [
            {"symbol": "RELIANCE", "headline": "Reliance retail cadence beats estimates in channel checks", "score": 0.62},
            {"symbol": "INFY", "headline": "Infosys deal pipeline expands as large-cap tech sentiment improves", "score": 0.41},
            {"symbol": "TATAMOTORS", "headline": "Tata Motors margins face scrutiny after mixed export demand data", "score": -0.36},
        ],
    }


@router.get("/stock/{symbol}/analysis")
async def stock_analysis(symbol: str) -> dict:
    stock = next((item for item in MARKET_SYMBOLS if item["symbol"] == symbol.upper()), MARKET_SYMBOLS[0])
    analysis = build_analysis_row(stock)
    analysis["prediction_history"] = [
        {
            "timestamp": (datetime.now(IST) - timedelta(minutes=index * 15)).isoformat(),
            "predicted_direction": "bullish" if index % 3 else "bearish",
            "confidence": round(0.58 + ((9 - index) * 0.02), 2),
            "actual_outcome": "up" if index % 4 else "down",
            "hit": index % 4 != 0,
        }
        for index in range(10)
    ]
    analysis["oi_history"] = [
        {
            "date": (datetime.now(IST) - timedelta(days=index)).date().isoformat(),
            "long_buildup": 42 + index,
            "short_covering": 18 + (index % 5),
            "long_unwinding": 14 + (index % 4),
            "short_buildup": 26 + (index % 6),
            "pcr": round(0.72 + (index * 0.01), 2),
            "delivery_pct": round(34 + (index * 0.6), 1),
        }
        for index in range(20)
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
    filtered = [build_analysis_row(stock) for stock in MARKET_SYMBOLS if stock["sector"].lower() == sector.lower()]
    return {"sector": sector, "items": filtered if filtered else [build_analysis_row(stock) for stock in MARKET_SYMBOLS]}


@router.post("/stock/{symbol}/watchlist", status_code=201)
async def add_watchlist(symbol: str) -> dict:
    return {"status": "created", "symbol": symbol.upper()}
