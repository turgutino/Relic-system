"""Extract canonical Chinese dynasty labels from noisy period strings.

Raw ``dynasty`` values may look like ``China, Ming dynasty (1368–1644)`` or
``19th century``. We map known dynasty keywords (longest / most specific
first) to a stable English label used in API payloads, facets, filters, and
stats. Unrecognized strings return ``None`` and are omitted from dynasty
aggregations.
"""

from __future__ import annotations

import re
from functools import lru_cache
from typing import Iterable


# (canonical_label, regex) — order matters: first match wins (most specific first).
_DYNASTY_RULES: tuple[tuple[str, str], ...] = (
    ("Northern Song", r"northern\s+song"),
    ("Southern Song", r"southern\s+song"),
    ("Western Xia", r"western\s+xia"),
    ("Western Jin", r"western\s+jin"),
    ("Eastern Jin", r"eastern\s+jin"),
    ("Northern Wei", r"northern\s+wei"),
    ("Southern Qi", r"southern\s+qi"),
    ("Northern Qi", r"northern\s+qi"),
    ("Southern Chen", r"southern\s+chen"),
    ("Eastern Wei", r"eastern\s+wei"),
    ("Western Wei", r"western\s+wei"),
    ("Five Dynasties", r"five\s+dynasties"),
    ("Ten Kingdoms", r"ten\s+kingdoms"),
    ("Three Kingdoms", r"three\s+kingdoms"),
    ("Warring States", r"warring\s+states"),
    ("Spring and Autumn", r"spring\s+and\s+autumn"),
    ("Western Han", r"western\s+han"),
    ("Eastern Han", r"eastern\s+han"),
    ("Western Zhou", r"western\s+zhou"),
    ("Eastern Zhou", r"eastern\s+zhou"),
    ("Western Liang", r"western\s+liang"),
    ("Southern Liang", r"southern\s+liang"),
    ("Northern Liang", r"northern\s+liang"),
    ("Liao", r"\bliao\s+dynasty\b|\bliao\b"),
    ("Jin", r"\bjin\s+dynasty\b|\bjin\b"),
    ("Yuan", r"yuan\s+dynasty|\byuan\b"),
    ("Qing", r"qing\s+dynasty|\bqing\b"),
    ("Ming", r"ming\s+dynasty|\bming\b"),
    ("Tang", r"tang\s+dynasty|\btang\b"),
    ("Song", r"song\s+dynasty|\bsong\b"),
    ("Han", r"han\s+dynasty|\bhan\b"),
    ("Sui", r"sui\s+dynasty|\bsui\b"),
    ("Shang", r"shang\s+dynasty|\bshang\b"),
    ("Zhou", r"\bzhou\s+dynasty\b|\bzhou\b"),
    ("Qin", r"qin\s+dynasty|\bqin\b"),
    ("Xia", r"xia\s+dynasty|\bxia\b"),
    ("Xin", r"\bxin\s+dynasty\b"),
    ("Wei", r"\bwei\b"),
    ("Qi", r"\bqi\b"),
)

# Precompiled patterns in same order
_COMPILED: tuple[tuple[str, re.Pattern[str]], ...] = tuple(
    (label, re.compile(pat, re.IGNORECASE)) for label, pat in _DYNASTY_RULES
)

# Map canonical label → regex fragments for Neo4j Java-style regex (one big alternation).
_FILTER_PARTS: dict[str, list[str]] = {}
for _canon, _pat in _DYNASTY_RULES:
    _FILTER_PARTS.setdefault(_canon, []).append(_pat)


def extract_clean_dynasty(raw: str | None) -> str | None:
    """Return canonical dynasty name, or ``None`` if no known keyword matches."""
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    for canonical, cre in _COMPILED:
        if cre.search(s):
            return canonical
    return None


def dynasty_for_api(raw: str | None) -> str:
    """API field value: canonical dynasty or empty string when unknown."""
    clean = extract_clean_dynasty(raw)
    return clean if clean else ""


@lru_cache(maxsize=256)
def neo4j_regex_for_filter(canonical: str) -> str:
    """Regex for ``=~`` so rows whose raw ``dynasty`` parses to ``canonical`` match."""
    key = canonical.strip()
    parts = _FILTER_PARTS.get(key)
    if not parts:
        words = key.split()
        if len(words) <= 1:
            w = re.escape(words[0] if words else key)
            return rf"(?is).*\b{w}\b.*"
        mid = r"\s+".join(re.escape(w) for w in words)
        return rf"(?is).*\b(?:{mid})\b.*"
    inner = "|".join(f"(?:{p})" for p in parts)
    # Neo4j =~ matches the entire property string; anchor with .* so substring
    # matches work (same as fallback branch below).
    return f"(?is).*(?:{inner}).*"


def merge_dynasty_counts(rows: Iterable[dict]) -> list[dict[str, str | int]]:
    """Merge raw ``dynasty`` buckets into canonical labels; drops unknowns."""
    from collections import Counter

    c: Counter[str] = Counter()
    for row in rows:
        raw = row.get("dynasty")
        cnt = int(row.get("count") or 0)
        if cnt <= 0:
            continue
        clean = extract_clean_dynasty(
            str(raw).strip() if raw is not None else "",
        )
        if clean:
            c[clean] += cnt
    out = [{"dynasty": k, "count": v} for k, v in c.most_common()]
    return out


def distinct_canonical_dynasties_from_raw(raw_values: Iterable[str | None]) -> list[str]:
    """Sorted unique canonical names from a stream of raw DB strings."""
    seen: set[str] = set()
    for raw in raw_values:
        if raw is None:
            continue
        c = extract_clean_dynasty(str(raw).strip())
        if c:
            seen.add(c)
    return sorted(seen)
