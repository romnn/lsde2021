import pyspark
import pyspark.sql.types as T
import pyspark.sql.functions as F
import datetime
import ruptures as rpt
import matplotlib.pyplot as plt
from pathlib import Path
from typing import Tuple, List, Dict, Optional


COUNTRIES: Dict[str, List[str]] = {
    "ar": ["United Arab Emirates", "Saudi Arabia"],
    "az": ["Azerbaijan"],
    "bg": ["Bulgaria"],
    "bs": ["Bosnia and Herzegovina"],
    "ca": [],  # catalan
    "cs": ["Czech Republic"],
    "da": ["Denmark"],
    "de": ["Germany", "Austria"],
    "el": ["Greece", "Cyprus"],
    "en": ["United States", "United Kingdom"],
    "es": ["Spain"],
    "et": ["Estonia"],
    "fi": ["Finland"],
    "fr": ["France"],
    "ga": ["Ireland"],
    "hi": ["India", "Nepal"],  # hindi
    "he": ["Israel"],  # hebrew
    "hu": ["Hungary"],
    "hy": [],  # armenia
    "id": ["Indonesia"],
    "is": ["Iceland"],
    "it": ["Italy"],
    "ja": ["Japan"],
    "ko": ["South Korea"],
    "ku": ["Iran"],  # kurdish
    "lb": ["Luxembourg"],
    "lt": ["Lithuania"],
    "nl": ["Netherlands"],
    "no": ["Norway"],
    "pl": ["Poland"],
    "pt": ["Portugal"],
    "ro": ["Romania"],
    "ru": ["Russia", "Belarus"],
    "sl": ["Slovenia"],
    "sq": ["Albania"],
    "sr": ["Serbia"],
    "sv": ["Sweden"],
    "tr": ["Turkey"],
    "uk": ["United Kingdom"],
    "vi": ["Vietnam"],
    "zh": ["China"],
}


def get_change_points(
    s: pyspark.sql.DataFrame, country: str
) -> Tuple[pyspark.sql.DataFrame, List[datetime.datetime]]:
    country_stringency = s.filter(F.lower(F.col("CountryName")) == country.lower())
    country_stringency = country_stringency.groupBy("Date", "CountryName").agg(
        F.mean("StringencyIndex").alias("StringencyIndex")
    )
    country_stringency = country_stringency.select("Date", "StringencyIndex")
    country_stringency = country_stringency.sort(F.col("Date").asc())
    country_stringency_pd = country_stringency.toPandas().set_index("Date")
    # algo = rpt.Pelt(model="rbf").fit(country_stringency_pd)
    algo = rpt.Dynp().fit(country_stringency_pd)
    change_index = algo.predict(10)
    change_dates = [
        country_stringency_pd.iloc[index - 1].name for index in change_index
    ]
    return country_stringency, change_dates


def plot_changepoints(
    country_stringency: pyspark.sql.DataFrame,
    changepoints: List[datetime.datetime],
    title: Optional[str] = None,
    fontsize: int = 15,
    savefig: Optional[str] = None,
) -> None:
    fig, ax = plt.subplots()
    ax.plot(country_stringency, color="blue", linestyle="-")

    ax.tick_params(axis="both", which="major", labelsize=fontsize * 3 / 4)
    ax.tick_params(axis="both", which="minor", labelsize=fontsize * 3 / 4)

    plt.vlines(
        changepoints,
        0,
        country_stringency.max(),
        color="black",
        linestyle="--",
        linewidth=3,
    )
    if title is not None:
        plt.title(title, fontsize=fontsize)
    plt.xlabel("time")
    plt.ylabel("stringency index")
    plt.tight_layout()
    if savefig:
        Path(savefig).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(savefig)
    plt.show()
