from __future__ import annotations

from app.features.oi_features import classify_oi_state, oi_price_divergence


def build_oi_snapshot(symbol: str, oi_change_pct: float, price_change_pct: float) -> dict:
    return {
        "symbol": symbol,
        "oi_state": classify_oi_state(oi_change_pct, price_change_pct),
        "oi_price_divergence": oi_price_divergence(oi_change_pct, price_change_pct),
    }
