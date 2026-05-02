"""Overseas Relic Knowledge Service — FastAPI entrypoint.

Neo4j integration flow:
- ``NEO4J_URI`` set → ``/relics`` tries graph (see ``app.services.relics``); on failure or empty → JSON
- No URI → JSON only (local dev without Docker Neo4j)
"""

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
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


def _normalize_relic_payload(row: dict) -> dict:
    """Unified API relic shape from JSON (supports legacy ``image``)."""
    r = dict(row)
    legacy_img = r.pop("image", None)
    raw_url = r.get("image_url")
    if isinstance(raw_url, str) and raw_url.strip():
        image_url = raw_url.strip()
    elif isinstance(legacy_img, str) and legacy_img.strip():
        image_url = legacy_img.strip()
    else:
        image_url = ""
    r["image_url"] = image_url
    r["description"] = str(r.get("description") or "").strip()
    r["material"] = str(r.get("material") or "").strip()
    r["dynasty"] = str(r.get("dynasty") or "").strip()
    r["museum"] = str(r.get("museum") or "").strip()
    nm = str(r.get("name") or "").strip()
    r["name"] = nm if nm else "Untitled relic"
    if r.get("id") is not None:
        r["id"] = str(r["id"])
    return r


def _filter_sample_relics(
    rows: list[dict],
    dynasty: str | None,
    search: str | None,
    material: str | None = None,
    museum: str | None = None,
) -> list[dict]:
    if dynasty:
        rows = [r for r in rows if (r.get("dynasty") or "") == dynasty]
    if material:
        rows = [r for r in rows if (r.get("material") or "") == material]
    if museum:
        rows = [r for r in rows if (r.get("museum") or "") == museum]
    if search:
        needle = search.lower()
        rows = [
            r
            for r in rows
            if needle in (r.get("name") or "").lower()
            or needle in (r.get("museum") or "").lower()
        ]
    return rows


def _json_filter_facets(
    raw: list[dict],
    d: str | None,
    m: str | None,
    mu: str | None,
    s: str | None,
) -> tuple[list[str], list[str], list[str]]:
    """Distinct dynasty / material / museum for dropdowns given other constraints."""
    dynasty_rows = _filter_sample_relics(raw, None, s, m, mu)
    dynasties = sorted({str(k.get("dynasty")) for k in dynasty_rows if k.get("dynasty")})

    material_rows = _filter_sample_relics(raw, d, s, None, mu)
    materials = sorted({str(k.get("material")) for k in material_rows if k.get("material")})

    museum_rows = _filter_sample_relics(raw, d, s, m, None)
    museums = sorted({str(k.get("museum")) for k in museum_rows if k.get("museum")})

    return dynasties, materials, museums


def _get_sample_relic_by_id(relic_id: str) -> dict | None:
    rid = (relic_id or "").strip()
    if not rid:
        return None
    for row in _load_sample_relics():
        if not isinstance(row, dict):
            continue
        if str(row.get("id") or "").strip() != rid:
            continue
        return _normalize_relic_payload(row)
    return None


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
    material: str | None = Query(None, description="Exact match on Relic.material when set."),
    museum: str | None = Query(None, description="Exact match on Relic.museum when set."),
    page: int = Query(1, ge=1, description="1-based page index."),
    limit: int = Query(10, ge=1, le=100, description="Page size."),
) -> dict:
    """Paginated relics: Neo4j when available, else JSON sample (filters apply before SKIP/LIMIT)."""
    d = (dynasty or "").strip() or None
    s = (search or "").strip() or None
    m = (material or "").strip() or None
    mu = (museum or "").strip() or None

    neo = relics_service.fetch_relics_page_from_neo4j(
        dynasty=d,
        search=s,
        material=m,
        museum=mu,
        page=page,
        limit=limit,
    )
    if neo is not None:
        return neo

    raw = _load_sample_relics()
    rows_full = _filter_sample_relics(raw, d, s, m, mu)
    total = len(rows_full)
    skip = (page - 1) * limit
    items = [_normalize_relic_payload(r) for r in rows_full[skip : skip + limit]]

    dynasties, materials, museums = _json_filter_facets(raw, d, m, mu, s)

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "dynasties": dynasties,
        "materials": materials,
        "museums": museums,
    }


@app.get("/relics/{relic_id}")
def get_relic(relic_id: str) -> dict:
    """Single relic (Neo4j when available, otherwise sample JSON)."""
    neo = relics_service.fetch_relic_by_id_from_neo4j(relic_id.strip())
    if neo is not None:
        return neo

    fallback = _get_sample_relic_by_id(relic_id.strip())
    if fallback is None:
        raise HTTPException(status_code=404, detail="Relic not found")
    return fallback


@app.get("/relics/{relic_id}/related")
def related_relics(relic_id: str) -> list[dict]:
    """Same item shape as ``/relics`` entries; ``[]`` when Neo4j is not used or has no matches."""
    return relics_service.fetch_related_relics_from_neo4j(relic_id)
