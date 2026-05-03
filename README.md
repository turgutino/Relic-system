# Overseas Relic Knowledge Service

Full-stack app for browsing overseas cultural relics backed by **Neo4j** with a **JSON sample fallback** when the graph is unavailable.

---

## Features (Phase 1)

### Catalog

- **Card grid** and **list** row layout (toggle persisted in the URL as `view=list` or default cards).
- **Pagination** (`page`, `limit` on the API; UI uses the same query string).
- **Search** (name / museum) and **dynasty filter**, combinable with pagination.
- **Sort** by name, dynasty, or period (mapped to dynasty in the backend), ascending or descending — `sort` and `order` in the URL and API.

### Detail

- Relic detail page with navigation back to the catalog **preserving** search, filters, view mode, sort, and page.

### Related relics

- **GET `/relics/{id}/related`**: Neo4j relationship query when connected; otherwise a deterministic JSON fallback (same dynasty and/or museum, capped).

### Ops

- **GET `/health`** for liveness checks.

URLs are shareable: e.g. `/?search=bronze&dynasty=Han&page=2&view=list&sort=name&order=asc`.

>No screenshots ship in-repo; use `npm run start` locally and grab UI captures if needed for docs.

---

## Tech stack

| Layer    | Stack                          |
|---------|---------------------------------|
| Backend | FastAPI, Neo4j, `python-dotenv`|
| Frontend| React 18, React Router 6, Vite |
| Data    | `database/graph/sample_relics.json` |

---

## Project structure

```
Relic-system/
├── backend/
│   ├── app/
│   │   ├── core/        # Neo4j driver / connection helpers
│   │   ├── services/    # Relic queries (Neo + JSON fallback)
│   │   └── main.py      # FastAPI routes
│   ├── tests/           # pytest + httpx API tests (JSON fallback)
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/  # Cards, list rows, facets, etc.
│       ├── pages/       # Catalog, detail
│       └── models/
└── database/graph/
    └── sample_relics.json
```

---

## Getting started

### 1. Clone

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

Create `backend/.env` (loaded via `python-dotenv`):

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

Leave `NEO4J_URI` empty or omit it to exercise **JSON fallback only** (used in tests).

### 3. Neo4j (optional)

```bash
docker run --name neo4j-relics -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password -d neo4j:5.11
```

Browser UI: http://localhost:7474

### 4. Run API

From `backend/`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open http://127.0.0.1:8000/docs for interactive docs.

### 5. Frontend

```bash
cd ../frontend
npm install
npm run start
```

Dev server is configured on **http://localhost:3000** with `/relics` and `/health` proxied to `http://127.0.0.1:8000` (`frontend/vite.config.js`).

---

## API (Phase 1)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | `{ "status": "ok" }` (or similar) |
| GET | `/relics` | `page`, `limit`, `search`, `dynasty`, `sort` (`name` \| `dynasty` \| `period`), `order` (`asc` \| `desc`) |
| GET | `/relics/{id}` | Single relic |
| GET | `/relics/{id}/related` | Related list (Neo4j or JSON heuristic) |

Example:

```
GET /relics?page=1&limit=10&dynasty=Han&sort=name&order=asc
```

---

## Tests (backend)

From `backend/` with venv activated:

```bash
python -m pytest
```

Tests assume JSON fallback (`NEO4J_URI` unset in `tests/conftest.py` / fixtures) unless you extend them for a live Neo4j instance.

---

## Future (not Phase 1)

Advanced search, knowledge-graph visualization, accounts, relic comparison, and image zoom are out of scope for the current milestone.

---

## Author

**Turgut Sofuyev**

---

## License

MIT License
