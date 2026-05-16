"""Map noisy medium strings to stable core material labels for facets and API display.

Raw values like ``Handscroll; ink and color on silk`` are reduced to tokens such as
``Silk``, ``Paper``, ``Bronze`` for dropdown facets, stats aggregation, and a shorter
``material`` field in API payloads. Multiple materials are all returned (e.g. gilt bronze
→ ``Bronze`` + ``Gold``).
"""

from __future__ import annotations

import re
from functools import lru_cache
from typing import Iterable

# (canonical_label, regex) — scan in order; every rule that matches adds that label once.
_MATERIAL_RULES: tuple[tuple[str, str], ...] = (
    ("Cloisonné", r"cloisonn[ée]"),
    ("Mother-of-pearl", r"mother[\s\-]+of[\s\-]+pearl|\bnacre\b"),
    ("Hardstone", r"\bhardstone\b"),
    ("Porcelain", r"\bporcelain\b"),
    ("Stoneware", r"\bstoneware\b"),
    ("Earthenware", r"\bearthenware\b"),
    ("Terracotta", r"\bterracotta\b"),
    ("Faience", r"\bfaience\b"),
    ("Ceramic", r"\bceramic\b|\bceramics\b"),
    ("Clay", r"\bclay\b"),
    ("Silver", r"\bsilver\b"),
    ("Gold", r"\bgold\b|\bgilt(?:ed)?\b|\bgilding\b"),
    ("Brass", r"\bbrass\b"),
    ("Bronze", r"\bbronze\b"),
    # Avoid matching the mineral descriptor "copper-red" on porcelain
    ("Copper", r"\bcopper\b(?![\s\-–]+red)"),
    ("Iron", r"\biron\b|\bsteel\b"),
    ("Pewter", r"\bpewter\b"),
    ("Tin", r"\btin\b"),
    ("Marble", r"\bmarble\b"),
    ("Jade", r"\bjade\b|\bnephrite\b|\bjadeite\b"),
    ("Crystal", r"rock\s+crystal|\bcrystal\b"),
    ("Stone", r"\bstone\b"),
    ("Ivory", r"\bivory\b"),
    ("Bone", r"\bbone\b"),
    ("Horn", r"\bhorn\b"),
    ("Shell", r"\bshell\b|\bplastron\b|\btortoise\b"),
    ("Wood", r"\bwood\b|\bwooden\b"),
    ("Bamboo", r"\bbamboo\b"),
    ("Lacquer", r"\blacquer\b"),
    ("Leather", r"\bleather\b"),
    ("Silk", r"\bsilk\b|\bsatin\b"),
    ("Velvet", r"\bvelvet\b"),
    ("Linen", r"\blinen\b"),
    ("Cotton", r"\bcotton\b"),
    ("Wool", r"\bwool\b"),
    ("Paper", r"\bpaper\b|\bparchment\b"),
    ("Glass", r"\bglass\b"),
    ("Enamel", r"\benamel\b"),
    ("Ink", r"\bink\b"),
    ("Pigment", r"\bpigment\b"),
)

_COMPILED: tuple[tuple[str, re.Pattern[str]], ...] = tuple(
    (label, re.compile(pat, re.IGNORECASE)) for label, pat in _MATERIAL_RULES
)

CANONICAL_LABELS: tuple[str, ...] = tuple(dict.fromkeys(l for l, _ in _MATERIAL_RULES))

_FILTER_PARTS: dict[str, list[str]] = {}
for _canon, _pat in _MATERIAL_RULES:
    _FILTER_PARTS.setdefault(_canon, []).append(_pat)


def extract_core_materials(raw: str | None) -> list[str]:
    """Return canonical material labels detected in ``raw``, in rule order (unique)."""
    if raw is None:
        return []
    s = str(raw).strip()
    if not s:
        return []
    found: list[str] = []
    seen: set[str] = set()
    for canon, cre in _COMPILED:
        if cre.search(s) and canon not in seen:
            seen.add(canon)
            found.append(canon)
    return found


def material_for_api(raw: str | None) -> str:
    """Display string: sorted comma-separated canonical labels, else original text."""
    if raw is None:
        return ""
    s = str(raw).strip()
    if not s:
        return ""
    cores = extract_core_materials(s)
    if cores:
        return ", ".join(sorted(cores))
    return s


def canonicalize_material_query(value: str | None) -> str | None:
    """Normalize catalog material filter/query string to an API facet keyword."""
    if value is None:
        return None
    t = str(value).strip()
    if not t:
        return None
    for label in CANONICAL_LABELS:
        if t.lower() == label.lower():
            return label
    cores = extract_core_materials(t)
    if cores:
        return cores[0]
    return t


@lru_cache(maxsize=256)
def neo4j_regex_for_filter(canonical: str) -> str:
    """Whole-string Neo4j ``=~`` pattern so rows whose medium contains ``canonical`` match."""
    key = canonical.strip()
    parts = _FILTER_PARTS.get(key)
    if parts:
        inner = "|".join(f"(?:{p})" for p in parts)
        return f"(?is).*(?:{inner}).*"
    w = re.escape(key)
    return rf"(?is).*\b{w}\b.*"


def merge_material_counts(rows: Iterable[dict]) -> list[dict[str, str | int]]:
    """Collapse raw medium buckets into canonical labels; multi-label rows add to each key."""
    from collections import Counter

    c: Counter[str] = Counter()
    for row in rows:
        raw_m = row.get("material")
        cnt = int(row.get("count") or 0)
        if cnt <= 0:
            continue
        s = str(raw_m).strip() if raw_m is not None else ""
        if not s:
            continue
        cores = extract_core_materials(s)
        if cores:
            for label in cores:
                c[label] += cnt
        else:
            c[s] += cnt
    return [{"material": k, "count": v} for k, v in c.most_common()]


def distinct_canonical_materials_from_raw(raw_values: Iterable[str | None]) -> list[str]:
    """Sorted unique canonical labels found in ``raw_values``."""
    seen: set[str] = set()
    for raw in raw_values:
        if raw is None:
            continue
        for m in extract_core_materials(str(raw).strip()):
            seen.add(m)
    return sorted(seen)


def raw_matches_material_filter(raw_medium: Any, filter_canonical: str) -> bool:
    """True if raw storage string satisfies a catalog facet value ``filter_canonical``."""
    f = canonicalize_material_query(filter_canonical)
    if not f:
        return True
    s = "" if raw_medium is None else str(raw_medium).strip()
    cores = extract_core_materials(s)
    if cores:
        return f in cores
    return f.lower() in s.lower()
