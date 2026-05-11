"""Relic list sourcing: Neo4j graph when available, else JSON sample file.

Neo4j extension points:
- Change RELICS_CYPHER to match your schema (labels, relationship traversals)
- Map node properties in ``_records_to_relics`` when you add fields
"""

from __future__ import annotations

import json
import os
from typing import Any

from openai import OpenAI

from app.core import database

# Example schema: ``(:Relic {id, name, dynasty, museum, material, description, image_url})``
_RELICS_MATCH_FILTERED = """
MATCH (r:Relic)
WHERE ($dynasty IS NULL OR r.dynasty = $dynasty)
  AND ($material IS NULL OR r.material = $material)
  AND ($museum IS NULL OR r.museum = $museum)
  AND (
    $search IS NULL
    OR toLower(coalesce(r.name, '')) CONTAINS toLower($search)
    OR toLower(coalesce(r.museum, '')) CONTAINS toLower($search)
  )
"""

RELICS_PAGE_RETURN = """
RETURN r.id AS id,
       r.name AS name,
       r.dynasty AS dynasty,
       r.museum AS museum,
       r.material AS material,
       r.description AS description,
       coalesce(r.image_url, r.image, '') AS image_url,
       coalesce(r.artist, '') AS artist,
       coalesce(r.date, '') AS date,
       coalesce(r.culture, '') AS culture,
       coalesce(r.period, '') AS period,
       coalesce(r.classification, '') AS classification,
       coalesce(r.accession_number, '') AS accession_number,
       coalesce(r.dimensions, '') AS dimensions,
       coalesce(r.credit_line, '') AS credit_line,
       coalesce(r.object_url, '') AS object_url,
       coalesce(r.place, '') AS place
"""

# Whitelisted ORDER BY expressions (never interpolate user strings here).
_SORT_ORDER_FIELDS: dict[str, str] = {
    "name": "coalesce(r.name, '')",
    "dynasty": "coalesce(r.dynasty, '')",
    "period": "coalesce(r.dynasty, '')",
    "date": "coalesce(r.date, '')",
}


def _neo_order_clause(sort_key: str, ascending: bool) -> str:
    expr = _SORT_ORDER_FIELDS.get(sort_key, _SORT_ORDER_FIELDS["name"])
    direction = "ASC" if ascending else "DESC"
    return f"ORDER BY {expr} {direction}"


RELICS_COUNT_CYPHER = (
    _RELICS_MATCH_FILTERED
    + """
RETURN count(r) AS total
"""
)

RELICS_DYNASTIES_FACET_CYPHER = """
MATCH (r:Relic)
WHERE ($material IS NULL OR r.material = $material)
  AND ($museum IS NULL OR r.museum = $museum)
  AND (
    $search IS NULL
    OR toLower(coalesce(r.name, '')) CONTAINS toLower($search)
    OR toLower(coalesce(r.museum, '')) CONTAINS toLower($search)
  )
RETURN DISTINCT r.dynasty AS dynasty
ORDER BY dynasty
"""

RELICS_MATERIALS_FACET_CYPHER = """
MATCH (r:Relic)
WHERE ($dynasty IS NULL OR r.dynasty = $dynasty)
  AND ($museum IS NULL OR r.museum = $museum)
  AND (
    $search IS NULL
    OR toLower(coalesce(r.name, '')) CONTAINS toLower($search)
    OR toLower(coalesce(r.museum, '')) CONTAINS toLower($search)
  )
RETURN DISTINCT r.material AS material
ORDER BY material
"""

RELICS_MUSEUMS_FACET_CYPHER = """
MATCH (r:Relic)
WHERE ($dynasty IS NULL OR r.dynasty = $dynasty)
  AND ($material IS NULL OR r.material = $material)
  AND (
    $search IS NULL
    OR toLower(coalesce(r.name, '')) CONTAINS toLower($search)
    OR toLower(coalesce(r.museum, '')) CONTAINS toLower($search)
  )
RETURN DISTINCT r.museum AS museum
ORDER BY museum
"""

RELATED_RELICS_CYPHER = """
MATCH (r:Relic {id: $id})
MATCH (other:Relic)
WHERE other.id <> $id
  AND (other.dynasty = r.dynasty OR other.museum = r.museum)
RETURN other.id AS id,
       other.name AS name,
       other.dynasty AS dynasty,
       other.museum AS museum,
       other.material AS material,
       other.description AS description,
       coalesce(other.image_url, other.image, '') AS image_url,
       coalesce(other.artist, '') AS artist,
       coalesce(other.date, '') AS date,
       coalesce(other.culture, '') AS culture,
       coalesce(other.period, '') AS period,
       coalesce(other.classification, '') AS classification,
       coalesce(other.accession_number, '') AS accession_number,
       coalesce(other.dimensions, '') AS dimensions,
       coalesce(other.credit_line, '') AS credit_line,
       coalesce(other.object_url, '') AS object_url,
       coalesce(other.place, '') AS place
LIMIT 5
"""

ADVANCED_SEARCH_MATCH = """
MATCH (r:Relic)
WHERE ($name IS NULL OR toLower(r.name) CONTAINS toLower($name))
  AND ($museum IS NULL OR toLower(r.museum) CONTAINS toLower($museum))
  AND ($dynasty IS NULL OR r.dynasty = $dynasty)
  AND ($material IS NULL OR toLower(r.material) CONTAINS toLower($material))
  AND ($artist IS NULL OR toLower(coalesce(r.artist,'')) CONTAINS toLower($artist))
  AND ($classification IS NULL OR toLower(coalesce(r.classification,'')) CONTAINS toLower($classification))
  AND ($date_from IS NULL OR toInteger(left(r.date, 4)) >= $date_from)
  AND ($date_to IS NULL OR toInteger(left(r.date, 4)) <= $date_to)
"""

ADVANCED_SEARCH_COUNT_CYPHER = (
    ADVANCED_SEARCH_MATCH
    + """
RETURN count(r) AS total
"""
)

ADVANCED_SEARCH_PAGE_RETURN = """
RETURN r.id AS id, r.name AS name, r.dynasty AS dynasty,
       r.museum AS museum, r.material AS material,
       r.description AS description,
       coalesce(r.image_url, r.image, '') AS image_url,
       r.artist AS artist, r.date AS date
"""

TIMELINE_BY_CENTURY_CYPHER = """
MATCH (r:Relic)
WITH substring(coalesce(r.date, ''), 0, 4) AS y4
WHERE y4 =~ '^[0-9]{4}$'
WITH toInteger(y4) AS y
WHERE y >= 1 AND y <= 9999
WITH (toInteger(floor(toFloat(y) / 100.0)) + 1) AS century_ord, count(*) AS cnt
RETURN century_ord, cnt
ORDER BY century_ord ASC
"""

NL_SEARCH_SYSTEM_PROMPT = (
    "You are a search assistant for Chinese cultural heritage relics. Extract search filters "
    'and return ONLY valid JSON with these fields: {name, dynasty, material, museum, artist, '
    "date_from, date_to} — null for unspecified."
)

STATS_TOTAL_RELICS_CYPHER = "MATCH (r:Relic) RETURN count(r) AS total"

STATS_BY_MUSEUM_CYPHER = """
MATCH (r:Relic)
RETURN r.museum AS museum, count(r) AS count
ORDER BY count DESC
"""

STATS_BY_DYNASTY_CYPHER = """
MATCH (r:Relic)
RETURN r.dynasty AS dynasty, count(r) AS count
ORDER BY count DESC
LIMIT 15
"""

STATS_BY_MATERIAL_CYPHER = """
MATCH (r:Relic)
RETURN r.material AS material, count(r) AS count
ORDER BY count DESC
LIMIT 15
"""

STATS_DISTINCT_DYNASTIES_CYPHER = """
MATCH (r:Relic)
WHERE coalesce(r.dynasty, '') <> ''
RETURN count(DISTINCT r.dynasty) AS total
"""

STATS_DISTINCT_MATERIALS_CYPHER = """
MATCH (r:Relic)
WHERE coalesce(r.material, '') <> ''
RETURN count(DISTINCT r.material) AS total
"""

RELIC_BY_ID_CYPHER = """
MATCH (r:Relic {id: $id})
RETURN r.id AS id,
       r.name AS name,
       r.dynasty AS dynasty,
       r.museum AS museum,
       r.material AS material,
       r.description AS description,
       coalesce(r.image_url, r.image, '') AS image_url,
       coalesce(r.artist, '') AS artist,
       coalesce(r.date, '') AS date,
       coalesce(r.culture, '') AS culture,
       coalesce(r.period, '') AS period,
       coalesce(r.classification, '') AS classification,
       coalesce(r.accession_number, '') AS accession_number,
       coalesce(r.dimensions, '') AS dimensions,
       coalesce(r.credit_line, '') AS credit_line,
       coalesce(r.object_url, '') AS object_url,
       coalesce(r.place, '') AS place
LIMIT 1
"""


def _records_to_relics(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Normalize driver rows to API relic dicts."""
    out: list[dict[str, Any]] = []
    for row in records:
        rid = row.get("id")
        if rid is None:
            continue
        raw_url = row.get("image_url") if row.get("image_url") is not None else row.get("image")
        item = {
            "id": str(rid),
            "name": row.get("name") or "",
            "dynasty": row.get("dynasty") or "",
            "museum": row.get("museum") or "",
            "material": row.get("material") or "",
            "description": row.get("description") or "",
            "image_url": str(raw_url).strip() if raw_url is not None else "",
            "artist": row.get("artist") or "",
            "date": row.get("date") or "",
            "culture": row.get("culture") or "",
            "period": row.get("period") or "",
            "classification": row.get("classification") or "",
            "accession_number": row.get("accession_number") or "",
            "dimensions": row.get("dimensions") or "",
            "credit_line": row.get("credit_line") or "",
            "object_url": row.get("object_url") or "",
            "place": row.get("place") or "",
        }
        for k, v in row.items():
            if k not in item and k != "image":
                item[k] = "" if v is None else str(v).strip()
        out.append(item)
    return out


def fetch_relics_page_from_neo4j(
    dynasty: str | None,
    search: str | None,
    material: str | None,
    museum: str | None,
    page: int,
    limit: int,
    sort: str | None,
    ascending: bool,
) -> dict[str, Any] | None:
    """Paginated relics from Neo4j, or None to signal \"use JSON fallback\"."""
    if not database.is_neo4j_configured():
        return None
    if not database.verify_connection():
        return None
    sort_key = (sort or "name").strip().lower()
    if sort_key == "period":
        sort_key = "dynasty"
    if sort_key not in _SORT_ORDER_FIELDS:
        sort_key = "name"

    page_cypher = (
        _RELICS_MATCH_FILTERED
        + RELICS_PAGE_RETURN
        + "\n"
        + _neo_order_clause(sort_key, ascending)
        + """
SKIP $skip
LIMIT $limit
"""
    )

    params_filter: dict[str, Any] = {
        "dynasty": dynasty,
        "search": search,
        "material": material,
        "museum": museum,
    }
    skip = (page - 1) * limit
    params_page = {**params_filter, "skip": int(skip), "limit": int(limit)}
    try:
        count_rows = database.run_read_query(RELICS_COUNT_CYPHER, params_filter)
        total = int(count_rows[0]["total"]) if count_rows else 0
    except Exception:
        return None

    no_filters = dynasty is None and search is None and material is None and museum is None
    if total == 0 and no_filters:
        return None

    try:
        records = database.run_read_query(page_cypher, params_page)
    except Exception:
        return None

    items = _records_to_relics(records)

    params_dynasty_facet = {"material": material, "museum": museum, "search": search}
    params_material_facet = {"dynasty": dynasty, "museum": museum, "search": search}
    params_museum_facet = {"dynasty": dynasty, "material": material, "search": search}

    dynasties = _facet_strings(
        RELICS_DYNASTIES_FACET_CYPHER,
        params_dynasty_facet,
        "dynasty",
    )
    materials = _facet_strings(
        RELICS_MATERIALS_FACET_CYPHER,
        params_material_facet,
        "material",
    )
    museums = _facet_strings(
        RELICS_MUSEUMS_FACET_CYPHER,
        params_museum_facet,
        "museum",
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "dynasties": dynasties,
        "materials": materials,
        "museums": museums,
    }


def fetch_relics_export_neo4j(
    dynasty: str | None,
    search: str | None,
    material: str | None,
    museum: str | None,
    sort: str | None,
    ascending: bool,
    max_rows: int = 10000,
) -> list[dict[str, Any]] | None:
    """Up to ``max_rows`` relic rows matching catalog filters, or None for JSON fallback."""
    if not database.is_neo4j_configured():
        return None
    if not database.verify_connection():
        return None

    sort_key = (sort or "name").strip().lower()
    if sort_key == "period":
        sort_key = "dynasty"
    if sort_key not in _SORT_ORDER_FIELDS:
        sort_key = "name"

    params_filter: dict[str, Any] = {
        "dynasty": dynasty,
        "search": search,
        "material": material,
        "museum": museum,
    }
    export_cypher = (
        _RELICS_MATCH_FILTERED
        + RELICS_PAGE_RETURN
        + "\n"
        + _neo_order_clause(sort_key, ascending)
        + """
SKIP 0
LIMIT $limit
"""
    )

    try:
        count_rows = database.run_read_query(RELICS_COUNT_CYPHER, params_filter)
        total = int(count_rows[0]["total"]) if count_rows else 0
    except Exception:
        return None

    no_filters = (
        dynasty is None and search is None and material is None and museum is None
    )
    if total == 0 and no_filters:
        return None

    cap = max(1, min(int(max_rows), 10000))
    try:
        records = database.run_read_query(
            export_cypher,
            {**params_filter, "limit": cap},
        )
    except Exception:
        return None

    return _records_to_relics(records)


def _ordinal_en(n: int) -> str:
    if 11 <= (n % 100) <= 13:
        return f"{n}th"
    suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def century_ord_labels(century_ord: int) -> tuple[str, str]:
    """``1644``-style bucketing: ``year // 100 + 1`` → ``(\"17th century\", \"1600-1699\")``."""
    start = (century_ord - 1) * 100
    end = century_ord * 100 - 1
    return f"{_ordinal_en(century_ord)} century", f"{start}-{end}"


def fetch_timeline_from_neo4j() -> dict[str, Any] | None:
    """Century histogram from Neo4j date prefix years, or None to use JSON fallback."""
    if not database.is_neo4j_configured():
        return None
    if not database.verify_connection():
        return None
    try:
        total_rows = database.run_read_query(STATS_TOTAL_RELICS_CYPHER, {})
        total = int(total_rows[0]["total"]) if total_rows else 0
    except Exception:
        return None
    if total == 0:
        return None
    try:
        rows = database.run_read_query(TIMELINE_BY_CENTURY_CYPHER, {})
    except Exception:
        return None

    periods: list[dict[str, Any]] = []
    for row in rows:
        c_ord = _neo_count_int(row.get("century_ord"))
        if c_ord < 1:
            continue
        cnt = _neo_count_int(row.get("cnt"))
        century_label, range_label = century_ord_labels(c_ord)
        periods.append(
            {"century": century_label, "label": range_label, "count": cnt},
        )
    return {"periods": periods}


def get_museum_relic_counts_neo4j() -> dict[str, int] | None:
    """``museum_name -> count`` from Neo4j, or None if graph unavailable / empty."""
    if not database.is_neo4j_configured():
        return None
    if not database.verify_connection():
        return None
    try:
        total_rows = database.run_read_query(STATS_TOTAL_RELICS_CYPHER, {})
        total = int(total_rows[0]["total"]) if total_rows else 0
    except Exception:
        return None
    if total == 0:
        return None
    try:
        rows = database.run_read_query(STATS_BY_MUSEUM_CYPHER, {})
    except Exception:
        return None

    out: dict[str, int] = {}
    for row in rows:
        name = _neo_bucket_label(row.get("museum"))
        if name:
            out[name] = _neo_count_int(row.get("count"))
    return out


def normalize_nl_parsed_filters(data: Any) -> dict[str, Any | None]:
    """Normalize OpenAI JSON into advanced-search filter kwargs."""
    keys = ("name", "dynasty", "material", "museum", "artist", "date_from", "date_to")
    out: dict[str, Any | None] = {k: None for k in keys}
    if not isinstance(data, dict):
        return out
    for k in keys:
        if k not in data:
            continue
        v = data[k]
        if v is None:
            out[k] = None
            continue
        if k in ("date_from", "date_to"):
            try:
                out[k] = int(v)
            except (TypeError, ValueError):
                out[k] = None
            continue
        s = str(v).strip()
        out[k] = s or None
    return out


def extract_nl_filters_with_openai(user_query: str) -> dict[str, Any | None]:
    """Call GPT-4o-mini to extract filters; raises ``RuntimeError`` if API key missing."""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY missing")

    client = OpenAI(api_key=api_key)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": NL_SEARCH_SYSTEM_PROMPT},
            {"role": "user", "content": user_query.strip()},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )
    raw_text = (resp.choices[0].message.content or "").strip()
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError("Model response was not valid JSON") from e
    return normalize_nl_parsed_filters(data)


def _facet_strings(cypher: str, params: dict[str, Any], key: str) -> list[str]:
    try:
        facet_rows = database.run_read_query(cypher, params)
    except Exception:
        return []
    return sorted(
        str(row[key])
        for row in facet_rows
        if row.get(key) not in (None, "")
    )


def fetch_relic_by_id_from_neo4j(relic_id: str) -> dict[str, Any] | None:
    """Single relic by id, or None to fall through to JSON / 404."""
    rid = (relic_id or "").strip()
    if not rid:
        return None
    if not database.is_neo4j_configured():
        return None
    if not database.verify_connection():
        return None
    try:
        records = database.run_read_query(RELIC_BY_ID_CYPHER, {"id": rid})
    except Exception:
        return None
    if not records:
        return None
    items = _records_to_relics(records)
    return items[0] if items else None


def _neo_count_int(val: Any) -> int:
    try:
        return int(val)
    except (TypeError, ValueError):
        return 0


def _neo_bucket_label(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


def fetch_stats_from_neo4j() -> dict[str, Any] | None:
    """Aggregate relic stats from Neo4j, or None to use JSON fallback."""
    if not database.is_neo4j_configured():
        return None
    if not database.verify_connection():
        return None
    try:
        total_rows = database.run_read_query(STATS_TOTAL_RELICS_CYPHER, {})
        total_relics = _neo_count_int(total_rows[0]["total"]) if total_rows else 0
    except Exception:
        return None

    if total_relics == 0:
        return None

    try:
        museum_rows = database.run_read_query(STATS_BY_MUSEUM_CYPHER, {})
        dynasty_rows = database.run_read_query(STATS_BY_DYNASTY_CYPHER, {})
        material_rows = database.run_read_query(STATS_BY_MATERIAL_CYPHER, {})
        d_tot_rows = database.run_read_query(STATS_DISTINCT_DYNASTIES_CYPHER, {})
        m_tot_rows = database.run_read_query(STATS_DISTINCT_MATERIALS_CYPHER, {})
    except Exception:
        return None

    by_museum: list[dict[str, Any]] = []
    for row in museum_rows:
        label = _neo_bucket_label(row.get("museum"))
        if not label:
            continue
        by_museum.append({"museum": label, "count": _neo_count_int(row.get("count"))})

    by_dynasty: list[dict[str, Any]] = []
    for row in dynasty_rows:
        label = _neo_bucket_label(row.get("dynasty"))
        if not label:
            continue
        by_dynasty.append({"dynasty": label, "count": _neo_count_int(row.get("count"))})

    by_material: list[dict[str, Any]] = []
    for row in material_rows:
        label = _neo_bucket_label(row.get("material"))
        if not label:
            continue
        by_material.append({"material": label, "count": _neo_count_int(row.get("count"))})

    total_museums = len(by_museum)
    total_dynasties = _neo_count_int(d_tot_rows[0]["total"]) if d_tot_rows else 0
    total_materials = _neo_count_int(m_tot_rows[0]["total"]) if m_tot_rows else 0

    return {
        "total_relics": total_relics,
        "total_museums": total_museums,
        "total_dynasties": total_dynasties,
        "total_materials": total_materials,
        "by_museum": by_museum,
        "by_dynasty": by_dynasty,
        "by_material": by_material,
    }


def fetch_advanced_search_from_neo4j(
    name: str | None,
    museum: str | None,
    dynasty: str | None,
    material: str | None,
    date_from: int | None,
    date_to: int | None,
    artist: str | None,
    classification: str | None,
    page: int,
    limit: int,
    sort: str | None,
    ascending: bool,
) -> dict[str, Any] | None:
    """Paginated advanced search from Neo4j, or None to use JSON fallback."""
    if not database.is_neo4j_configured():
        return None
    if not database.verify_connection():
        return None

    sort_key = (sort or "name").strip().lower()
    if sort_key == "period":
        sort_key = "dynasty"
    if sort_key not in _SORT_ORDER_FIELDS:
        sort_key = "name"

    skip = (page - 1) * limit
    filter_params: dict[str, Any] = {
        "name": name,
        "museum": museum,
        "dynasty": dynasty,
        "material": material,
        "artist": artist,
        "classification": classification,
        "date_from": date_from,
        "date_to": date_to,
    }
    params_page: dict[str, Any] = {
        **filter_params,
        "skip": int(skip),
        "limit": int(limit),
    }

    page_cypher = (
        ADVANCED_SEARCH_MATCH
        + ADVANCED_SEARCH_PAGE_RETURN
        + "\n"
        + _neo_order_clause(sort_key, ascending)
        + """
SKIP $skip LIMIT $limit
"""
    )

    try:
        count_rows = database.run_read_query(ADVANCED_SEARCH_COUNT_CYPHER, filter_params)
        total = int(count_rows[0]["total"]) if count_rows else 0
    except Exception:
        return None

    try:
        records = database.run_read_query(page_cypher, params_page)
    except Exception:
        return None

    items = _records_to_relics(records)
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
    }


def fetch_related_relics_from_neo4j(relic_id: str) -> list[dict[str, Any]]:
    """Related relics by shared dynasty or museum."""
    rid = (relic_id or "").strip()
    if not rid:
        return []
    if not database.is_neo4j_configured():
        return []
    if not database.verify_connection():
        return []
    try:
        records = database.run_read_query(RELATED_RELICS_CYPHER, {"id": rid})
    except Exception:
        return []
    return _records_to_relics(records)
