from __future__ import annotations


def infer_regime(volatility: float, volume_trend: float, vix: float) -> str:
    if vix > 23 or volatility > 0.028:
        return "bear"
    if volume_trend > 1.08 and volatility < 0.02:
        return "bull"
    return "sideways"
