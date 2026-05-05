from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Iterator, Sequence


@dataclass
class WalkForwardSplit:
    train_indices: list[int]
    test_indices: list[int]


def expanding_window_splits(length: int, min_train: int, test_size: int) -> Iterator[WalkForwardSplit]:
    start = min_train
    while start + test_size <= length:
        yield WalkForwardSplit(
            train_indices=list(range(0, start)),
            test_indices=list(range(start, start + test_size)),
        )
        start += test_size


def validate_no_leakage(feature_columns: Sequence[str]) -> list[str]:
    flagged = [column for column in feature_columns if "future" in column.lower() or "lead" in column.lower()]
    return flagged
