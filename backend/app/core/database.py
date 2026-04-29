"""Neo4j connection helpers for the Overseas Relic Knowledge Service.

Integration notes (extend here):
- Add migrations / constraints: ``CREATE CONSTRAINT relic_id IF NOT EXISTS FOR (r:Relic) REQUIRE r.id IS UNIQUE``
- Swap ``run_read_query`` for a repository class when the graph schema grows
- On app shutdown, call ``close_driver()`` to release the driver cleanly
"""

import os
from functools import lru_cache
from typing import Any, Optional, Tuple

from neo4j import Driver, GraphDatabase


def is_neo4j_configured() -> bool:
    """Neo4j is opt-in: set NEO4J_URI (non-empty) to enable driver + graph queries."""
    return bool(os.getenv("NEO4J_URI", "").strip())


def _neo4j_uri() -> str:
    # Only called when ``is_neo4j_configured()`` is True
    return os.getenv("NEO4J_URI", "").strip()


def _neo4j_auth() -> Tuple[str, str]:
    user = os.getenv("NEO4J_USER", "neo4j").strip() or "neo4j"
    password = os.getenv("NEO4J_PASSWORD", "password")
    return (user, password)


@lru_cache(maxsize=1)
def _driver_singleton(uri: str, user: str, password: str) -> Driver:
    """Cached driver — keyed by connection params so env changes require process restart."""
    return GraphDatabase.driver(uri, auth=(user, password))


def get_driver() -> Optional[Driver]:
    """Return a Neo4j driver, or None if graph integration is disabled (no URI)."""
    if not is_neo4j_configured():
        return None
    u, p = _neo4j_auth()
    return _driver_singleton(_neo4j_uri(), u, p)


def close_driver() -> None:
    """Close cached drivers (call from FastAPI lifespan in production)."""
    _driver_singleton.cache_clear()


def verify_connection() -> bool:
    """Ping Neo4j with a trivial read. False if not configured or unreachable."""
    driver = get_driver()
    if driver is None:
        return False
    try:
        with driver.session() as session:
            session.run("RETURN 1 AS ok").consume()
        return True
    except Exception:
        return False


def run_read_query(
    cypher: str, parameters: Optional[dict[str, Any]] = None
) -> list[dict[str, Any]]:
    """Run a read-only Cypher query; return one dict per row (keys = RETURN aliases).

    Neo4j extension: add ``run_write_query`` / transactions for ingest pipelines.
    """
    driver = get_driver()
    if driver is None:
        raise RuntimeError("Neo4j is not configured (set NEO4J_URI).")

    params = parameters or {}
    with driver.session() as session:
        result = session.run(cypher, params)
        return [dict(record) for record in result]
