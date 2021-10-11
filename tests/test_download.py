#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Tests for lsde2021 package."""

import datetime
import os
import tempfile
from dateutil.relativedelta import relativedelta
from typing import List, Tuple

import pytest
from pytest_subtests import SubTests

import lsde2021.download as dl


@pytest.mark.parametrize(
    "start, end, count",
    [
        (
            datetime.date(2021, 1, 1),
            datetime.date(2021, 1, 2),
            5,
        )
    ],
)
def test_date_range(
    subtests: SubTests, start: datetime.date, end: datetime.date, count: int
) -> None:
    date_range = dl.date_range(start, end)
    assert len(list(date_range)) == count


@pytest.mark.parametrize(
    "date, url, path",
    [
        (
            datetime.date(2021, 1, 1),
            (
                "https://dumps.wikimedia.org/other/pageviews/2021/2021-01/pageviews-20210101-080000.gz",
                False,
            ),
            ("2021", "2021-01", "pageviews-20210101-080000.gz"),
        ),
        (
            datetime.date(2021, 1, 16),
            (
                "https://dumps.wikimedia.org/other/pageviews/2021/2021-01/pageviews-20210116-140000.gz",
                False,
            ),
            ("2021", "2021-01", "pageviews-20210116-140000.gz"),
        ),
        (
            datetime.date(2021, 1, 16),
            (
                "https://dumps.wikimedia.org/other/pageviews/2021/2021-01/pageviews-20210116-140000.gz",
                True,
            ),
            ("2021", "2021-01", "pageviews-20210116-140000.gz"),
        ),
    ],
)
def test_wikimedia_downloads(
    subtests: SubTests,
    params: Tuple[datetime.date, bool],
    url: str,
    path: Tuple[str, ...],
) -> None:
    date, monthly = params
    assert dl.wikimedia_pageview_complete_url(date, monthly=monthly) == url
    assert dl.wikimedia_pageview_complete_local_file(date, monthly=monthly) == path


@pytest.mark.parametrize(
    "start, end, urls",
    [
        (
            datetime.date(2021, 1, 1),
            datetime.date(2021, 1, 1),
            False,
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
    start: datetime.date,
    end: datetime.date,
    monthly: bool,
    urls: List[str],
) -> None:
    iv = relativedelta(months=+1) if monthly else relativedelta(days=+1)
    date_range = list(dl.date_range(start, end, interval=iv))
    assert list(
        sorted(
            [
                url
                for _, url in dl.wikimedia_pageview_complete_urls(
                    date_range, monthly=monthly
                )
            ]
        )
    ) == sorted(urls)
