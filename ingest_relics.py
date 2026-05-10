"""
Overseas Chinese relic ingestion — Met, Cleveland, V&A, Art Institute of Chicago.

Met: 8 search queries (union + dedupe IDs), up to 400 accepted rows.
All sources: core schema fields + source-specific extras; every property saved to Neo4j
as strings (empty string for missing/null). Clears :Relic nodes first.

Usage:
    pip install neo4j requests python-dotenv openai
    python ingest_relics.py

Env: backend/.env — NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, OPENAI_API_KEY
"""

from __future__ import annotations

import os
import random
import re
import time
from typing import Any

import requests
from dotenv import load_dotenv
from neo4j import GraphDatabase
from openai import OpenAI

load_dotenv(dotenv_path="backend/.env")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687").strip()
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j").strip() or "neo4j"
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

TIMEOUT = 15
PROGRESS_EVERY = 50
AI_BATCH_SIZE = 10
AI_BATCH_DELAY_SEC = 1.0
OPENAI_MODEL = "gpt-4o-mini"
OPENAI_BATCH_MAX_TOKENS = 60

STAGE1_KEYWORDS: tuple[str, ...] = (
    "china",
    "chinese",
    "tang",
    "song",
    "ming",
    "qing",
    "han",
    "zhou",
    "yuan",
)

TARGET_MET = 400
TARGET_CLEVELAND = 300
TARGET_VA = 200
TARGET_ARTIC = 100

MET_MUSEUM = "Metropolitan Museum of Art, New York"
CLEVELAND_MUSEUM = "Cleveland Museum of Art"
VA_MUSEUM = "Victoria and Albert Museum, London"
ARTIC_MUSEUM = "Art Institute of Chicago"

ARTIC_IIIF_TMPL = "https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg"

MET_SEARCH_QUERIES: tuple[str, ...] = (
    "Chinese",
    "China",
    "Chinese art",
    "China jade",
    "China silk",
    "China lacquer",
    "Chinese porcelain",
    "Chinese bronze",
)

# ──────────────────────────────────────────────
# String / Neo4j helpers
# ──────────────────────────────────────────────


def neo_str(value: Any) -> str:
    """Normalize for Neo4j: null → \"\", everything else → string."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def first_str(*values: Any) -> str:
    for v in values:
        if isinstance(v, list):
            # Extract first non-empty string element from list
            for item in v:
                s = neo_str(item)
                if s:
                    return s
        else:
            s = neo_str(v)
            if s:
                return s
    return ""


def props_for_neo(relic: dict[str, Any]) -> dict[str, str]:
    """All relic keys except id → string properties for SET r += $props."""
    return {k: neo_str(v) for k, v in relic.items() if k != "id"}


def _filter_blob(relic: dict[str, Any]) -> str:
    skip = frozenset({"id", "image_url"})
    parts: list[str] = []
    for k, v in sorted(relic.items()):
        if k in skip:
            continue
        parts.append(neo_str(v))
    return " ".join(parts).lower()


def passes_chinese_heritage_filter(relic: dict[str, Any]) -> bool:
    """Stage 1: keep if any non-id/non-image field mentions a Chinese-heritage keyword."""
    blob = _filter_blob(relic)
    return any(k in blob for k in STAGE1_KEYWORDS)


_AI_BATCH_LINE = re.compile(
    r"^\s*(\d+)\s*[\.)]\s*(YES|NO)\b",
    re.IGNORECASE,
)


def batch_ai_prompt(batch: list[dict[str, Any]]) -> str:
    header = (
        "For each item below, answer YES if it is a genuine ancient Chinese "
        "cultural heritage artifact, or NO if it is not.\n"
        "Reply with only a numbered list like:\n"
        "1. YES\n"
        "2. NO\n"
        "3. YES\n"
        "...\n"
        "\n"
        "Items:\n"
    )
    items = []
    for i, r in enumerate(batch, start=1):
        items.append(
            f"{i}. Name: {neo_str(r.get('name'))}, Dynasty: {neo_str(r.get('dynasty'))}, "
            f"Material: {neo_str(r.get('material'))}, Artist: {neo_str(r.get('artist'))}"
        )
    return header + "\n".join(items)


def parse_batch_ai_verdicts(raw: str | None, expected: int) -> list[bool | None]:
    """Map line index 1..expected → True (YES), False (NO), or None if missing/unparseable."""
    found: dict[int, bool] = {}
    for line in neo_str(raw).splitlines():
        m = _AI_BATCH_LINE.match(line.strip())
        if not m:
            continue
        idx = int(m.group(1))
        if 1 <= idx <= expected:
            found[idx] = m.group(2).upper() == "YES"
    return [found.get(i) for i in range(1, expected + 1)]


def ai_filter_relics(client: OpenAI, relics: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    """Stage 2: one GPT call per batch of AI_BATCH_SIZE; 1s pause between batches."""
    accepted: list[dict[str, Any]] = []
    rejected = 0
    n = len(relics)
    for start in range(0, n, AI_BATCH_SIZE):
        batch = relics[start : start + AI_BATCH_SIZE]
        bc = len(batch)
        call_ok = False
        verdicts: list[bool | None] = [None] * bc
        try:
            resp = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": batch_ai_prompt(batch)}],
                max_tokens=OPENAI_BATCH_MAX_TOKENS,
                temperature=0,
            )
            verdicts = parse_batch_ai_verdicts(resp.choices[0].message.content, bc)
            call_ok = True
        except Exception as e:
            print(f"  [OpenAI batch error] rows {start + 1}-{start + bc}: {e}")

        for r, v in zip(batch, verdicts):
            if call_ok and v is True:
                accepted.append(r)
                continue
            rejected += 1
            if call_ok and v is False:
                print(f"  [AI rejected] {neo_str(r.get('name'))}")
            elif call_ok and v is None:
                print(f"  [AI rejected — unparsed line] {neo_str(r.get('name'))}")

        if start + AI_BATCH_SIZE < n:
            time.sleep(AI_BATCH_DELAY_SEC)
    return accepted, rejected


def has_real_image(url: str | None) -> bool:
    u = neo_str(url)
    return u.startswith(("http://", "https://"))


def progress(count: int, label: str) -> None:
    if count > 0 and count % PROGRESS_EVERY == 0:
        print(f"  [{label}] {count} records accepted")


def va_primary_maker_name(obj: dict[str, Any]) -> str:
    pm = obj.get("_primaryMaker")
    if isinstance(pm, dict):
        return neo_str(pm.get("name") or pm.get("makerName"))
    if isinstance(pm, str):
        return neo_str(pm)
    if pm is None:
        return ""
    return neo_str(pm)


def va_place_text(obj: dict[str, Any]) -> str:
    p = obj.get("_primaryPlace")
    if isinstance(p, dict):
        return neo_str(p.get("name") or p.get("text") or "")
    return neo_str(p)


# ──────────────────────────────────────────────
# Neo4j
# ──────────────────────────────────────────────


def get_driver():
    return GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


MERGE_CYPHER = """
MERGE (r:Relic {id: $id})
SET r += $props
"""

# Update-only: never creates a node if id is missing (unlike MERGE).
UPDATE_EXISTING_RELIC_CYPHER = """
MATCH (r:Relic {id: $id})
SET r += $props
RETURN r.id AS id
"""


def save_to_neo4j(driver, relics: list[dict[str, Any]]) -> int:
    saved = 0
    with driver.session() as session:
        for i, r in enumerate(relics, start=1):
            try:
                session.run(
                    MERGE_CYPHER,
                    id=r["id"],
                    props=props_for_neo(r),
                ).consume()
                saved += 1
                if i % PROGRESS_EVERY == 0:
                    print(f"  [Neo4j] {i} records written…")
            except Exception as e:
                print(f"  [Neo4j error] {r.get('id')}: {e}")
    return saved


def update_neo4j_relic_if_exists(driver, relics: list[dict[str, Any]]) -> int:
    """MATCH by id then SET props; skip when no node (never CREATE)."""
    updated = 0
    with driver.session() as session:
        for i, r in enumerate(relics, start=1):
            rid = r.get("id")
            if not rid:
                continue
            try:
                rec = session.run(
                    UPDATE_EXISTING_RELIC_CYPHER,
                    id=rid,
                    props=props_for_neo(r),
                ).single()
                if rec is not None and rec.get("id"):
                    updated += 1
                if i % PROGRESS_EVERY == 0:
                    print(f"  [Neo4j] {i} relics processed…")
            except Exception as e:
                print(f"  [Neo4j error] {rid}: {e}")
    return updated


def load_existing_cleveland_ids(driver) -> set[str]:
    """Neo4j Relic ids already stored from Cleveland (prefix cma_) — refetch fix targets only."""
    with driver.session() as session:
        result = session.run(
            "MATCH (r:Relic) WHERE r.id STARTS WITH $prefix RETURN r.id AS id",
            prefix="cma_",
        )
        return {neo_str(rec["id"]) for rec in result if rec.get("id")}


def clear_relic_nodes(driver) -> None:
    with driver.session() as session:
        session.run("MATCH (r:Relic) DETACH DELETE r").consume()
    print("✓ Köhnə data silindi")


# ──────────────────────────────────────────────
# 1. Metropolitan Museum of Art
# ──────────────────────────────────────────────


def met_collect_object_ids() -> list[int]:
    base = "https://collectionapi.metmuseum.org/public/collection/v1/search"
    ids: set[int] = set()
    for q in MET_SEARCH_QUERIES:
        r = requests.get(base, params={"q": q, "hasImages": True}, timeout=TIMEOUT)
        r.raise_for_status()
        raw = r.json().get("objectIDs") or []
        for x in raw:
            try:
                ids.add(int(x))
            except (TypeError, ValueError):
                continue
    out = list(ids)
    random.shuffle(out)
    return out


def fetch_met(limit: int) -> list[dict[str, Any]]:
    print("\n── Metropolitan Museum of Art ──")
    relics: list[dict[str, Any]] = []
    try:
        ids = met_collect_object_ids()
        print(f"  Union {len(MET_SEARCH_QUERIES)} searches (hasImages): {len(ids)} unique object IDs")
        for obj_id in ids:
            if len(relics) >= limit:
                break
            try:
                obj = requests.get(
                    f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{obj_id}",
                    timeout=TIMEOUT,
                ).json()
                title = neo_str(obj.get("title"))
                if not title:
                    continue

                dynasty_src = obj.get("dynasty") or obj.get("period") or obj.get("culture")
                dynasty_s = neo_str(dynasty_src) or "Unknown"
                material_s = neo_str(obj.get("medium")) or "Unknown"
                desc = neo_str(obj.get("creditLine")) or neo_str(obj.get("classification"))
                img = neo_str(obj.get("primaryImage")) or neo_str(obj.get("primaryImageSmall"))

                artist = neo_str(obj.get("artistDisplayName")) or neo_str(obj.get("objectName"))

                row: dict[str, Any] = {
                    "id": f"met_{obj_id}",
                    "name": title,
                    "dynasty": dynasty_s,
                    "museum": MET_MUSEUM,
                    "material": material_s,
                    "description": desc,
                    "image_url": img,
                    "artist": artist,
                    "date": neo_str(obj.get("objectDate")),
                    "culture": neo_str(obj.get("culture")),
                    "period": neo_str(obj.get("period")),
                    "classification": neo_str(obj.get("classification")),
                    "accession_number": neo_str(obj.get("accessionNumber")),
                    "dimensions": neo_str(obj.get("dimensions")),
                    "country": neo_str(obj.get("country")),
                    "region": neo_str(obj.get("region")),
                    "credit_line": neo_str(obj.get("creditLine")),
                    "object_url": neo_str(obj.get("objectURL")),
                }

                if not has_real_image(row["image_url"]):
                    continue
                if not passes_chinese_heritage_filter(row):
                    continue
                relics.append(row)
                progress(len(relics), "Met")
                time.sleep(0.05)
            except Exception:
                continue
    except Exception as e:
        print(f"  [Met error] {e}")
    print(f"  ✓ Met: {len(relics)} records (cap {limit})")
    return relics


# ──────────────────────────────────────────────
# 2. Cleveland Museum of Art
# ──────────────────────────────────────────────

CLEVELAND_API_URL = "https://openaccess-api.clevelandart.org/api/artworks/"


def _cleveland_image_url(obj: dict[str, Any]) -> str:
    images = obj.get("images") or {}
    img_url = ""
    web = images.get("web") or {}
    if isinstance(web, dict):
        img_url = neo_str(web.get("url"))
    if not img_url:
        pr = images.get("print") or {}
        if isinstance(pr, dict):
            img_url = neo_str(pr.get("url"))
    return img_url


def cleveland_artist_first_str(obj: dict[str, Any]) -> str:
    for key in ("creators", "artists"):
        raw = obj.get(key)
        if not isinstance(raw, list) or not raw:
            continue
        first = raw[0]
        if isinstance(first, dict):
            s = first_str(
                first.get("description"),
                first.get("name"),
                first.get("maker"),
                first.get("biography"),
            )
            if s:
                return s
        else:
            s = neo_str(first)
            if s:
                return s
    return ""


def _build_cleveland_row(obj: dict[str, Any]) -> dict[str, Any] | None:
    """Map Cleveland API artwork JSON → relic dict; None if missing id."""
    oid = obj.get("id")
    if oid is None:
        return None
    title = first_str(obj.get("title")) or "Untitled"
    dynasty_s = first_str(obj.get("dynasty"), obj.get("period"), obj.get("culture")) or "Unknown"
    material_s = first_str(
        obj.get("technique"),
        obj.get("material"),
        obj.get("medium"),
        obj.get("type"),
    ) or "Unknown"
    description = first_str(
        obj.get("description"),
        obj.get("fun_fact"),
        obj.get("wall_description"),
    )
    dims_raw = obj.get("dimensions")
    if isinstance(dims_raw, dict):
        painting_raw = dims_raw.get("painting") or dims_raw.get("overall") or {}
        painting = painting_raw if isinstance(painting_raw, dict) else {}
        h = painting.get("height_inch", "")
        w = painting.get("width_inch", "")
        dimensions = f"{h} x {w} in." if h and w else ""
    else:
        dimensions = first_str(dims_raw)
    row: dict[str, Any] = {
        "id": f"cma_{neo_str(oid)}",
        "name": title,
        "dynasty": dynasty_s,
        "museum": CLEVELAND_MUSEUM,
        "material": material_s,
        "description": description,
        "image_url": _cleveland_image_url(obj),
        "artist": cleveland_artist_first_str(obj),
        "date": first_str(obj.get("creation_date"), obj.get("creation_date_earliest")),
        "culture": first_str(obj.get("culture")),
        "classification": first_str(obj.get("classification_type")),
        "accession_number": first_str(obj.get("accession_number"), obj.get("accession_number_alpha")),
        "dimensions": dimensions,
        "credit_line": neo_str(obj.get("creditline")),
        "object_url": neo_str(obj.get("url")),
    }
    return row


def fetch_all_cleveland_rows_paginated() -> list[dict[str, Any]]:
    """Every Cleveland artwork page for ingest queries (culture / q fallback); deduped by id."""
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    skip = 0
    batch = 100
    while True:
        data, mode = _cleveland_fetch_page(skip, batch)
        if not mode or not data:
            break
        for obj in data:
            built = _build_cleveland_row(obj)
            if built is None:
                continue
            rid = built["id"]
            if rid in seen:
                continue
            seen.add(rid)
            rows.append(built)
        skip += batch
        time.sleep(0.1)
    return rows


def _cleveland_fetch_page(skip: int, batch: int) -> tuple[list[dict[str, Any]], str]:
    """Try culture=Chinese first; on HTTP/JSON failure retry q=chinese."""
    primary = {
        "culture": "Chinese",
        "has_image": 1,
        "limit": batch,
        "skip": skip,
    }
    fallback = {
        "q": "chinese",
        "has_image": 1,
        "limit": batch,
        "skip": skip,
    }

    for label, params in (("primary (culture=Chinese)", primary), ("fallback (q=chinese)", fallback)):
        try:
            r = requests.get(CLEVELAND_API_URL, params=params, timeout=TIMEOUT)
        except requests.RequestException as e:
            print(f"  [Cleveland] {label}: request failed: {e}")
            continue

        if not r.ok:
            snippet = (r.text or "")[:200]
            print(
                f"  [Cleveland] {label}: HTTP {r.status_code}; "
                f"response[:200]={snippet!r}"
            )
            continue

        try:
            payload = r.json()
        except requests.exceptions.JSONDecodeError:
            snippet = (r.text or "")[:200]
            print(
                f"  [Cleveland] {label}: invalid JSON; HTTP {r.status_code}; "
                f"response[:200]={snippet!r}"
            )
            continue

        data = payload.get("data") or []
        if isinstance(data, list):
            return data, label
        snippet = (r.text or "")[:200]
        print(
            f"  [Cleveland] {label}: unexpected payload (no list data); "
            f"HTTP {r.status_code}; response[:200]={snippet!r}"
        )

    return [], ""


def fetch_cleveland(limit: int) -> list[dict[str, Any]]:
    print("\n── Cleveland Museum of Art ──")
    relics: list[dict[str, Any]] = []
    skip = 0
    batch = 100
    try:
        while len(relics) < limit:
            data, mode = _cleveland_fetch_page(skip, batch)
            if not mode:
                print("  [Cleveland] Both primary and fallback failed for this page; stopping.")
                break
            if not data:
                break
            for obj in data:
                if len(relics) >= limit:
                    break
                row = _build_cleveland_row(obj)
                if row is None:
                    continue

                if not has_real_image(row["image_url"]):
                    continue
                if not passes_chinese_heritage_filter(row):
                    continue
                relics.append(row)
                progress(len(relics), "Cleveland")
            skip += batch
            time.sleep(0.1)
    except Exception as e:
        print(f"  [Cleveland error] {e}")
    print(f"  ✓ Cleveland: {len(relics)} records (cap {limit})")
    return relics


# ──────────────────────────────────────────────
# 3. Victoria & Albert Museum
# ──────────────────────────────────────────────


def fetch_va(limit: int) -> list[dict[str, Any]]:
    print("\n── Victoria & Albert Museum ──")
    relics: list[dict[str, Any]] = []
    page = 1
    try:
        while len(relics) < limit:
            url = "https://api.vam.ac.uk/v2/objects/search"
            params = {
                "q": "China",
                "kw_place": "China",
                "images_exist": 1,
                "page_size": 50,
                "page": page,
            }
            r = requests.get(url, params=params, timeout=TIMEOUT)
            r.raise_for_status()
            records = r.json().get("records") or []
            if not records:
                break
            for obj in records:
                if len(relics) >= limit:
                    break
                img = obj.get("_images") or {}
                img_url = ""
                base = neo_str(img.get("_iiif_image_base_url"))
                if base:
                    img_url = f"{base.rstrip('/')}/full/800,/0/default.jpg"
                elif img.get("_primary_thumbnail"):
                    img_url = neo_str(img["_primary_thumbnail"])

                sid = neo_str(obj.get("systemNumber")) or neo_str(obj.get("accessionNumber"))
                title = neo_str(obj.get("_primaryTitle")) or "Untitled"
                date_text = neo_str(obj.get("_primaryDate")) or "Unknown"
                artist = va_primary_maker_name(obj)
                desc = neo_str(obj.get("_primaryDescription"))
                material_s = neo_str(obj.get("objectType")) or "Unknown"

                object_url = f"https://collections.vam.ac.uk/item/{sid}" if sid else ""

                row: dict[str, Any] = {
                    "id": f"va_{sid}",
                    "name": title,
                    "dynasty": date_text,
                    "museum": VA_MUSEUM,
                    "material": material_s,
                    "description": desc,
                    "image_url": img_url,
                    "artist": artist,
                    "date": neo_str(obj.get("_primaryDate")),
                    "place": va_place_text(obj),
                    "accession_number": sid,
                    "object_url": object_url,
                }

                if not sid:
                    continue
                if not has_real_image(row["image_url"]):
                    continue
                if not passes_chinese_heritage_filter(row):
                    continue
                relics.append(row)
                progress(len(relics), "V&A")
            page += 1
            time.sleep(0.15)
    except Exception as e:
        print(f"  [V&A error] {e}")
    print(f"  ✓ V&A: {len(relics)} records (cap {limit})")
    return relics


# ──────────────────────────────────────────────
# 4. Art Institute of Chicago
# ──────────────────────────────────────────────


ARTIC_SEARCH_FIELDS = (
    "id,title,date_display,medium_display,artist_display,description,image_id,"
    "classification_title,main_reference_number,dimensions,credit_line"
)


def fetch_artic(limit: int) -> list[dict[str, Any]]:
    print("\n── Art Institute of Chicago ──")
    relics: list[dict[str, Any]] = []
    offset = 0
    page_size = 100

    try:
        while len(relics) < limit:
            url = "https://api.artic.edu/api/v1/artworks/search"
            params = {
                "q": "Chinese",
                "limit": page_size,
                "offset": offset,
                "fields": ARTIC_SEARCH_FIELDS,
            }
            r = requests.get(url, params=params, timeout=TIMEOUT)
            r.raise_for_status()
            payload = r.json()
            rows = payload.get("data") or []
            if not rows:
                break
            for row in rows:
                if len(relics) >= limit:
                    break
                aid = row.get("id")
                image_id = row.get("image_id")
                if aid is None or not image_id:
                    continue

                img_url = ARTIC_IIIF_TMPL.format(image_id=image_id)
                title = neo_str(row.get("title")) or "Untitled"
                dynasty_s = neo_str(row.get("date_display")) or "Unknown"
                material_s = neo_str(row.get("medium_display")) or "Unknown"
                artist_disp = neo_str(row.get("artist_display"))
                desc_s = neo_str(row.get("description"))

                classification = neo_str(row.get("classification_title"))
                acc_num = neo_str(row.get("main_reference_number"))
                dims = neo_str(row.get("dimensions"))
                credit = neo_str(row.get("credit_line"))
                object_url = f"https://www.artic.edu/artworks/{aid}"

                rec: dict[str, Any] = {
                    "id": f"artic_{aid}",
                    "name": title,
                    "dynasty": dynasty_s,
                    "museum": ARTIC_MUSEUM,
                    "material": material_s,
                    "description": desc_s,
                    "image_url": img_url,
                    "artist": artist_disp,
                    "date": neo_str(row.get("date_display")),
                    "classification": classification,
                    "accession_number": acc_num,
                    "dimensions": dims,
                    "credit_line": credit,
                    "object_url": object_url,
                }

                filter_row = {**rec, "description": f"{desc_s} {artist_disp}".strip()}
                if not passes_chinese_heritage_filter(filter_row):
                    continue
                if not has_real_image(rec["image_url"]):
                    continue

                rec["description"] = desc_s
                relics.append(rec)
                progress(len(relics), "Art IC")
            offset += page_size
            time.sleep(0.12)
    except Exception as e:
        print(f"  [Art Institute error] {e}")
    print(f"  ✓ Art Institute of Chicago: {len(relics)} records (cap {limit})")
    return relics


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────


def dedupe_by_id(relics: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for r in relics:
        rid = r.get("id")
        if not rid or rid in seen:
            continue
        seen.add(str(rid))
        out.append(r)
    return out


def fix_cleveland_only() -> None:
    """Refetch Cleveland API rows and update props only for Relic ids already in Neo4j (no CREATE)."""
    print("=" * 52)
    print("  Cleveland-only Neo4j refresh (MATCH update, no delete, no OpenAI)")
    print("=" * 52)

    driver = get_driver()
    try:
        driver.verify_connectivity()
        print("✓ Neo4j connection OK")
    except Exception as e:
        print(f"✗ Neo4j connection failed: {e}")
        print("  Check NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD in backend/.env")
        driver.close()
        return

    existing = load_existing_cleveland_ids(driver)
    if not existing:
        print("No existing Relic nodes with id prefix 'cma_' — nothing to update.")
        driver.close()
        return

    print(f"\n── Existing Cleveland relic ids in Neo4j: {len(existing)} ──")
    print("\n── Fetching Cleveland Open Access (full pagination, fixed first_str parsing)… ──")
    api_rows = fetch_all_cleveland_rows_paginated()
    candidates = [r for r in api_rows if r["id"] in existing]
    print(f"── API rows fetched: {len(api_rows)}, candidates matching existing ids: {len(candidates)} ──")

    if not candidates:
        print("No API rows for ids already in Neo4j — 0 updated.")
        driver.close()
        return

    print("\n── Updating Neo4j (MATCH existing id → SET; skip unknown ids, never CREATE)… ──")
    updated = update_neo4j_relic_if_exists(driver, candidates)
    driver.close()

    print("\n" + "=" * 52)
    print(f"  Cleveland records updated (existing ids only): {updated}")
    print("=" * 52)


def main() -> None:
    print("=" * 52)
    print("  Chinese heritage relics — overseas museums → Neo4j")
    print("=" * 52)

    driver = get_driver()
    try:
        driver.verify_connectivity()
        print("✓ Neo4j connection OK")
    except Exception as e:
        print(f"✗ Neo4j connection failed: {e}")
        print("  Check NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD in backend/.env")
        driver.close()
        return

    if not OPENAI_API_KEY:
        print("✗ OPENAI_API_KEY is missing or empty (set it in backend/.env)")
        driver.close()
        return

    clear_relic_nodes(driver)

    random.seed()

    combined: list[dict[str, Any]] = []
    combined.extend(fetch_met(TARGET_MET))
    combined.extend(fetch_cleveland(TARGET_CLEVELAND))
    combined.extend(fetch_va(TARGET_VA))
    combined.extend(fetch_artic(TARGET_ARTIC))

    unique = dedupe_by_id(combined)
    raw_total = len(combined)
    print(f"\n── Raw fetched: {raw_total} ──")
    print(f"── Unique after dedupe by id: {len(unique)} ──")

    print("\n── Stage 2: OpenAI verification (gpt-4o-mini, 1 API call per 10 relics)… ──")
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    verified, ai_rejected = ai_filter_relics(openai_client, unique)
    ai_accepted = len(verified)
    print(f"── AI filter: accepted={ai_accepted}, rejected={ai_rejected} ──")

    print("\n── Writing to Neo4j (MERGE + SET += all string props)… ──")
    saved = save_to_neo4j(driver, verified)
    driver.close()

    print("\n" + "=" * 52)
    print(f"  Done. Unique after dedupe: {len(unique)}")
    print(f"  AI accepted: {ai_accepted}  AI rejected: {ai_rejected}")
    print(f"  Saved to Neo4j: {saved}")
    print("=" * 52)


if __name__ == "__main__":
    import sys

    if "--fix-cleveland" in sys.argv:
        fix_cleveland_only()
    else:
        main()
