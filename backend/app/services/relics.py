"""Relic list sourcing: Neo4j graph when available, else JSON sample file.

Neo4j extension points:
- Change RELICS_CYPHER to match your schema (labels, relationship traversals)
- Map node properties in ``_records_to_relics`` when you add fields
- Trigger re-index / cache invalidation here after bulk imports
"""

from __future__ import annotations

from typing import Any

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

RELICS_COUNT_CYPHER = (
    _RELICS_MATCH_FILTERED
    + """
RETURN count(r) AS total
"""
)

RELICS_PAGE_CYPHER = (
    _RELICS_MATCH_FILTERED
    + """
RETURN r.id AS id,
       r.name AS name,
       r.dynasty AS dynasty,
       r.museum AS museum,
       r.material AS material,
       r.description AS description,
       coalesce(r.image_url, r.image, '') AS image_url
ORDER BY coalesce(r.name, '')
SKIP $skip
LIMIT $limit
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
       coalesce(other.image_url, other.image, '') AS image_url
LIMIT 5
"""

RELIC_BY_ID_CYPHER = """
MATCH (r:Relic {id: $id})
RETURN r.id AS id,
       r.name AS name,
       r.dynasty AS dynasty,
       r.museum AS museum,
       r.material AS material,
       r.description AS description,
       coalesce(r.image_url, r.image, '') AS image_url
LIMIT 1
"""


def _records_to_relics(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Normalize driver rows to API relic dicts; extend when Neo4j returns new properties."""
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
        }
        # Pass through additional RETURN aliases for forward-compatible clients
        for k, v in row.items():
            if k not in item and k != "image":
                item[k] = v
        out.append(item)
    return out


def fetch_relics_page_from_neo4j(
    dynasty: str | None,
    search: str | None,
    material: str | None,
    museum: str | None,
    page: int,
    limit: int,
) -> dict[str, Any] | None:
    """Paginated relics from Neo4j, or None to signal \"use JSON fallback\".

    None when not configured, connection/query failure, or legacy empty graph with no filters
    (caller falls back to JSON sample).
    """
    if not database.is_neo4j_configured():
        return None
    if not database.verify_connection():
        return None
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
        records = database.run_read_query(RELICS_PAGE_CYPHER, params_page)
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


def fetch_related_relics_from_neo4j(relic_id: str) -> list[dict[str, Any]]:
    """Related relics by shared dynasty or museum. Empty list when Neo4j unavailable or on error."""
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
