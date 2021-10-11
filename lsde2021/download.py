import datetime
import random
import sys
import bz2
import time
import traceback
import itertools
from functools import partial
from pathlib import Path, PurePosixPath
from typing import Iterable, Union, Optional, Tuple, Callable, Literal, List
from urllib.parse import unquote, urlparse
from dateutil.relativedelta import relativedelta

import requests

from lsde2021.types import PathLike


class ValidationException(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class CorruptFile(ValidationException):
    def __init__(self, path: PathLike):
        self.message = f"file {path} is corrupt and could not be decompressed"
        super().__init__(self.message)


def wikimedia_pageview_complete_url(
    date: datetime.date,
    monthly: bool = False,
    kind: str = "user",
) -> str:
    year = str(date.year)
    month = str(date.month).zfill(2)
    day = str(date.day).zfill(2)
    base = "monthly" if monthly else ""
    datestr = f"{year}{month}" if monthly else f"{year}{month}{day}"
    loc = f"{year}/{year}-{month}/pageviews-{datestr}-{kind}.bz2"
    return f"https://dumps.wikimedia.org/other/pageview_complete/{base}/{loc}"


WIKIMEDIA_TABLES = Literal["langlinks", "page", "category", "categorylinks"]


def wikimedia_sql_dump_url(
    date: datetime.date,
    wiki: str,
    table: WIKIMEDIA_TABLES,
) -> str:
    year = str(date.year)
    month = str(date.month).zfill(2)
    day = str(date.day).zfill(2)
    datestr = f"{year}{month}{day}"
    return (
        f"https://dumps.wikimedia.org/{wiki}/{datestr}/{wiki}-{datestr}-{table}.sql.gz"
    )


def wikimedia_sql_dump_local_file(
    date: datetime.date,
    wiki: str,
    table: WIKIMEDIA_TABLES,
) -> Tuple[str, ...]:
    parsed_url = urlparse(wikimedia_sql_dump_url(date, wiki=wiki, table=table))
    parsed_path = PurePosixPath(unquote(parsed_url.path))
    filename_parts = parsed_path.parts[1:]
    return filename_parts


def wikimedia_pageview_complete_local_file(
    date: datetime.date, monthly: bool = False, kind: str = "user"
) -> Tuple[str, ...]:
    parsed_url = urlparse(
        wikimedia_pageview_complete_url(date, monthly=monthly, kind=kind)
    )
    parsed_path = PurePosixPath(unquote(parsed_url.path))
    filename_parts = parsed_path.parts[3:]
    return filename_parts


def date_range(
    start: datetime.date,
    end: datetime.date,
    interval: Optional[Union[datetime.timedelta, relativedelta]] = None,
) -> Iterable[datetime.date]:
    iv = interval or relativedelta(days=+1)
    current = start
    yield current
    while current < end:
        current += iv
        yield current


def datetime_range(
    start: datetime.datetime,
    end: datetime.datetime,
    interval: Optional[Union[datetime.timedelta, relativedelta]] = None,
) -> Iterable[datetime.datetime]:
    iv = interval or relativedelta(days=+1)
    current = start
    yield current
    while current < end:
        current += iv
        yield current


def wikimedia_pageview_complete_urls(
    dates: Iterable[datetime.date], monthly: bool = False, kind: str = "user"
) -> Iterable[Tuple[datetime.date, str]]:
    return list(
        zip(
            dates,
            map(
                partial(wikimedia_pageview_complete_url, monthly=monthly, kind=kind),
                dates,
            ),
        )
    )


def wikimedia_sql_dump_urls(
    dates: Iterable[datetime.date],
    wikis: List[str],
    tables: List[WIKIMEDIA_TABLES],
) -> Iterable[Tuple[Tuple[datetime.date, str, str], str]]:
    params = list(itertools.product(dates, wikis, tables))
    return list(zip(params, itertools.starmap(wikimedia_sql_dump_url, params)))


def can_decompress_bz2(path: PathLike) -> bool:
    try:
        with open(path, "rb") as f:
            decompressor = bz2.BZ2Decompressor()
            for data in iter(lambda: f.read(100 * 1024), b""):
                _ = decompressor.decompress(data)
        return True
    except Exception as e:
        raise e
    return False


def download_file(
    url: str,
    destination: PathLike,
    force: bool = False,
    max_retries: int = 20,
    validate_file_func: Optional[Callable[[PathLike], bool]] = None,
) -> PathLike:
    if not force and Path(destination).exists():
        if not validate_file_func or validate_file_func(destination):
            print(f"using existing file {destination} ...")
            # skip download
            return destination

    # make sure the directory exists
    Path(destination).parent.mkdir(parents=True, exist_ok=True)

    user_agents = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 11.6; rv:92.0) Gecko/20100101 Firefox/92.0"
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
        "Mozilla/5.0 (X11; Linux i686; rv:92.0) Gecko/20100101 Firefox/92.0",
        "Mozilla/5.0 (Linux x86_64; rv:92.0) Gecko/20100101 Firefox/92.0",
        "Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:92.0) Gecko/20100101 Firefox/92.0",
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:92.0) Gecko/20100101 Firefox/92.0",
        "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:92.0) Gecko/20100101 Firefox/92.0",
    ]

    # use unsuspiscious user agent header
    headers = {"User-Agent": random.choice(user_agents)}

    print(f"downloading file {destination} ...")

    # download the file
    try:
        last_error = None
        retries = 1
        while True:
            try:
                with requests.get(
                    url, headers=headers, stream=True, allow_redirects=True
                ) as r:
                    r.raise_for_status()
                    with open(destination, "wb") as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                # check if the file is fine
                if validate_file_func and not validate_file_func(destination):
                    raise ValidationException(
                        f"failed to validate downloaded file from {url}"
                    )
                break
            except (requests.exceptions.RequestException, ValidationException) as e:
                if isinstance(e, requests.exceptions.HTTPError):
                    if not (500 <= e.response.status_code < 600):
                        raise e
                elif isinstance(e, ValidationException):
                    pass
                else:
                    raise e
                last_error = e
                wait_time = retries * 20
                print(f"waiting {wait_time} seconds ...")
                sys.stdout.flush()
                time.sleep(wait_time)
                retries += 1
            if retries >= max_retries:
                raise ValueError(
                    f"failed to download after {retries} attempts: {last_error}"
                )
    except Exception as e:
        print(f"failed to download {url}: {e}")
        print(traceback.format_exc())
    return destination
