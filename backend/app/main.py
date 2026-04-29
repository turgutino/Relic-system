"""Overseas Relic Knowledge Service — FastAPI entrypoint.

Neo4j integration flow:
- ``NEO4J_URI`` set → ``/relics`` tries graph (see ``app.services.relics``); on failure or empty → JSON
- No URI → JSON only (local dev without Docker Neo4j)
"""

import json
from pathlib import Path

from fastapi import FastAPI
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


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/relics")
def list_relics() -> list[dict]:
    """List relics: Neo4j when available (5–10 rows), else ``database/graph/sample_relics.json``."""
    from_graph = relics_service.fetch_relics_from_neo4j()
    if from_graph is not None:
        return from_graph
    return _load_sample_relics()
