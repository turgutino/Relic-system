"""Relic list sourcing: Neo4j graph when available, else JSON sample file.

Neo4j extension points:
- Change RELICS_CYPHER to match your schema (labels, relationship traversals)
- Map node properties in ``_records_to_relics`` when you add fields
- Trigger re-index / cache invalidation here after bulk imports
"""

from __future__ import annotations

from typing import Any

from app.core import database

# Example schema: ``(:Relic {id, name, dynasty, museum, description, image})``
_RELICS_MATCH_FILTERED = """
MATCH (r:Relic)
WHERE ($dynasty IS NULL OR r.dynasty = $dynasty)
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
       r.description AS description,
       r.image AS image
ORDER BY coalesce(r.name, '')
SKIP $skip
LIMIT $limit
"""
)

RELICS_DYNASTIES_FACET_CYPHER = """
MATCH (r:Relic)
WHERE (
    $search IS NULL
    OR toLower(coalesce(r.name, '')) CONTAINS toLower($search)
    OR toLower(coalesce(r.museum, '')) CONTAINS toLower($search)
  )
RETURN DISTINCT r.dynasty AS dynasty
ORDER BY dynasty
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
       other.description AS description,
       other.image AS image
LIMIT 5
"""


def _records_to_relics(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Normalize driver rows to API relic dicts; extend when Neo4j returns new properties."""
    out: list[dict[str, Any]] = []
    for row in records:
        rid = row.get("id")
        if rid is None:
            continue
        item = {
            "id": str(rid),
            "name": row.get("name") or "",
            "dynasty": row.get("dynasty") or "",
            "museum": row.get("museum") or "",
            "description": row.get("description") or "",
            "image": row.get("image") or "",
        }
        # Pass through additional RETURN aliases for forward-compatible clients
        for k, v in row.items():
            if k not in item:
                item[k] = v
        out.append(item)
    return out


def fetch_relics_page_from_neo4j(
    dynasty: str | None,
    search: str | None,
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
    params_filter = {"dynasty": dynasty, "search": search}
    skip = (page - 1) * limit
    params_page = {**params_filter, "skip": int(skip), "limit": int(limit)}
    try:
        count_rows = database.run_read_query(RELICS_COUNT_CYPHER, params_filter)
        total = int(count_rows[0]["total"]) if count_rows else 0
    except Exception:
        return None

    if total == 0 and dynasty is None and search is None:
        return None

    try:
        records = database.run_read_query(RELICS_PAGE_CYPHER, params_page)
    except Exception:
        return None

    items = _records_to_relics(records)

    dynasties: list[str] = []
    if dynasty is None:
        try:
            facet_rows = database.run_read_query(
                RELICS_DYNASTIES_FACET_CYPHER,
                {"search": search},
            )
            dynasties = sorted(
                str(row["dynasty"])
                for row in facet_rows
                if row.get("dynasty") not in (None, "")
            )
        except Exception:
            dynasties = []

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "dynasties": dynasties,
    }


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
