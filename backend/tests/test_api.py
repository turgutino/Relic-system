"""API smoke tests (JSON fallback: NEO4J_URI cleared before app import)."""

import os

os.environ["NEO4J_URI"] = ""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    return TestClient(app)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_relics_first_page(client):
    r = client.get("/relics", params={"page": 1, "limit": 10})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data["items"], list)
    assert data["total"] >= 1
    assert "dynasties" in data


def test_relics_filters_and_sort(client):
    r = client.get(
        "/relics",
        params={"dynasty": "Han", "sort": "name", "order": "desc", "limit": 100},
    )
    assert r.status_code == 200
    items = r.json()["items"]
    for it in items:
        assert it.get("dynasty") == "Han"
    names = [it["name"].lower() for it in items]
    assert names == sorted(names, reverse=True)


def test_relic_detail(client):
    r = client.get("/relics/r001")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "r001"
    assert "name" in body


def test_related_json_fallback_has_entries(client):
    r = client.get("/relics/r001/related")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    assert all(it.get("id") != "r001" for it in body)


def test_related_unknown_anchor(client):
    r = client.get("/relics/unknown-id/related")
    assert r.status_code == 200
    assert r.json() == []
