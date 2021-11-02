import re
import networkx as nx
from typing import Set, List, Dict, Tuple, Pattern, Any, Optional
from pprint import pprint
import lsde2021.lang as lang

numeric = re.compile(r"^([\s\d]+)$")

patterns: List[Tuple[Pattern[str], List[str]]] = [
    (re.compile(r"^\d+th-century_(\w+)_in_the_(\w+)$"), []),
    (re.compile(r"^\d+th-century_(\w+)_in_(\w+)$"), []),
    (re.compile(r"^\d+s_in_the_(\w+)$"), []),
    (re.compile(r"^\d+s_in_(\w+)$"), []),
    (re.compile(r"^\d+_in_the_(\w+)$"), []),
    (re.compile(r"^\d+_in_(\w+)$"), []),
    (re.compile(r"^(\w+)_based_in_(\w+)_by_subject$"), []),
    (re.compile(r"^(\w+)_established_in_the_(\w+)$"), []),
    (re.compile(r"^(\w+)_established_in_(\w+)$"), []),
    (re.compile(r"^(\w+)_in_the_(\w+)$"), []),
    (re.compile(r"^(\w+)_in_(\w+)$"), []),
    (re.compile(r"^(\w+)_and_the_(\w+)$"), []),
    (re.compile(r"^(\w+)_and_(\w+)$"), []),
    (re.compile(r"^(\w+)_of_the_(\w+)_by_country$"), []),
    (re.compile(r"^(\w+)_of_(\w+)_by_country$"), []),
    (re.compile(r"^(\w+)_of_the_(\w+)$"), []),
    (re.compile(r"^(\w+)_of_(\w+)$"), []),
    (re.compile(r"^(\w+)_by_country$"), []),
    (re.compile(r"^(\w+)_by_region$"), []),
    (re.compile(r"^(\w+)_by_location$"), []),
    (re.compile(r"^(\w+)_by_field$"), []),
    (re.compile(r"^(\w+)_by_location$"), []),
    (re.compile(r"^(\w+)_by_type$"), []),
    (re.compile(r"^\d+_(\w+)_by_legal_status$"), []),
    (re.compile(r"^\d+_(\w+)_by_year$"), []),
    (re.compile(r"^\d+_(\w+)_by_date$"), []),
    (re.compile(r"^\d+_(\w+)_by_year_and_country$"), []),
    (re.compile(r"^\d+_(\w+)_by_country_and_year$"), []),
    (re.compile(r"^\d+_(\w+)_by_country$"), []),
    (re.compile(r"^\d+_(\w+)_by_continent$"), []),
    (re.compile(r"^\d+_(\w+)_by_decade$"), []),
    (re.compile(r"^\d+_(\w+)_by_date$"), []),
    (re.compile(r"^\d+_(\w+)_by_(\w+)$"), []),
    (re.compile(r"^(\w+)_by_legal_status$"), []),
    (re.compile(r"^(\w+)_by_year$"), []),
    (re.compile(r"^(\w+)_by_date$"), []),
    (re.compile(r"^(\w+)_by_year_and_country$"), []),
    (re.compile(r"^(\w+)_by_country_and_year$"), []),
    (re.compile(r"^(\w+)_by_country$"), []),
    (re.compile(r"^(\w+)_by_continent$"), []),
    (re.compile(r"^(\w+)_by_decade$"), []),
    (re.compile(r"^(\w+)_by_date$"), []),
    (re.compile(r"^(\w+)_by_(\w+)$"), []),
    (re.compile(r"^\d+_(\w+)$"), []),
]

stopwords = ["a", "about", "above", "across", "after", "afterwards"]
stopwords += ["again", "against", "all", "almost", "alone", "along"]
stopwords += ["already", "also", "although", "always", "am", "among"]
stopwords += ["amongst", "amoungst", "amount", "an", "and", "another"]
stopwords += ["any", "anyhow", "anyone", "anything", "anyway", "anywhere"]
stopwords += ["are", "around", "as", "at", "back", "be", "became"]
stopwords += ["because", "become", "becomes", "becoming", "been"]
stopwords += ["before", "beforehand", "behind", "being", "below"]
stopwords += ["beside", "besides", "between", "beyond", "bill", "both"]
stopwords += ["bottom", "but", "by", "call", "can", "cannot", "cant"]
stopwords += ["co", "computer", "con", "could", "couldnt", "cry", "de"]
stopwords += ["describe", "detail", "did", "do", "done", "down", "due"]
stopwords += ["during", "each", "eg", "eight", "either", "eleven", "else"]
stopwords += ["elsewhere", "empty", "enough", "etc", "even", "ever"]
stopwords += ["every", "everyone", "everything", "everywhere", "except"]
stopwords += ["few", "fifteen", "fifty", "fill", "find", "fire", "first"]
stopwords += ["five", "for", "former", "formerly", "forty", "found"]
stopwords += ["four", "from", "front", "full", "further", "get", "give"]
stopwords += ["go", "had", "has", "hasnt", "have", "he", "hence", "her"]
stopwords += ["here", "hereafter", "hereby", "herein", "hereupon", "hers"]
stopwords += ["herself", "him", "himself", "his", "how", "however"]
stopwords += ["hundred", "i", "ie", "if", "in", "inc", "indeed"]
stopwords += ["interest", "into", "is", "it", "its", "itself", "keep"]
stopwords += ["last", "latter", "latterly", "least", "less", "ltd", "made"]
stopwords += ["many", "may", "me", "meanwhile", "might", "mill", "mine"]
stopwords += ["more", "moreover", "most", "mostly", "move", "much"]
stopwords += ["must", "my", "myself", "name", "namely", "neither", "never"]
stopwords += ["nevertheless", "next", "nine", "no", "nobody", "none"]
stopwords += ["noone", "nor", "not", "nothing", "now", "nowhere", "of"]
stopwords += ["off", "often", "on", "once", "one", "only", "onto", "or"]
stopwords += ["other", "others", "otherwise", "our", "ours", "ourselves"]
stopwords += ["out", "over", "own", "part", "per", "perhaps", "please"]
stopwords += ["put", "rather", "re", "s", "same", "see", "seem", "seemed"]
stopwords += ["seeming", "seems", "serious", "several", "she", "should"]
stopwords += ["show", "side", "since", "sincere", "six", "sixty", "so"]
stopwords += ["some", "somehow", "someone", "something", "sometime"]
stopwords += ["sometimes", "somewhere", "still", "such", "system", "take"]
stopwords += ["ten", "than", "that", "the", "their", "them", "themselves"]
stopwords += ["then", "thence", "there", "thereafter", "thereby"]
stopwords += ["therefore", "therein", "thereupon", "these", "they"]
stopwords += ["thick", "thin", "third", "this", "those", "though", "three"]
stopwords += ["three", "through", "throughout", "thru", "thus", "to"]
stopwords += ["together", "too", "top", "toward", "towards", "twelve"]
stopwords += ["twenty", "two", "un", "under", "until", "up", "upon"]
stopwords += ["us", "very", "via", "was", "we", "well", "were", "what"]
stopwords += ["whatever", "when", "whence", "whenever", "where"]
stopwords += ["whereafter", "whereas", "whereby", "wherein", "whereupon"]
stopwords += ["wherever", "whether", "which", "while", "whither", "who"]
stopwords += ["whoever", "whole", "whom", "whose", "why", "will", "with"]
stopwords += ["within", "without", "would", "yet", "you", "your"]
stopwords += ["yours", "yourself", "yourselves"]

EXCLUDE = set(stopwords).union(
    {"by", "or", "and", "with", "the", "of", "in", "without", "a", "on"}
)


def flatten(seq: List[List[Any]]) -> List[Any]:
    return [item for sublist in seq for item in sublist]


def unique(seq: List[Any], key: Any) -> List[Any]:
    seen: Set[Any] = set()
    seen_add = seen.add
    return [x for x in seq if not (key(x) in seen or seen_add(key(x)))]


def is_uppercase(s: str) -> bool:
    return s[0].isupper()


def split_by_pattern(s: str) -> Tuple[List[str], bool]:
    for pattern, extra_words in patterns:
        match = re.fullmatch(pattern, s)
        if match:
            return list(match.groups()), True
    return [s], False


def split(
    s: str,
    split_unmatched: bool = False,
    singularize: bool = False,
    pluralize: bool = False,
    recursive: bool = False,
) -> Set[str]:
    # first, test for common patterns
    splitted, matched = split_by_pattern(s)
    # print(splitted)

    # split recursively
    rec_splitted = flatten([split_by_pattern(ss)[0] for ss in splitted])
    # print(rec_splitted)
    while recursive and set(splitted) != set(rec_splitted):
        splitted = rec_splitted[:]
        # print(splitted)
        rec_splitted = flatten([split_by_pattern(ss)[0] for ss in splitted])

    if not matched:
        if split_unmatched:
            # if no pattern is found, split and remove stopwords
            splitted += re.split(" |,|_", s)
        else:
            splitted = [s]

    splitted_set = set(
        [sp.replace("_", " ") for sp in splitted if numeric.match(sp) is None]
    )
    # print(s, splitted, matched)

    if singularize and pluralize:
        splitted_set = set([lang.singularize(sp) for sp in splitted_set]).union(
            set([lang.pluralize(sp) for sp in splitted_set])
        )
    elif singularize:
        splitted_set = set([lang.singularize(sp) for sp in splitted_set])
    elif pluralize:
        splitted_set = set([lang.pluralize(sp) for sp in splitted_set])
    splitted_set = splitted_set - EXCLUDE
    return splitted_set


def freq_bfs_tree(
    g: nx.DiGraph, node: int, depth_limit: Optional[int] = None
) -> Dict[int, List[Tuple[int, int]]]:
    ans = []
    counts = dict()
    visited = set()
    level: List[Tuple[int, int]] = [(node, 0)]
    while len(level) > 0:
        for v, depth in level:
            ans.append((v, depth))
            visited.add(v)
            counts[v] = 1
        next_level = set()
        for v, depth in level:
            for w in g.neighbors(v):
                if w in visited:
                    counts[v] += 1
                elif depth_limit is None or depth + 1 <= depth_limit:
                    next_level.add((w, depth + 1))
        level = list(next_level)

    levels: Dict[int, List[Tuple[int, int]]] = dict()
    for n, depth in ans:
        if depth not in levels:
            levels[depth] = []
        levels[depth].append((n, counts[n]))

    levels = {
        depth: sorted(nodes, key=lambda x: x[1], reverse=True)
        for depth, nodes in levels.items()
    }
    return levels
    # return [(n, depth, counts[n]) for n, depth in ans]


def find_topics(
    node: int, g: nx.DiGraph, depth_limit: int = 4, max_categories: int = 5
) -> Dict[int, List[int]]:
    categories = freq_bfs_tree(g, node, depth_limit=depth_limit)
    if False:
        pprint(
            {
                depth: [(g.nodes[n]["title"], n, count) for n, count in nodes]
                for depth, nodes in categories.items()
                if depth > 0
            }
        )

    return {
        depth: unique(
            flatten(
                [
                    [w.capitalize() for w in split(g.nodes[n]["title"], recursive=True)]
                    for n, count in nodes
                ]
            ),
            key=lambda x: x[0],
        )[:max_categories]
        for depth, nodes in categories.items()
        if depth > 0
    }
