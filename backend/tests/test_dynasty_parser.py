"""Unit tests for ``dynasty_parser``."""

import pytest

from app.services import dynasty_parser


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("China, Ming dynasty (1368–1644)", "Ming"),
        ("china, ming dynasty", "Ming"),
        ("Southern Song", "Southern Song"),
        ("Northern Wei", "Northern Wei"),
        ("Yuan", "Yuan"),
        ("Han", "Han"),
        ("Western Zhou", "Western Zhou"),
        ("618-907", None),
        ("19th century", None),
        ("29 October 1860", None),
        ("", None),
        (None, None),
    ],
)
def test_extract_clean_dynasty(raw: str | None, expected: str | None):
    assert dynasty_parser.extract_clean_dynasty(raw) == expected


def test_dynasty_for_api_empty_when_unknown():
    assert dynasty_parser.dynasty_for_api("19th century") == ""
    assert dynasty_parser.dynasty_for_api("Ming") == "Ming"


def test_neo4j_regex_for_filter_full_string_match_semantics():
    """Neo4j =~ requires regex to match the whole dynasty string, not only a substring."""
    import re

    pat_ming = dynasty_parser.neo4j_regex_for_filter("Ming")
    assert re.fullmatch(pat_ming, "China, Ming dynasty (1368–1644)")
    assert not re.fullmatch(pat_ming, "Tang dynasty")

    pat_fallback = dynasty_parser.neo4j_regex_for_filter("UnknownCanon")
    assert re.fullmatch(pat_fallback, "Prefix UnknownCanon suffix")


def test_merge_dynasty_counts_maps_raw():
    rows = [
        {"dynasty": "China, Ming dynasty (1368–1644)", "count": 3},
        {"dynasty": "Ming dynasty", "count": 2},
        {"dynasty": "19th century", "count": 99},
    ]
    merged = dynasty_parser.merge_dynasty_counts(rows)
    assert merged == [{"dynasty": "Ming", "count": 5}]
