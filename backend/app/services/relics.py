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
# Seed idea (run in Neo4j Browser): MERGE (:Relic {id:'r001', name:'...', ...})
RELICS_CYPHER = """
MATCH (r:Relic)
RETURN r.id AS id,
       r.name AS name,
       r.dynasty AS dynasty,
       r.museum AS museum,
       r.description AS description,
       r.image AS image
ORDER BY coalesce(r.name, '')
LIMIT 10
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


def fetch_relics_from_neo4j() -> list[dict[str, Any]] | None:
    """Return relics from Neo4j, or None to signal \"use JSON fallback\".

    None means: not configured, connection failed, query error, or empty result set.
    """
    if not database.is_neo4j_configured():
        return None
    if not database.verify_connection():
        return None
    try:
        records = database.run_read_query(RELICS_CYPHER)
    except Exception:
        return None
    relics = _records_to_relics(records)
    return relics if relics else None
