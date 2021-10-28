import csv
import pandas as pd
from typing import Type, Dict, Union, Optional, Any
from lsde2021.types import PathLike
import lsde2021.utils as utils


PAGEVIEW_COLUMNS = [
    "wiki_code",
    "page_title",
    "page_id",
    "user_client",
    "daily_total",
    "hourly_count",
]

PAGE_COLUMNS = [
    "page_id",
    "page_namespace",
    "page_title",
    "page_restrictions",
    # "page_counter", # deprecated and no longer in the files!
    "page_is_redirect",
    "page_is_new",
    "page_random",
    "page_touched",
    "page_links_updated",
    "page_latest",
    "page_len",
    "page_content_model",
    "page_lang",
]

CATEGORY_COLUMNS = [
    "cat_id",
    "cat_title",
    "cat_pages",
    "cat_subcats",
    "cat_files",
    # "cat_hidden", # deprecated, no longer in the files!
]

CATEGORYLINKS_COLUMNS = [
    "page_id",
    "category_name",
    "sortkey",
    "timestamp",
    "sortkey_prefix",
    "collation",
    "type",
]

LANGLINKS_COLUMNS = [
    "page_id",
    "lang",
    "lang_title",
]

LANGLINKS_DTYPE = {
    "page_id": "int",
    "lang": "category",
    "lang_title": "string",
}

RAW_LANGLINKS_DTYPE = {
    "page_id": "string",
    "lang": "string",
    "lang_title": "string",
}

CATEGORY_DTYPE = {
    "cat_id": "int",
    "cat_title": "string",
    "cat_pages": "int",
    "cat_subcats": "int",
    "cat_files": "int",
    # "cat_hidden": "string",
}

RAW_CATEGORY_DTYPE = {
    "cat_id": "string",
    "cat_title": "string",
    "cat_pages": "string",
    "cat_subcats": "string",
    "cat_files": "string",
    # "cat_hidden": "string",
}


CATEGORYLINKS_DTYPE = {
    "page_id": "Int64",
    "category_name": "string",
    "sortkey": "category",
    "timestamp": "string",
    "sortkey_prefix": "category",
    "collation": "category",
    "type": "category",
}

RAW_CATEGORYLINKS_DTYPE = {
    "page_id": "category",
    "category_name": "string",
    "sortkey": "string",
    "timestamp": "string",
    "sortkey_prefix": "string",
    "collation": "category",
    "type": "category",
}

PAGEVIEW_DTYPE = {
    "wiki_code": "category",
    "page_title": "string",
    "page_id": "int",  # will be parsed to int
    "user_client": "category",
    "daily_total": "int",  # will be parsed to int
    # todo: add more columns for the hourly data
    "hourly_count": "string",  # from 0 to 23, written as 0 = A, 1 = B ... 22 = W, 23 = X
}

RAW_PAGEVIEW_DTYPE = {
    "wiki_code": "category",
    "page_title": "string",
    "page_id": "category",  # will be parsed to int
    "user_client": "string",
    "daily_total": "string",  # will be parsed to int
    "hourly_count": "string",  # from 0 to 23, written as 0 = A, 1 = B ... 22 = W, 23 = X
}

RAW_PAGE_DTYPE = {
    "page_id": "category",
    "page_namespace": "category",
    "page_title": "string",
    "page_restrictions": "category",
    # "page_counter", # deprecated and no longer in the files!
    "page_is_redirect": "category",
    "page_is_new": "category",
    "page_random": "category",
    "page_touched": "category",
    "page_links_updated": "category",
    "page_latest": "category",
    "page_len": "category",
    "page_content_model": "category",
    "page_lang": "category",
}


PAGE_DTYPE = {
    "page_id": "Int",
    "page_namespace": "Int",
    "page_title": "string",
    "page_restrictions": "string",
    # "page_counter", # deprecated and no longer in the files!
    "page_is_redirect": "bool",
    "page_is_new": "bool",
    "page_random": "Int",
    "page_touched": "datetime64",
    "page_links_updated": "datetime64",
    "page_latest": "category",
    "page_len": "Int",
    "page_content_model": "category",
    "page_lang": "category",
}


class PageviewDialect(csv.Dialect):
    delimiter = " "
    doublequote = False
    escapechar = None
    lineterminator = "\r\n"
    quotechar = '"'
    quoting = 0
    skipinitialspace = False


def read_page_csv(path: PathLike, **options: Dict[str, Any]) -> pd.DataFrame:
    default_options = dict(
        names=PAGE_COLUMNS,
        # dialect=PageviewDialect,
        dtype=PAGE_DTYPE,
        index_col=False,
        # skiprows=1,  # skip the header
        on_bad_lines="warn",
        engine="c",
    )
    if options is not None:
        default_options.update(options)
    return pd.read_csv(path, **default_options)


def read_langlinks_csv(path: PathLike, **options: Dict[str, Any]) -> pd.DataFrame:
    default_options = dict(
        names=LANGLINKS_COLUMNS,
        # dialect=PageviewDialect,
        dtype=LANGLINKS_DTYPE,
        index_col=False,
        # skiprows=1,  # skip the header
        on_bad_lines="warn",
        engine="c",
    )
    if options is not None:
        default_options.update(options)
    return pd.read_csv(path, **default_options)


def read_category_csv(path: PathLike, **options: Dict[str, Any]) -> pd.DataFrame:
    default_options = dict(
        names=CATEGORY_COLUMNS,
        # dialect=PageviewDialect,
        dtype=CATEGORY_DTYPE,
        index_col=False,
        # skiprows=1,  # skip the header
        on_bad_lines="warn",
        engine="c",
    )
    if options is not None:
        default_options.update(options)
    return pd.read_csv(path, **default_options)


def read_categorylinks_csv(path: PathLike, **options: Dict[str, Any]) -> pd.DataFrame:
    default_options = dict(
        names=CATEGORYLINKS_COLUMNS,
        # dialect=PageviewDialect,
        dtype=CATEGORYLINKS_DTYPE,
        # header=0,
        index_col=False,
        # parse_dates=["timestamp"],
        # skiprows=1,  # skip the header
        on_bad_lines="warn",
        engine="c",
    )
    if options is not None:
        default_options.update(options)
    return pd.read_csv(path, **default_options)


def read_pageview_csv(path: PathLike, **options: Dict[str, Any]) -> pd.DataFrame:
    default_options = dict(
        names=PAGEVIEW_COLUMNS,
        dialect=PageviewDialect,
        dtype=PAGEVIEW_DTYPE,
        on_bad_lines="warn",
        engine="c",
    )
    if options is not None:
        default_options.update(options)
    try:
        return pd.read_csv(path, **default_options)
    except Exception as e:
        print(f"failed to read {path} with c engine: {e}")
        print("trying with python engine ...")
        default_options.update(dict(engine="python"))
        return pd.read_csv(path, **default_options)


def sniff_csv_dialect(
    path: PathLike,
    encoding: str = "utf-8",
    n: int = 20_000,
) -> Type[csv.Dialect]:
    with utils.fopen(path, mode="rt", encoding=encoding, errors="ignore") as csvfile:
        start_of_file = csvfile.read(n)
        dialect = csv.Sniffer().sniff(start_of_file)
        return dialect


# def sniff_csv_dialect_bz2(
#     path: PathLike, encoding: str = "ISO-8859-1"
# ) -> Type[csv.Dialect]:
#     with bz2.open(path, mode="rt", encoding=encoding) as csvfile:
#         start_of_file = str(csvfile.read(14734))
#         dialect = csv.Sniffer().sniff(start_of_file)
#         return dialect


# def sniff_csv_dialect_gz(
#     path: PathLike, encoding: str = "ISO-8859-1"
# ) -> Type[csv.Dialect]:
#     with gzip.open(path, mode="rt", encoding=encoding) as csvfile:
#         start_of_file = str(csvfile.read(14734))
#         dialect = csv.Sniffer().sniff(start_of_file)
#         return dialect


def inspect_csv_dialect(
    dialect: Type[csv.Dialect],
) -> Dict[str, Union[Optional[str], int]]:
    return dict(
        delimiter=dialect.delimiter,
        doublequote=dialect.doublequote,
        escapechar=dialect.escapechar,
        lineterminator=dialect.lineterminator,
        quotechar=dialect.quotechar,
        quoting=dialect.quoting,
        skipinitialspace=dialect.skipinitialspace,
    )
