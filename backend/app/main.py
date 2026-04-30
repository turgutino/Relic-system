"""Overseas Relic Knowledge Service — FastAPI entrypoint.

Neo4j integration flow:
- ``NEO4J_URI`` set → ``/relics`` tries graph (see ``app.services.relics``); on failure or empty → JSON
- No URI → JSON only (local dev without Docker Neo4j)
"""

import json
from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.services import relics as relics_service

# Repo root: backend/app/main.py -> parents[2] == Relic-system
REPO_ROOT = Path(__file__).resolve().parents[2]
SAMPLE_RELICS_PATH = REPO_ROOT / "database" / "graph" / "sample_relics.json"

app = FastAPI(
    title="Overseas Relic Knowledge Service",
    version="0.1.0",
    description="API for relic metadata: optional Neo4j + sample JSON fallback.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_sample_relics() -> list[dict]:
    if not SAMPLE_RELICS_PATH.is_file():
        return []
    with SAMPLE_RELICS_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def _filter_sample_relics(
    rows: list[dict],
    dynasty: str | None,
    search: str | None,
) -> list[dict]:
    if dynasty:
        rows = [r for r in rows if (r.get("dynasty") or "") == dynasty]
    if search:
        needle = search.lower()
        rows = [
            r
            for r in rows
            if needle in (r.get("name") or "").lower()
            or needle in (r.get("museum") or "").lower()
        ]
    return rows


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/relics")
def list_relics(
    dynasty: str | None = Query(None, description="Exact match on Relic.dynasty when set."),
    search: str | None = Query(
        None,
        description="Case-insensitive substring match on name or museum.",
    ),
    page: int = Query(1, ge=1, description="1-based page index."),
    limit: int = Query(10, ge=1, le=100, description="Page size."),
) -> dict:
    """Paginated relics: Neo4j when available, else JSON sample (filters apply before SKIP/LIMIT)."""
    d = (dynasty or "").strip() or None
    s = (search or "").strip() or None

    neo = relics_service.fetch_relics_page_from_neo4j(
        dynasty=d,
        search=s,
        page=page,
        limit=limit,
    )
    if neo is not None:
        return neo

    raw = _load_sample_relics()
    rows_full = _filter_sample_relics(raw, d, s)
    total = len(rows_full)
    skip = (page - 1) * limit
    items = rows_full[skip : skip + limit]

    dynasties: list[str] = []
    if d is None:
        facet_rows = _filter_sample_relics(raw, None, s)
        dynasties = sorted(
            {str(r.get("dynasty")) for r in facet_rows if r.get("dynasty")},
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "dynasties": dynasties,
    }


@app.get("/relics/{relic_id}/related")
def related_relics(relic_id: str) -> list[dict]:
    """Same item shape as ``/relics`` entries; ``[]`` when Neo4j is not used or has no matches."""
    return relics_service.fetch_related_relics_from_neo4j(relic_id)
