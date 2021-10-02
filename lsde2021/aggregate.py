import datetime
import traceback
from pathlib import Path

import pyspark
import pyspark.sql.functions as F
from pyspark.sql.types import IntegerType, LongType, StringType, StructField, StructType

import lsde2021.download as dl
from lsde2021.types import PathLike


def aggregate_daily_pageviews(
    spark: pyspark.sql.session.SparkSession,
    date: datetime.date,
    src: PathLike,
    dest: PathLike,
) -> PathLike:
    """
    see https://stackoverflow.com/questions/51217168/wikipedia-pageviews-analysis
        domain_code
        page_title
        count_views
        total_response_size (no longer maintained)
    """
    schema = StructType(
        [
            StructField("domain_code", StringType(), True),
            StructField("page_title", StringType(), True),
            StructField("view_count", LongType(), True),
            StructField("total_response_size", IntegerType(), True),
        ]
    )

    csv_loader = spark.read.format("csv").option("sep", " ")

    daily = None
    daily_out = dest / Path("/".join(dl.wikimedia_daily_local_file(date)))

    for hour in range(24):
        current = datetime.datetime.combine(
            date, datetime.time.min
        ) + datetime.timedelta(hours=hour)
        file = src / Path("/".join(dl.wikimedia_local_file(current)))
        try:
            df = csv_loader.load(str(file), schema=schema)
            if daily is None:
                daily = df
            else:
                daily = (
                    df.select(
                        "domain_code",
                        "page_title",
                        F.col("view_count").alias("view_count2"),
                    )
                    .join(daily, on=["domain_code", "page_title"], how="outer")
                    .fillna(value=0)
                )
                daily = daily.withColumn(
                    "view_count_sum", sum([daily["view_count"], daily["view_count2"]])
                ).select(
                    "domain_code",
                    "page_title",
                    F.col("view_count_sum").alias("view_count"),
                )
        except Exception as e:
            print(f"failed to load {file}: {e}")
            print(traceback.format_exc())

    if daily:
        try:
            daily = daily.sort(F.col("view_count").desc()).repartition(
                F.col("domain_code")
            )
            daily_out.parent.mkdir(parents=True, exist_ok=True)
            daily.write.format("parquet").partitionBy("domain_code").mode(
                "overwrite"
            ).save(str(daily_out))
            print(f"wrote {daily_out}")
        except Exception as e:
            print(f"failed to save daily data {daily_out}: {e}")
            print(traceback.format_exc())
    return daily_out
