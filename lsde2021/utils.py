import bz2
import gzip
import chardet
import numpy as np
from pathlib import Path
from contextlib import contextmanager
import typing
from typing import Dict, Union, Iterator, List
from lsde2021.types import PathLike


@typing.no_type_check
@contextmanager
def fopen(path: PathLike, **options: Dict[str, int]) -> Iterator[None]:
    extension = Path(path).suffix
    open_func = open
    if extension == ".gz":
        open_func = gzip.open
    elif extension == ".bz2":
        open_func = bz2.open
    with open_func(path, **options) as f:
        yield f


def smoothing_window(
    vals: Union[np.array, List[int], List[float]], radius: int = 50
) -> np.array:
    cumvals = np.array(vals).cumsum()
    return (cumvals[radius:] - cumvals[:-radius]) / radius


def detect_encoding(path: PathLike, n: int = 50_000) -> Dict[str, Union[str, int]]:
    with fopen(
        path,
        mode="rb",
    ) as input_file:
        guess = chardet.detect(input_file.read(n))
        return dict(
            encoding=guess["encoding"],
            confidence=guess["confidence"],
        )


def strip_extension(path: PathLike) -> PathLike:
    path = Path(path).with_suffix("")
    while path.suffix != "":
        path = Path(path).with_suffix("")
    return path
