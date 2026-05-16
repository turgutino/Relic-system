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


def test_relic_qing_normalized_from_verbose_dynasty(client):
    r = client.get("/relics/r004")
    assert r.status_code == 200
    assert r.json().get("dynasty") == "Qing"


def test_relics_filter_canonical_dynasty_matches_verbose_source(client):
    r = client.get("/relics", params={"dynasty": "Qing", "limit": 50})
    assert r.status_code == 200
    ids = [it["id"] for it in r.json()["items"]]
    assert "r004" in ids


def test_relic_detail(client):
    r = client.get("/relics/r001")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "r001"
    assert "name" in body


def test_relic_detail_normalizes_verbose_material(client):
    r = client.get("/relics/r006")
    assert r.status_code == 200
    assert r.json().get("material") == "Ink, Silk"


def test_relics_material_filter_matches_verbose_medium(client):
    r = client.get("/relics", params={"material": "Silk", "limit": 50})
    assert r.status_code == 200
    ids = [it["id"] for it in r.json()["items"]]
    assert "r006" in ids
    assert "r008" in ids


def test_relics_facets_use_core_material_labels(client):
    r = client.get("/relics", params={"limit": 5})
    assert r.status_code == 200
    mats = r.json().get("materials") or []
    assert "Silk" in mats
    assert all("handscroll" not in m.lower() for m in mats)


def test_related_json_fallback_has_entries(client):
    r = client.get("/relics/r001/related")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    assert all(it.get("id") != "r001" for it in body)


def test_catalog_search_matches_description_any_case(client):
    r = client.get("/relics", params={"search": "MOUNTAIN-AND-WATER", "limit": 50})
    assert r.status_code == 200
    ids = [it["id"] for it in r.json()["items"]]
    assert "r006" in ids


def test_catalog_search_ranks_title_above_description_hit(client):
    r = client.get("/relics", params={"search": "ding", "limit": 50, "sort": "name", "order": "asc"})
    assert r.status_code == 200
    ids = [it["id"] for it in r.json()["items"]]
    assert "r001" in ids and "r009" in ids
    assert ids.index("r001") < ids.index("r009")


def test_related_unknown_anchor(client):
    r = client.get("/relics/unknown-id/related")
    assert r.status_code == 200
    assert r.json() == []
