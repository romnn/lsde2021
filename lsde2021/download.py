import datetime
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


def download_wikimedia_file(url: str, destination: PathLike) -> PathLike:
    if Path(destination).exists():
        # skip download
        return destination

    # make sure the directory exists
    Path(destination).parent.mkdir(parents=True, exist_ok=True)

    # download the file
    try:
        with requests.get(url, allow_redirects=True) as data, open(
            destination, "wb"
        ) as out_file:
            out_file.write(data.content)
    except Exception as e:
        print(f"failed to download {url}: {e}")
        print(traceback.format_exc())
    return destination


def download_handler(
    item: Tuple[datetime.datetime, str], dest: PathLike
) -> Tuple[datetime.datetime, PathLike]:
    date, url = item
    filename = Path("/".join(wikimedia_local_file(date)))
    destination = dest / filename
    print(f"downloading {destination}")
    return date, download_wikimedia_file(url, destination=destination)
