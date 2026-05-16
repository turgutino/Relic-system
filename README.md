# Overseas Relic Knowledge Platform

Full-stack catalog for **Chinese heritage relics held in overseas museums**. The **FastAPI** backend serves relic metadata from **Neo4j** when `NEO4J_URI` is set and reachable; otherwise it falls back to **`database/graph/sample_relics.json`**. The **React** frontend lists and filters relics, opens detail pages with optional image zoom, and supports **English, Azerbaijani, and Chinese** UI strings via **i18next**.

---

## Implemented features

### Backend API

- **Hybrid data source**: graph queries when Neo4j is configured and healthy; otherwise the same routes read from `database/graph/sample_relics.json`.
- **Faceted list**: paginated `GET /relics` with optional filters (`dynasty`, `material`, `museum`), substring search (`search` on name/museum), and sorting (`sort`: `name` \| `dynasty` \| `date`; legacy `period` maps to dynasty). Response includes facet option lists (`dynasties`, `materials`, `museums`) aligned with other active constraints.
- **Detail**: `GET /relics/{id}` returns one normalized relic or **404**.
- **Related relics**: `GET /relics/{id}/related` returns up to five other relics sharing dynasty **or** museum (Neo4j); empty Neo4j path falls back to the same heuristic on JSON sample data.
- **Health**: `GET /health` for simple liveness checks.
- **CORS**: Allows common local dev origins (`localhost`/`127.0.0.1` on ports **3000** and **5173**).

### Frontend

- **Catalog** (`/`): card grid or list view (`view=list` in URL); pagination (`page`, fixed **10** items per page in code); debounced search (~400 ms) plus explicit search submit; sidebar facet dropdowns (dynasty, material, museum); sort field + asc/desc; active filter chips with clear-one / clear-facets / clear-all.
- **Shareable URLs**: Query string mirrors API concerns (e.g. `/?search=bronze&dynasty=…&material=…&museum=…&page=2&view=list&sort=name&order=asc`).
- **Detail** (`/relics/:id`): hero image with lightbox-style zoom when the image URL is HTTP(S); description; metadata table (dynasty, museum, material, artist, date, culture, period, classification, dimensions, accession, credit line, place); link to museum object URL when present; dynamically renders **additional** properties returned by the API beyond the known set (e.g. source-specific fields after ingestion).
- **Related section**: loads `/relics/:id/related`; navigates between related items while preserving catalog search state via router `state`.
- **Localization**: `LanguageSwitcher`, `DocumentLang`; translations under `frontend/src/locales/` (`en`, `az`, `zh`).

### UI components (`frontend/src/components/`)

| Component | Role |
|-----------|------|
| `FilterPanel` | Dynasty / material / museum selects driven by API facet arrays |
| `RelicCard` | Catalog card cell |
| `RelicListRow` | Catalog list row |
| `RelicDetail` | Detail layout (hero, zoom, attributes, extras, external link) |
| `LanguageSwitcher` | i18n locale toggle |
| `DocumentLang` | Keeps `document.documentElement.lang` in sync |

---

## Tech stack

| Layer | Technologies |
|--------|----------------|
| **Backend** | Python **FastAPI**, **Uvicorn**, **Neo4j** Python driver, **python-dotenv**, **httpx**, **pytest** |
| **Ingestion** (repo root) | **requests**, **neo4j**, **python-dotenv**, **OpenAI** SDK (`gpt-4o-mini` batch verification) |
| **Frontend** | **React 18**, **React Router 6**, **Vite 5**, **react-i18next** / **i18next** |
| **Data** | Neo4j `:Relic` nodes (optional); **`database/graph/sample_relics.json`** fallback |

---

## Project structure

```
Relic-system/
├── ingest_relics.py          # Museum APIs → keyword + AI filter → Neo4j; optional --fix-cleveland
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── database.py   # Neo4j driver, optional when NEO4J_URI unset
│   │   ├── services/
│   │   │   └── relics.py     # Cypher list/detail/related + normalization
│   │   └── main.py           # FastAPI routes, JSON fallback + facets
│   ├── tests/                # pytest API tests (typically JSON fallback)
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── vite.config.js        # port 3000; proxies /relics and /health → :8000
│   └── src/
│       ├── App.jsx           # Routes, catalog state, fetch wiring
│       ├── components/       # FilterPanel, RelicCard, RelicListRow, RelicDetail, …
│       ├── pages/            # HomePage, RelicDetailPage
│       ├── models/relic.js   # normalizeRelic, extra-field helpers
│       └── locales/          # en.json, az.json, zh.json
└── database/graph/
    └── sample_relics.json    # Offline / CI fallback dataset
```

---

## Getting started

### 1. Repository

```bash
git clone <your-repo-url> relic-system
cd relic-system
```

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
pip install -r requirements.txt
```

Create **`backend/.env`** (used when running uvicorn from `backend/` and loaded by `app/core/database.py`):

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

- Omit **`NEO4J_URI`** or leave it empty to use **JSON sample data only** (typical for tests or frontend-only demos).

Run the API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive docs: **http://127.0.0.1:8000/docs**

### 3. Neo4j (optional)

```bash
docker run --name neo4j-relics -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password -d neo4j:5.11
```

Browser UI: **http://localhost:7474**

### 4. Frontend

```bash
cd ../frontend
npm install
npm run start
```

Dev server: **http://localhost:3000**. **`vite.config.js`** proxies **`/relics`** and **`/health`** to **`http://127.0.0.1:8000`** — keep the backend on port **8000** when developing the UI.

### 5. Backend tests

From **`backend/`** with the venv active:

```bash
python -m pytest
```

Fixtures typically unset Neo4j so responses come from **`sample_relics.json`**.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/health` | Liveness: `{ "status": "ok" }` |
| **GET** | `/relics` | Paginated catalog. Query params: `page` (≥1), `limit` (1–100, default 10), `dynasty`, `material`, `museum` (exact match each when set), `search` (case-insensitive across name, museum, dynasty, material, artist/author, classification, description; relevance-ranked — exact title match first, then other partials), `sort` (`name` \| `dynasty` \| `date`; `period` treated as dynasty), `order` (`asc` \| `desc`). Response: `items`, `total`, `page`, `limit`, `dynasties`, `materials`, `museums`. |
| **GET** | `/relics/{relic_id}` | Single relic; **404** if missing. |
| **GET** | `/relics/{relic_id}/related` | JSON array (≤5) of related relics (shared dynasty or museum). |

Example:

```http
GET /relics?page=1&limit=10&museum=Metropolitan%20Museum%20of%20Art%2C%20New%20York&sort=date&order=desc
```

### Relic fields (Neo4j / normalized API)

Core fields used in list/detail: **`id`**, **`name`**, **`dynasty`**, **`museum`**, **`material`**, **`description`**, **`image_url`**, **`artist`**, **`date`**, **`culture`**, **`period`**, **`classification`**, **`accession_number`**, **`dimensions`**, **`credit_line`**, **`object_url`**, **`place`**. Extra properties on `:Relic` nodes are passed through and surfaced on the detail page under additional attributes when ingested.

---

## Data ingestion (`ingest_relics.py`)

Standalone script at the **repository root** loads **`backend/.env`** for Neo4j and OpenAI.

**Sources** (caps configurable in-script): Metropolitan Museum of Art, Cleveland Museum of Art (Open Access API), Victoria and Albert Museum, Art Institute of Chicago.

**Pipeline**

1. **Stage 1 — keyword gate**: keep candidates whose non-id/image fields contain any of (case-insensitive): `china`, `chinese`, `tang`, `song`, `ming`, `qing`, `han`, `zhou`, `yuan`.
2. **Stage 2 — OpenAI**: batches of **10** relics per request to **`gpt-4o-mini`**; numbered YES/NO replies; **YES** rows are written to Neo4j.
3. **Neo4j**: full run **`DETACH DELETE`** existing `:Relic` nodes, then **`MERGE`** verified rows with string properties (`props_for_neo`).

**Requirements**

```bash
pip install neo4j requests python-dotenv openai
```

**Environment** (`backend/.env`): **`NEO4J_URI`**, **`NEO4J_USER`**, **`NEO4J_PASSWORD`**, **`OPENAI_API_KEY`** (required for default full ingest).

**Commands**

```bash
# Full ingest (clears :Relic, runs AI, merges verified rows)
python ingest_relics.py

# Refresh Cleveland fields only: refetch API, MATCH-update existing cma_* nodes (no DELETE, no OpenAI, no CREATE)
python ingest_relics.py --fix-cleveland
```

---

## Credits & license

**Author:** Turgut Sofuyev  

**License:** [MIT License](LICENSE)
