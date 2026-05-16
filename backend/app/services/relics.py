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
from app.services import dynasty_parser, material_parser

# Example schema: ``(:Relic {id, name, dynasty, museum, material, description, image_url, artist …})``

# Shared catalog text query: case-insensitive substring on primary relic text fields.
_CATALOG_SEARCH_TEXT_PREDICATE = """
    $search IS NULL OR trim(coalesce($search, '')) = ''
    OR toLower(coalesce(r.name, '')) CONTAINS toLower(trim($search))
    OR toLower(coalesce(r.museum, '')) CONTAINS toLower(trim($search))
    OR toLower(coalesce(r.dynasty, '')) CONTAINS toLower(trim($search))
    OR toLower(coalesce(r.material, '')) CONTAINS toLower(trim($search))
    OR toLower(coalesce(r.artist, r.author, '')) CONTAINS toLower(trim($search))
    OR toLower(coalesce(r.classification, '')) CONTAINS toLower(trim($search))
    OR toLower(coalesce(r.description, '')) CONTAINS toLower(trim($search))
"""

SEARCH_ORDER_RANK_CASE = """CASE
      WHEN $search IS NULL OR trim(coalesce($search, '')) = '' THEN 0
      WHEN trim(toLower(coalesce(r.name,''))) = trim(toLower(trim($search))) THEN 100
      WHEN toLower(trim(coalesce(r.name,''))) STARTS WITH toLower(trim($search)) THEN 80
      WHEN toLower(coalesce(r.name,'')) CONTAINS toLower(trim($search)) THEN 70
      WHEN toLower(coalesce(r.artist, r.author, '')) CONTAINS toLower(trim($search)) THEN 62
      WHEN toLower(coalesce(r.classification,'')) CONTAINS toLower(trim($search)) THEN 60
      WHEN toLower(coalesce(r.museum,'')) CONTAINS toLower(trim($search)) THEN 55
      WHEN toLower(coalesce(r.dynasty,'')) CONTAINS toLower(trim($search)) THEN 52
      WHEN toLower(coalesce(r.material,'')) CONTAINS toLower(trim($search)) THEN 51
      WHEN toLower(coalesce(r.description,'')) CONTAINS toLower(trim($search)) THEN 48
      ELSE 0
    END"""

_RELICS_MATCH_FILTERED = """
MATCH (r:Relic)
WHERE CASE WHEN $dynasty IS NULL THEN true ELSE coalesce(r.dynasty, '') =~ $dynasty_regex END
  AND CASE WHEN $material_regex IS NULL THEN true ELSE coalesce(r.material, '') =~ $material_regex END
  AND ($museum IS NULL OR r.museum = $museum)
  AND (
""" + _CATALOG_SEARCH_TEXT_PREDICATE + """
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


def _neo_catalog_order_clause(search: str | None, sort_key: str, ascending: bool) -> str:
    """When ``search`` is set, relevance (exact/then partial name …) takes precedence."""
    expr = _SORT_ORDER_FIELDS.get(sort_key, _SORT_ORDER_FIELDS["name"])
    dir2 = "ASC" if ascending else "DESC"
    if search is None or not str(search).strip():
        return _neo_order_clause(sort_key, ascending)
    return f"ORDER BY {SEARCH_ORDER_RANK_CASE} DESC, {expr} {dir2}"


RELICS_COUNT_CYPHER = (
    _RELICS_MATCH_FILTERED
    + """
RETURN count(r) AS total
"""
)

RELICS_DYNASTIES_FACET_CYPHER = """
MATCH (r:Relic)
WHERE CASE WHEN $material_regex IS NULL THEN true ELSE coalesce(r.material, '') =~ $material_regex END
  AND ($museum IS NULL OR r.museum = $museum)
  AND (
""" + _CATALOG_SEARCH_TEXT_PREDICATE + """
  )
RETURN DISTINCT r.dynasty AS dynasty
ORDER BY dynasty
"""

RELICS_MATERIALS_FACET_CYPHER = """
MATCH (r:Relic)
WHERE CASE WHEN $dynasty IS NULL THEN true ELSE coalesce(r.dynasty, '') =~ $dynasty_regex END
  AND ($museum IS NULL OR r.museum = $museum)
  AND (
""" + _CATALOG_SEARCH_TEXT_PREDICATE + """
  )
RETURN DISTINCT r.material AS material
ORDER BY material
"""

RELICS_MUSEUMS_FACET_CYPHER = """
MATCH (r:Relic)
WHERE CASE WHEN $dynasty IS NULL THEN true ELSE coalesce(r.dynasty, '') =~ $dynasty_regex END
  AND CASE WHEN $material_regex IS NULL THEN true ELSE coalesce(r.material, '') =~ $material_regex END
  AND (
""" + _CATALOG_SEARCH_TEXT_PREDICATE + """
  )
RETURN DISTINCT r.museum AS museum
ORDER BY museum
"""

RELATED_RELICS_CYPHER = """
MATCH (r:Relic {id: $id})
MATCH (other:Relic)
WHERE other.id <> $id
  AND (
    other.museum = r.museum
    OR (
      coalesce(r.dynasty, '') <> ''
      AND coalesce(other.dynasty, '') <> ''
    )
  )
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
LIMIT 40
"""

ADVANCED_SEARCH_MATCH = """
MATCH (r:Relic)
WHERE ($name IS NULL OR toLower(r.name) CONTAINS toLower($name))
  AND ($museum IS NULL OR toLower(r.museum) CONTAINS toLower($museum))
  AND CASE WHEN $dynasty IS NULL THEN true ELSE coalesce(r.dynasty, '') =~ $dynasty_regex END
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

STATS_BY_DYNASTY_RAW_CYPHER = """
MATCH (r:Relic)
WHERE coalesce(r.dynasty, '') <> ''
RETURN r.dynasty AS dynasty, count(*) AS count
"""

STATS_BY_MATERIAL_RAW_CYPHER = """
MATCH (r:Relic)
WHERE coalesce(r.material, '') <> ''
RETURN r.material AS material, count(r) AS count
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


def _dynasty_match_params(dynasty: str | None) -> dict[str, Any]:
    """Neo4j parameters for canonical dynasty filtering on raw ``r.dynasty`` strings."""
    if not dynasty or not str(dynasty).strip():
        return {"dynasty": None, "dynasty_regex": None}
    dv = str(dynasty).strip()
    return {"dynasty": dv, "dynasty_regex": dynasty_parser.neo4j_regex_for_filter(dv)}


def _material_match_params(material: str | None) -> dict[str, Any]:
    """Neo4j parameters for facet / list filter on raw ``r.medium`` via keyword regex."""
    if not material or not str(material).strip():
        return {"material_regex": None}
    mv = str(material).strip()
    return {"material_regex": material_parser.neo4j_regex_for_filter(mv)}


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
            "dynasty": dynasty_parser.dynasty_for_api(row.get("dynasty")),
            "museum": row.get("museum") or "",
            "material": material_parser.material_for_api(row.get("material")),
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
        + _neo_catalog_order_clause(search, sort_key, ascending)
        + """
SKIP $skip
LIMIT $limit
"""
    )

    params_filter: dict[str, Any] = {
        **_dynasty_match_params(dynasty),
        **_material_match_params(material),
        "search": search,
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

    params_dynasty_facet = {
        **_material_match_params(material),
        "museum": museum,
        "search": search,
    }
    params_material_facet = {**_dynasty_match_params(dynasty), "museum": museum, "search": search}
    params_museum_facet = {
        **_dynasty_match_params(dynasty),
        **_material_match_params(material),
        "search": search,
    }

    dynasties = _facet_dynasties_canonical(
        RELICS_DYNASTIES_FACET_CYPHER,
        params_dynasty_facet,
    )
    materials = _facet_materials_canonical(
        RELICS_MATERIALS_FACET_CYPHER,
        params_material_facet,
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
        **_dynasty_match_params(dynasty),
        **_material_match_params(material),
        "search": search,
        "museum": museum,
    }
    export_cypher = (
        _RELICS_MATCH_FILTERED
        + RELICS_PAGE_RETURN
        + "\n"
        + _neo_catalog_order_clause(search, sort_key, ascending)
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
    dyn = out.get("dynasty")
    if dyn:
        out["dynasty"] = dynasty_parser.extract_clean_dynasty(str(dyn).strip())
    mat_nl = out.get("material")
    if mat_nl:
        mq = material_parser.canonicalize_material_query(str(mat_nl).strip())
        out["material"] = mq if mq else None
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


def _facet_dynasties_canonical(cypher: str, params: dict[str, Any]) -> list[str]:
    """Distinct dynasty facet values normalized to canonical parser labels."""
    try:
        facet_rows = database.run_read_query(cypher, params)
    except Exception:
        return []
    raws = [row.get("dynasty") for row in facet_rows if row.get("dynasty") not in (None, "")]
    return dynasty_parser.distinct_canonical_dynasties_from_raw(raws)


def _facet_materials_canonical(cypher: str, params: dict[str, Any]) -> list[str]:
    """Distinct material facet labels derived from canonical parsing of stored medium strings."""
    try:
        facet_rows = database.run_read_query(cypher, params)
    except Exception:
        return []
    raws = [
        row.get("material") for row in facet_rows if row.get("material") not in (None, "")
    ]
    return material_parser.distinct_canonical_materials_from_raw(raws)


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
        dynasty_rows = database.run_read_query(STATS_BY_DYNASTY_RAW_CYPHER, {})
        material_rows = database.run_read_query(STATS_BY_MATERIAL_RAW_CYPHER, {})
    except Exception:
        return None

    by_museum: list[dict[str, Any]] = []
    for row in museum_rows:
        label = _neo_bucket_label(row.get("museum"))
        if not label:
            continue
        by_museum.append({"museum": label, "count": _neo_count_int(row.get("count"))})

    by_dynasty = dynasty_parser.merge_dynasty_counts(dynasty_rows)[:15]

    canon_dynasties: set[str] = set()
    for row in dynasty_rows:
        raw_d = row.get("dynasty")
        c = dynasty_parser.extract_clean_dynasty(str(raw_d).strip() if raw_d is not None else "")
        if c:
            canon_dynasties.add(c)

    merged_materials = material_parser.merge_material_counts(material_rows)
    by_material = merged_materials[:15]

    total_museums = len(by_museum)
    total_dynasties = len(canon_dynasties)
    total_materials = len(merged_materials)

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
        **_dynasty_match_params(dynasty),
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
    """Related relics by shared canonical dynasty or museum."""
    rid = (relic_id or "").strip()
    if not rid:
        return []
    if not database.is_neo4j_configured():
        return []
    if not database.verify_connection():
        return []

    anchor = fetch_relic_by_id_from_neo4j(rid)
    if anchor is None:
        return []

    try:
        records = database.run_read_query(RELATED_RELICS_CYPHER, {"id": rid})
    except Exception:
        return []

    items = _records_to_relics(records)
    am = (anchor.get("museum") or "").strip()
    ac = (anchor.get("dynasty") or "").strip()

    ranked: list[tuple[int, dict[str, Any]]] = []
    for o in items:
        oid = str(o.get("id") or "").strip()
        if not oid or oid == rid:
            continue
        om = (o.get("museum") or "").strip()
        od = (o.get("dynasty") or "").strip()
        same_m = bool(am and om == am)
        same_d = bool(ac and od == ac)
        if not same_m and not same_d:
            continue
        score = 2 if same_m and same_d else 1
        ranked.append((score, o))

    ranked.sort(key=lambda x: (-x[0], (x[1].get("name") or "").lower()))
    return [row for _, row in ranked[:5]]
