#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Tests for lsde2021 package."""

import datetime
import os
import tempfile
from typing import List, Tuple

import pytest
from pytest_subtests import SubTests

import lsde2021.download as dl


@pytest.mark.parametrize(
    "start, end, count",
    [
        (
            datetime.datetime(2021, 1, 1, hour=8),
            datetime.datetime(2021, 1, 1, hour=12),
            5,
        )
    ],
)
def test_datetime_range(
    subtests: SubTests, start: datetime.datetime, end: datetime.datetime, count: int
) -> None:
    date_range = dl.datetime_range(start, end)
    assert len(list(date_range)) == count


@pytest.mark.parametrize(
    "date, url, path",
    [
        (
            datetime.datetime(2021, 1, 1, hour=8),
            "https://dumps.wikimedia.org/other/pageviews/2021/2021-01/pageviews-20210101-080000.gz",
            ("2021", "2021-01", "pageviews-20210101-080000.gz"),
        ),
        (
            datetime.datetime(2021, 1, 16, hour=14),
            "https://dumps.wikimedia.org/other/pageviews/2021/2021-01/pageviews-20210116-140000.gz",
            ("2021", "2021-01", "pageviews-20210116-140000.gz"),
        ),
    ],
)
def test_wikimedia_downloads(
    subtests: SubTests, date: datetime.datetime, url: str, path: Tuple[str, ...]
) -> None:
    assert dl.wikimedia_url(date) == url
    assert dl.wikimedia_local_file(date) == path


@pytest.mark.parametrize(
    "start, end, urls",
    [
        (
            datetime.datetime(2021, 1, 1, hour=8),
            datetime.datetime(2021, 1, 1, hour=10),
            [
                "https://dumps.wikimedia.org/other/pageviews/2021/2021-01/pageviews-20210101-080000.gz",
                "https://dumps.wikimedia.org/other/pageviews/2021/2021-01/pageviews-20210101-090000.gz",
                "https://dumps.wikimedia.org/other/pageviews/2021/2021-01/pageviews-20210101-100000.gz",
            ],
        )
    ],
)
def test_wikimedia_files(
    subtests: SubTests,
    start: datetime.datetime,
    end: datetime.datetime,
    urls: List[str],
) -> None:
    date_range = list(dl.datetime_range(start, end))
    assert list(sorted([url for _, url in dl.wikimedia_files(date_range)])) == sorted(
        urls
    )
