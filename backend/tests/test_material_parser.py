"""Unit tests for ``material_parser``."""

import re

import pytest

from app.services import material_parser


@pytest.mark.parametrize(
    ("raw", "expected_subset"),
    [
        ("Handscroll; ink and color on silk", {"Silk", "Ink"}),
        ("Ink and color on silk", {"Silk", "Ink"}),
        ("Stoneware with celadon glaze", {"Stoneware"}),
        ("Gilt bronze", {"Bronze", "Gold"}),
        ("Nephrite jade", {"Jade"}),
        ("Tortoise plastron", {"Shell"}),
        ("Silk embroidered with gold couching", {"Silk", "Gold"}),
        ("Bronze", {"Bronze"}),
    ],
)
def test_extract_core_materials(raw: str, expected_subset: set[str]):
    cores = material_parser.extract_core_materials(raw)
    assert set(cores) == expected_subset


def test_material_for_api_joins_sorted():
    assert material_parser.material_for_api("Ink and color on silk") == "Ink, Silk"


def test_merge_material_counts_splits_multi_label_buckets():
    rows = [
        {"material": "Gilt bronze", "count": 2},
        {"material": "Bronze", "count": 3},
    ]
    merged = material_parser.merge_material_counts(rows)
    d = {m["material"]: m["count"] for m in merged}
    assert d["Bronze"] == 5
    assert d["Gold"] == 2


def test_neo4j_material_regex_matches_full_prop_string():
    pat = material_parser.neo4j_regex_for_filter("Silk")
    assert re.fullmatch(pat, "Ink and color on silk")


def test_canonicalize_query_case_insensitive_known_label():
    assert material_parser.canonicalize_material_query("silk") == "Silk"


def test_raw_matches_filter_uses_extracted_canon():
    assert material_parser.raw_matches_material_filter("Ink on silk panel", "Silk")
    assert not material_parser.raw_matches_material_filter("Ink on silk panel", "Bronze")
