from __future__ import annotations

import math
from typing import Iterable

import numpy as np


def safe_pct_change(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0
    return (current - previous) / previous


def log_return(current: float, previous: float) -> float:
    if current <= 0 or previous <= 0:
        return 0.0
    return math.log(current / previous)


def zscore(value: float, window: Iterable[float]) -> float:
    sample = np.array(list(window), dtype=float)
    if sample.size == 0:
        return 0.0
    std = float(sample.std())
    if std == 0:
        return 0.0
    return float((value - float(sample.mean())) / std)


def normalize_atr(atr_value: float, close: float) -> float:
    if close == 0:
        return 0.0
    return atr_value / close
