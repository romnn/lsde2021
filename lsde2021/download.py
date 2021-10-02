import datetime
import gzip
import random
import sys
import time
import traceback
from pathlib import Path, PurePosixPath
from typing import Iterable, Optional, Tuple
from urllib.parse import unquote, urlparse

import requests

from lsde2021.types import PathLike


def wikimedia_url(date: datetime.datetime) -> str:
    year = str(date.year)
    month = str(date.month).zfill(2)
    day = str(date.day).zfill(2)
    hour = str(date.hour).zfill(2)
    file = f"{year}/{year}-{month}/pageviews-{year}{month}{day}-{hour}0000.gz"
    return f"https://dumps.wikimedia.org/other/pageviews/{file}"


def wikimedia_local_file(date: datetime.datetime) -> Tuple[str, ...]:
    parsed_url = urlparse(wikimedia_url(date))
    parsed_path = PurePosixPath(unquote(parsed_url.path))
    filename_parts = parsed_path.parts[-3:]
    return filename_parts


def wikimedia_daily_local_file(date: datetime.date) -> Tuple[str, ...]:
    return (f"{date.year}", f"{date.year}-{date.month}-{date.day}.parquet")


def datetime_range(
    start: datetime.datetime,
    end: datetime.datetime,
    interval: Optional[datetime.timedelta] = None,
) -> Iterable[datetime.datetime]:
    iv = interval or datetime.timedelta(hours=1)
    current = start
    yield current
    while current < end:
        current += iv
        yield current


def wikimedia_files(
    dates: Iterable[datetime.datetime],
) -> Iterable[Tuple[datetime.datetime, str]]:
    return zip(dates, map(wikimedia_url, dates))


def can_decompress(file: PathLike, chunk_size: int = 1024) -> bool:
    try:
        with gzip.open(file, "rb") as f:
            _ = f.read()
        return True
    except Exception as e:
        print(e)
    return False


def download_wikimedia_file(
    url: str, destination: PathLike, force: bool = False
) -> PathLike:
    if not force and Path(destination).exists():
        if can_decompress(destination):
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
                if not can_decompress(destination):
                    raise IOError("cannot decompress file")
                break
            except (requests.exceptions.HTTPError, IOError) as e:
                if isinstance(e, requests.exceptions.HTTPError) and not (
                    500 <= e.response.status_code < 600
                ):
                    raise e
                last_error = e
                wait_time = retries * 20
                print(f"waiting {wait_time} seconds ...")
                sys.stdout.flush()
                time.sleep(wait_time)
                retries += 1
            if retries >= 10:
                raise ValueError(
                    f"failed to download after {retries} attempts: {last_error}"
                )
    except Exception as e:
        print(f"failed to download {url}: {e}")
        print(traceback.format_exc())
    return destination


def download_handler(
    item: Tuple[datetime.datetime, str], dest: PathLike, force: bool = False
) -> Tuple[datetime.datetime, PathLike]:
    date, url = item
    filename = Path("/".join(wikimedia_local_file(date)))
    destination = dest / filename
    print(f"downloading {destination}")
    return date, download_wikimedia_file(url, destination=destination, force=force)
