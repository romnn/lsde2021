#### PATTERN | EN | INFLECT ########################################################################
# -*- coding: utf-8 -*-
# Copyright (c) 2010 University of Antwerp, Belgium
# Author: Tom De Smedt <tom@organisms.be>
# License: BSD (see LICENSE.txt for details).

####################################################################################################
# Regular expressions-based rules for English word inflection:
# - pluralization and singularization of nouns and adjectives,
# - conjugation of verbs,
# - comparative and superlative of adjectives.

# Accuracy (measured on CELEX English morphology word forms):
# 95% for pluralize()
# 96% for singularize()
# 95% for Verbs.find_lemma() (for regular verbs)
# 96% for Verbs.find_lexeme() (for regular verbs)

from __future__ import unicode_literals
from __future__ import division

from builtins import str, bytes, dict, int
from builtins import map, zip, filter
from builtins import object, range
from typing import Dict, List, Tuple, Pattern, Optional

import os
import sys
import re

VERB, NOUN, ADJECTIVE, ADVERB = "VB", "NN", "JJ", "RB"

# Prepositions are used in forms like "mother-in-law" and "man at arms".
plural_prepositions = set(
    (
        "about",
        "before",
        "during",
        "of",
        "till",
        "above",
        "behind",
        "except",
        "off",
        "to",
        "across",
        "below",
        "for",
        "on",
        "under",
        "after",
        "beneath",
        "from",
        "onto",
        "until",
        "among",
        "beside",
        "in",
        "out",
        "unto",
        "around",
        "besides",
        "into",
        "over",
        "upon",
        "at",
        "between",
        "near",
        "since",
        "with",
        "athwart",
        "betwixt",
        "beyond",
        "but",
        "by",
    )
)

# Inflection rules that are either:
# - general,
# - apply to a certain category of words,
# - apply to a certain category of words only in classical mode,
# - apply only in classical mode.
# Each rule is a (suffix, inflection, category, classic)-tuple.
plural_rules_uncompiled = [
    # 0) Indefinite articles and demonstratives.
    (
        (r"^a$|^an$", "some", None, False),
        (r"^this$", "these", None, False),
        (r"^that$", "those", None, False),
        (r"^any$", "all", None, False),
    ),  # 1) Possessive adjectives.
    (
        (r"^my$", "our", None, False),
        (r"^your$", "your", None, False),
        (r"^thy$", "your", None, False),
        (r"^her$|^his$", "their", None, False),
        (r"^its$", "their", None, False),
        (r"^their$", "their", None, False),
    ),  # 2) Possessive pronouns.
    (
        (r"^mine$", "ours", None, False),
        (r"^yours$", "yours", None, False),
        (r"^thine$", "yours", None, False),
        (r"^her$|^his$", "theirs", None, False),
        (r"^its$", "theirs", None, False),
        (r"^their$", "theirs", None, False),
    ),  # 3) Personal pronouns.
    (
        (r"^I$", "we", None, False),
        (r"^me$", "us", None, False),
        (r"^myself$", "ourselves", None, False),
        (r"^you$", "you", None, False),
        (r"^thou$|^thee$", "ye", None, False),
        (r"^yourself$", "yourself", None, False),
        (r"^thyself$", "yourself", None, False),
        (r"^she$|^he$", "they", None, False),
        (r"^it$|^they$", "they", None, False),
        (r"^her$|^him$", "them", None, False),
        (r"^it$|^them$", "them", None, False),
        (r"^herself$", "themselves", None, False),
        (r"^himself$", "themselves", None, False),
        (r"^itself$", "themselves", None, False),
        (r"^themself$", "themselves", None, False),
        (r"^oneself$", "oneselves", None, False),
    ),  # 4) Words that do not inflect.
    (
        (r"$", "", "uninflected", False),
        (r"$", "", "uncountable", False),
        (r"s$", "s", "s-singular", False),
        (r"fish$", "fish", None, False),
        (r"([- ])bass$", "\\1bass", None, False),
        (r"ois$", "ois", None, False),
        (r"sheep$", "sheep", None, False),
        (r"deer$", "deer", None, False),
        (r"pox$", "pox", None, False),
        (r"([A-Z].*)ese$", "\\1ese", None, False),
        (r"itis$", "itis", None, False),
        (
            r"(fruct|gluc|galact|lact|ket|malt|rib|sacchar|cellul)ose$",
            "\\1ose",
            None,
            False,
        ),
    ),  # 5) Irregular plural forms (e.g., mongoose, oxen).
    (
        (r"atlas$", "atlantes", None, True),
        (r"atlas$", "atlases", None, False),
        (r"beef$", "beeves", None, True),
        (r"brother$", "brethren", None, True),
        (r"child$", "children", None, False),
        (r"corpus$", "corpora", None, True),
        (r"corpus$", "corpuses", None, False),
        (r"^cow$", "kine", None, True),
        (r"ephemeris$", "ephemerides", None, False),
        (r"ganglion$", "ganglia", None, True),
        (r"genie$", "genii", None, True),
        (r"genus$", "genera", None, False),
        (r"graffito$", "graffiti", None, False),
        (r"loaf$", "loaves", None, False),
        (r"money$", "monies", None, True),
        (r"mongoose$", "mongooses", None, False),
        (r"mythos$", "mythoi", None, False),
        (r"octopus$", "octopodes", None, True),
        (r"opus$", "opera", None, True),
        (r"opus$", "opuses", None, False),
        (r"^ox$", "oxen", None, False),
        (r"penis$", "penes", None, True),
        (r"penis$", "penises", None, False),
        (r"soliloquy$", "soliloquies", None, False),
        (r"testis$", "testes", None, False),
        (r"trilby$", "trilbys", None, False),
        (r"turf$", "turves", None, True),
        (r"numen$", "numena", None, False),
        (r"occiput$", "occipita", None, True),
    ),  # 6) Irregular inflections for common suffixes (e.g., synopses, mice, men).
    (
        (r"man$", "men", None, False),
        (r"person$", "people", None, False),
        (r"([lm])ouse$", "\\1ice", None, False),
        (r"tooth$", "teeth", None, False),
        (r"goose$", "geese", None, False),
        (r"foot$", "feet", None, False),
        (r"zoon$", "zoa", None, False),
        (r"([csx])is$", "\\1es", None, False),
    ),  # 7) Fully assimilated classical inflections
    #    (e.g., vertebrae, codices).
    (
        (r"ex$", "ices", "ex-ices", False),
        (r"ex$", "ices", "ex-ices*", True),  # * = classical mode
        (r"um$", "a", "um-a", False),
        (r"um$", "a", "um-a*", True),
        (r"on$", "a", "on-a", False),
        (r"a$", "ae", "a-ae", False),
        (r"a$", "ae", "a-ae*", True),
    ),  # 8) Classical variants of modern inflections
    #    (e.g., stigmata, soprani).
    (
        (r"trix$", "trices", None, True),
        (r"eau$", "eaux", None, True),
        (r"ieu$", "ieu", None, True),
        (r"([iay])nx$", "\\1nges", None, True),
        (r"en$", "ina", "en-ina*", True),
        (r"a$", "ata", "a-ata*", True),
        (r"is$", "ides", "is-ides*", True),
        (r"us$", "i", "us-i*", True),
        (r"us$", "us ", "us-us*", True),
        (r"o$", "i", "o-i*", True),
        (r"$", "i", "-i*", True),
        (r"$", "im", "-im*", True),
    ),  # 9) -ch, -sh and -ss take -es in the plural
    #    (e.g., churches, classes).
    (
        (r"([cs])h$", "\\1hes", None, False),
        (r"ss$", "sses", None, False),
        (r"x$", "xes", None, False),
    ),  # 10) -f or -fe sometimes take -ves in the plural
    #     (e.g, lives, wolves).
    (
        (r"([aeo]l)f$", "\\1ves", None, False),
        (r"([^d]ea)f$", "\\1ves", None, False),
        (r"arf$", "arves", None, False),
        (r"([nlw]i)fe$", "\\1ves", None, False),
    ),  # 11) -y takes -ys if preceded by a vowel, -ies otherwise
    #     (e.g., storeys, Marys, stories).
    (
        (r"([aeiou])y$", "\\1ys", None, False),
        (r"([A-Z].*)y$", "\\1ys", None, False),
        (r"y$", "ies", None, False),
    ),  # 12) -o sometimes takes -os, -oes otherwise.
    #     -o is preceded by a vowel takes -os
    #     (e.g., lassos, potatoes, bamboos).
    (
        (r"o$", "os", "o-os", False),
        (r"([aeiou])o$", "\\1os", None, False),
        (r"o$", "oes", None, False),
    ),  # 13) Miltary stuff
    #     (e.g., Major Generals).
    ((r"l$", "ls", "general-generals", False),),  # 14) Assume that the plural takes -s
    #     (cats, programmes, ...).
    ((r"$", "s", None, False),),
]

# For performance, compile the regular expressions once:
plural_rules: List[List[Tuple[Pattern[str], str, Optional[str], bool]]] = [
    [(re.compile(r[0]), r[1], r[2], r[3]) for r in grp]
    for grp in plural_rules_uncompiled
]

# Suffix categories.
plural_categories = {
    "uninflected": [
        "bison",
        "debris",
        "headquarters",
        "news",
        "swine",
        "bream",
        "diabetes",
        "herpes",
        "pincers",
        "trout",
        "breeches",
        "djinn",
        "high-jinks",
        "pliers",
        "tuna",
        "britches",
        "eland",
        "homework",
        "proceedings",
        "whiting",
        "carp",
        "elk",
        "innings",
        "rabies",
        "wildebeest",
        "chassis",
        "flounder",
        "jackanapes",
        "salmon",
        "clippers",
        "gallows",
        "mackerel",
        "scissors",
        "cod",
        "graffiti",
        "measles",
        "series",
        "contretemps",
        "mews",
        "shears",
        "corps",
        "mumps",
        "species",
    ],
    "uncountable": [
        "advice",
        "fruit",
        "ketchup",
        "meat",
        "sand",
        "bread",
        "furniture",
        "knowledge",
        "mustard",
        "software",
        "butter",
        "garbage",
        "love",
        "news",
        "understanding",
        "cheese",
        "gravel",
        "luggage",
        "progress",
        "water",
        "electricity",
        "happiness",
        "mathematics",
        "research",
        "equipment",
        "information",
        "mayonnaise",
        "rice",
    ],
    "s-singular": [
        "acropolis",
        "caddis",
        "dais",
        "glottis",
        "pathos",
        "aegis",
        "cannabis",
        "digitalis",
        "ibis",
        "pelvis",
        "alias",
        "canvas",
        "epidermis",
        "lens",
        "polis",
        "asbestos",
        "chaos",
        "ethos",
        "mantis",
        "rhinoceros",
        "bathos",
        "cosmos",
        "gas",
        "marquis",
        "sassafras",
        "bias",
        "glottis",
        "metropolis",
        "trellis",
    ],
    "ex-ices": ["codex", "murex", "silex"],
    "ex-ices*": [
        "apex",
        "index",
        "pontifex",
        "vertex",
        "cortex",
        "latex",
        "simplex",
        "vortex",
    ],
    "um-a": [
        "agendum",
        "candelabrum",
        "desideratum",
        "extremum",
        "stratum",
        "bacterium",
        "datum",
        "erratum",
        "ovum",
    ],
    "um-a*": [
        "aquarium",
        "emporium",
        "maximum",
        "optimum",
        "stadium",
        "compendium",
        "enconium",
        "medium",
        "phylum",
        "trapezium",
        "consortium",
        "gymnasium",
        "memorandum",
        "quantum",
        "ultimatum",
        "cranium",
        "honorarium",
        "millenium",
        "rostrum",
        "vacuum",
        "curriculum",
        "interregnum",
        "minimum",
        "spectrum",
        "velum",
        "dictum",
        "lustrum",
        "momentum",
        "speculum",
    ],
    "on-a": [
        "aphelion",
        "hyperbaton",
        "perihelion",
        "asyndeton",
        "noumenon",
        "phenomenon",
        "criterion",
        "organon",
        "prolegomenon",
    ],
    "a-ae": ["alga", "alumna", "vertebra"],
    "a-ae*": [
        "abscissa",
        "aurora",
        "hyperbola",
        "nebula",
        "amoeba",
        "formula",
        "lacuna",
        "nova",
        "antenna",
        "hydra",
        "medusa",
        "parabola",
    ],
    "en-ina*": ["foramen", "lumen", "stamen"],
    "a-ata*": [
        "anathema",
        "dogma",
        "gumma",
        "miasma",
        "stigma",
        "bema",
        "drama",
        "lemma",
        "schema",
        "stoma",
        "carcinoma",
        "edema",
        "lymphoma",
        "oedema",
        "trauma",
        "charisma",
        "enema",
        "magma",
        "sarcoma",
        "diploma",
        "enigma",
        "melisma",
        "soma",
    ],
    "is-ides*": ["clitoris", "iris"],
    "us-i*": [
        "focus",
        "nimbus",
        "succubus",
        "fungus",
        "nucleolus",
        "torus",
        "genius",
        "radius",
        "umbilicus",
        "incubus",
        "stylus",
        "uterus",
    ],
    "us-us*": [
        "apparatus",
        "hiatus",
        "plexus",
        "status",
        "cantus",
        "impetus",
        "prospectus",
        "coitus",
        "nexus",
        "sinus",
    ],
    "o-i*": [
        "alto",
        "canto",
        "crescendo",
        "soprano",
        "basso",
        "contralto",
        "solo",
        "tempo",
    ],
    "-i*": ["afreet", "afrit", "efreet"],
    "-im*": ["cherub", "goy", "seraph"],
    "o-os": [
        "albino",
        "dynamo",
        "guano",
        "lumbago",
        "photo",
        "archipelago",
        "embryo",
        "inferno",
        "magneto",
        "pro",
        "armadillo",
        "fiasco",
        "jumbo",
        "manifesto",
        "quarto",
        "commando",
        "generalissimo",
        "medico",
        "rhino",
        "ditto",
        "ghetto",
        "lingo",
        "octavo",
        "stylo",
    ],
    "general-generals": [
        "Adjutant",
        "Brigadier",
        "Lieutenant",
        "Major",
        "Quartermaster",
        "adjutant",
        "brigadier",
        "lieutenant",
        "major",
        "quartermaster",
    ],
}


def pluralize(
    word: str, pos: str = NOUN, custom: Dict[str, str] = {}, classical: bool = True
) -> str:
    """Returns the plural of a given word, e.g., child => children.
    Handles nouns and adjectives, using classical inflection by default
    (i.e., where "matrix" pluralizes to "matrices" and not "matrixes").
    The custom dictionary is for user-defined replacements.
    """
    if word in custom:
        return custom[word]
    # Recurse genitives.
    # Remove the apostrophe and any trailing -s,
    # form the plural of the resultant noun, and then append an apostrophe (dog's => dogs').
    if word.endswith(("'", "'s")):
        w = word.rstrip("'s")
        w = pluralize(w, pos, custom, classical)
        if w.endswith("s"):
            return w + "'"
        else:
            return w + "'s"
    # Recurse compound words
    # (e.g., Postmasters General, mothers-in-law, Roman deities).
    wl = word.replace("-", " ").split(" ")
    if len(wl) > 1:
        if (
            wl[1] == "general"
            or wl[1] == "General"
            and wl[0] not in plural_categories["general-generals"]
        ):
            return word.replace(wl[0], pluralize(wl[0], pos, custom, classical))
        elif wl[1] in plural_prepositions:
            return word.replace(wl[0], pluralize(wl[0], pos, custom, classical))
        else:
            return word.replace(wl[-1], pluralize(wl[-1], pos, custom, classical))
    # Only a very few number of adjectives inflect.
    n = list(range(len(plural_rules)))
    if pos.startswith(ADJECTIVE):
        n = [0, 1]
    # Apply pluralization rules.
    for i in n:
        for suffix, inflection, category, classic in plural_rules[i]:
            # A general rule, or a classic rule in classical mode.
            if category is None:
                if not classic or (classic and classical):
                    if suffix.search(word) is not None:
                        return suffix.sub(inflection, word)
            # A rule pertaining to a specific category of words.
            if category is not None:
                if word in plural_categories[category] and (
                    not classic or (classic and classical)
                ):
                    if suffix.search(word) is not None:
                        return suffix.sub(inflection, word)
    return word


#### SINGULARIZE ###################################################################################
# Adapted from Bermi Ferrer's Inflector for Python:
# http://www.bermi.org/inflector/

# Copyright (c) 2006 Bermi Ferrer Martinez
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software to deal in this software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of this software, and to permit
# persons to whom this software is furnished to do so, subject to the following
# condition:
#
# THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THIS SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THIS SOFTWARE.

singular_rules_uncompiled = [
    (r"(?i)(.)ae$", "\\1a"),
    (r"(?i)(.)itis$", "\\1itis"),
    (r"(?i)(.)eaux$", "\\1eau"),
    (r"(?i)(quiz)zes$", "\\1"),
    (r"(?i)(matr)ices$", "\\1ix"),
    (r"(?i)(ap|vert|ind)ices$", "\\1ex"),
    (r"(?i)^(ox)en", "\\1"),
    (r"(?i)(alias|status)es$", "\\1"),
    (r"(?i)([octop|vir])i$", "\\1us"),
    (r"(?i)(cris|ax|test)es$", "\\1is"),
    (r"(?i)(shoe)s$", "\\1"),
    (r"(?i)(o)es$", "\\1"),
    (r"(?i)(bus)es$", "\\1"),
    (r"(?i)([m|l])ice$", "\\1ouse"),
    (r"(?i)(x|ch|ss|sh)es$", "\\1"),
    (r"(?i)(m)ovies$", "\\1ovie"),
    (r"(?i)(.)ombies$", "\\1ombie"),
    (r"(?i)(s)eries$", "\\1eries"),
    (r"(?i)([^aeiouy]|qu)ies$", "\\1y"),
    # -f, -fe sometimes take -ves in the plural
    # (e.g., lives, wolves).
    (r"([aeo]l)ves$", "\\1f"),
    (r"([^d]ea)ves$", "\\1f"),
    (r"arves$", "arf"),
    (r"erves$", "erve"),
    (r"([nlw]i)ves$", "\\1fe"),
    (r"(?i)([lr])ves$", "\\1f"),
    (r"([aeo])ves$", "\\1ve"),
    (r"(?i)(sive)s$", "\\1"),
    (r"(?i)(tive)s$", "\\1"),
    (r"(?i)(hive)s$", "\\1"),
    (r"(?i)([^f])ves$", "\\1fe"),
    # -ses suffixes.
    (r"(?i)(^analy)ses$", "\\1sis"),
    (r"(?i)((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$", "\\1\\2sis"),
    (r"(?i)(.)opses$", "\\1opsis"),
    (r"(?i)(.)yses$", "\\1ysis"),
    (r"(?i)(h|d|r|o|n|b|cl|p)oses$", "\\1ose"),
    (r"(?i)(fruct|gluc|galact|lact|ket|malt|rib|sacchar|cellul)ose$", "\\1ose"),
    (r"(?i)(.)oses$", "\\1osis"),
    # -a
    (r"(?i)([ti])a$", "\\1um"),
    (r"(?i)(n)ews$", "\\1ews"),
    (r"(?i)s$", ""),
]

# For performance, compile the regular expressions only once:
singular_rules: List[Tuple[Pattern[str], str]] = [
    (re.compile(r[0]), r[1]) for r in singular_rules_uncompiled
]

singular_uninflected = set(
    (
        "bison",
        "debris",
        "headquarters",
        "pincers",
        "trout",
        "bream",
        "diabetes",
        "herpes",
        "pliers",
        "tuna",
        "breeches",
        "djinn",
        "high-jinks",
        "proceedings",
        "whiting",
        "britches",
        "eland",
        "homework",
        "rabies",
        "wildebeest",
        "carp",
        "elk",
        "innings",
        "salmon",
        "chassis",
        "flounder",
        "jackanapes",
        "scissors",
        "christmas",
        "gallows",
        "mackerel",
        "series",
        "clippers",
        "georgia",
        "measles",
        "shears",
        "cod",
        "graffiti",
        "mews",
        "species",
        "contretemps",
        "mumps",
        "swine",
        "corps",
        "news",
        "swiss",
    )
)
singular_uncountable = set(
    (
        "advice",
        "equipment",
        "happiness",
        "luggage",
        "news",
        "software",
        "bread",
        "fruit",
        "information",
        "mathematics",
        "progress",
        "understanding",
        "butter",
        "furniture",
        "ketchup",
        "mayonnaise",
        "research",
        "water",
        "cheese",
        "garbage",
        "knowledge",
        "meat",
        "rice",
        "electricity",
        "gravel",
        "love",
        "mustard",
        "sand",
    )
)
singular_ie = set(
    (
        "alergie",
        "cutie",
        "hoagie",
        "newbie",
        "softie",
        "veggie",
        "auntie",
        "doggie",
        "hottie",
        "nightie",
        "sortie",
        "weenie",
        "beanie",
        "eyrie",
        "indie",
        "oldie",
        "stoolie",
        "yuppie",
        "birdie",
        "freebie",
        "junkie",
        "^pie",
        "sweetie",
        "zombie",
        "bogie",
        "goonie",
        "laddie",
        "pixie",
        "techie",
        "bombie",
        "groupie",
        "laramie",
        "quickie",
        "^tie",
        "collie",
        "hankie",
        "lingerie",
        "reverie",
        "toughie",
        "cookie",
        "hippie",
        "meanie",
        "rookie",
        "valkyrie",
    )
)
singular_irregular = {
    "atlantes": "atlas",
    "atlases": "atlas",
    "axes": "axe",
    "beeves": "beef",
    "brethren": "brother",
    "children": "child",
    "corpora": "corpus",
    "corpuses": "corpus",
    "ephemerides": "ephemeris",
    "feet": "foot",
    "ganglia": "ganglion",
    "geese": "goose",
    "genera": "genus",
    "genii": "genie",
    "graffiti": "graffito",
    "helves": "helve",
    "kine": "cow",
    "leaves": "leaf",
    "loaves": "loaf",
    "men": "man",
    "mongooses": "mongoose",
    "monies": "money",
    "moves": "move",
    "mythoi": "mythos",
    "numena": "numen",
    "occipita": "occiput",
    "octopodes": "octopus",
    "opera": "opus",
    "opuses": "opus",
    "our": "my",
    "oxen": "ox",
    "penes": "penis",
    "penises": "penis",
    "people": "person",
    "sexes": "sex",
    "soliloquies": "soliloquy",
    "teeth": "tooth",
    "testes": "testis",
    "trilbys": "trilby",
    "turves": "turf",
    "zoa": "zoon",
}


def singularize(word: str, pos: str = NOUN, custom: Dict[str, str] = {}) -> str:
    """Returns the singular of a given word."""
    if word in custom:
        return custom[word]
    # Recurse compound words (e.g. mothers-in-law).
    if "-" in word:
        wl = word.split("-")
        if len(wl) > 1 and wl[1] in plural_prepositions:
            return singularize(wl[0], pos, custom) + "-" + "-".join(wl[1:])
    # dogs' => dog's
    if word.endswith("'"):
        return singularize(word[:-1]) + "'s"
    w = word.lower()
    for x in singular_uninflected:
        if x.endswith(w):
            return word
    for x in singular_uncountable:
        if x.endswith(w):
            return word
    for x in singular_ie:
        if w.endswith(x + "s"):
            return w
    for x in singular_irregular:
        if w.endswith(x):
            return re.sub("(?i)" + x + "$", singular_irregular[x], word)
    for suffix, inflection in singular_rules:
        m = re.search(suffix, word)
        g = m and m.groups() or []
        if m:
            for k in range(len(g)):
                if g[k] is None:
                    inflection = inflection.replace("\\" + str(k + 1), "")
            return re.sub(suffix, inflection, word)
    return word
