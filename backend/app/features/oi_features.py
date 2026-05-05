from __future__ import annotations


def classify_oi_state(oi_change_pct: float, price_change_pct: float) -> str:
    if oi_change_pct >= 0 and price_change_pct >= 0:
        return "long_buildup"
    if oi_change_pct >= 0 and price_change_pct < 0:
        return "short_buildup"
    if oi_change_pct < 0 and price_change_pct < 0:
        return "long_unwinding"
    return "short_covering"


def oi_price_divergence(oi_change_pct: float, price_change_pct: float) -> float:
    return oi_change_pct - price_change_pct
