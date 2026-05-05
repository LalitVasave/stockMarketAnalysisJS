from __future__ import annotations

from dataclasses import dataclass


def apply_vix_discount(confidence: float, vix: float) -> float:
    if vix > 25:
        return round(confidence * 0.75, 4)
    if vix > 20:
        return round(confidence * 0.85, 4)
    if vix < 13:
        return round(confidence * 1.05, 4)
    return round(confidence, 4)


@dataclass
class PredictionScores:
    technical_score: float
    oi_alignment: float
    sentiment_score: float
    vix_discount: float


def infer_direction(technical_score: float, oi_score: float, sentiment_score: float, vix: float) -> dict:
    raw_confidence = round((technical_score * 0.35) + (oi_score * 0.35) + (sentiment_score * 0.20) + 0.10, 4)
    discounted = apply_vix_discount(raw_confidence, vix)
    direction = "bullish" if discounted >= 0.66 else "bearish" if discounted <= 0.42 else "neutral"
    return {
        "direction": direction,
        "raw_confidence": raw_confidence,
        "vix_discounted_confidence": discounted,
        "regime": "bull" if discounted >= 0.66 else "bear" if discounted <= 0.42 else "sideways",
        "positioning_alignment": "aligned" if abs(technical_score - oi_score) <= 0.18 else "divergent",
    }
