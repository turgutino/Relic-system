# Overseas Relic Knowledge Platform

Web platform for exploring overseas cultural relics. **Phase 1** ships as a FastAPI + React app backed by **Neo4j**, with **JSON sample data** when the graph is unavailable.

The longer-term vision is richer browsing, querying, visualization, and user services—as in major museum catalogs—built on structured knowledge-graph data.

---

## Project overview

The project aims to make overseas relic metadata easy to browse, filter, and connect (e.g., related artifacts by dynasty or museum).

---

## Implemented today (Phase 1)

### Catalog

- Card grid **and list** layouts; toggle persisted in the URL (`view=list` or default cards).
- **Pagination** (`page`, `limit` on the API and in the UI query string).
- **Search** (name / museum) and **dynasty filter**, combined with pagination.
- **Sort** by name, dynasty, or period (period maps to dynasty in the backend), ascending or descending — `sort` and `order` in the URL and API.

### Detail

- Relic detail page; **Back** restores catalog state (search, filters, view mode, sort, page).

### Related relics

- **`GET /relics/{id}/related`**: Neo4j when connected; otherwise a deterministic **JSON fallback** (shared dynasty/museum heuristic, capped).

### Ops

- **`GET /health`** for basic liveness checks.

Shareable URLs, e.g. `/?search=bronze&dynasty=Han&page=2&view=list&sort=name&order=asc`.

No screenshots are committed; run `npm run start` locally if you want captures for docs.

---

## Tech stack

| Layer     | Stack |
|-----------|-------|
| Backend   | FastAPI, Neo4j, `python-dotenv` |
| Frontend  | React 18, React Router 6, Vite |
| Data      | `database/graph/sample_relics.json` |

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
│       ├── components/   # Cards, list rows, facets, etc.
│       ├── pages/        # Catalog, detail
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

Leave `NEO4J_URI` empty or omit it to use **JSON fallback only** (as in automated tests).

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

Interactive docs: http://127.0.0.1:8000/docs

### 5. Frontend

```bash
cd ../frontend
npm install
npm run start
```

Dev server: **http://localhost:3000**, with `/relics` and `/health` proxied to **http://127.0.0.1:8000** (`frontend/vite.config.js`).

---

## API (Phase 1)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | `{"status": "ok"}` |
| GET | `/relics` | `page`, `limit`, `search`, `dynasty`, `sort` (`name`, `dynasty`, `period`), `order` (`asc`, `desc`) |
| GET | `/relics/{id}` | Single relic |
| GET | `/relics/{id}/related` | Related list (Neo4j or JSON heuristic) |

Example:

```
GET /relics?page=1&limit=10&dynasty=Han&sort=name&order=asc
```

---

## Tests (backend)

From `backend/` with the venv active:

```bash
python -m pytest
```

By default tests use JSON fallback (`NEO4J_URI` unset in test config) unless you add a Neo4j-backed job.

---

## Team

Collaborative development; feature branches and merges through Pull Requests, with review before merging to `main`.

---

## Development workflow

- **`main`** — stable integration branch
- **`feature/*`** — topic work
- **Pull Requests** — required merges
- **Code review** — before merge into `main`

---

## Vision & roadmap (beyond Phase 1)

Not implemented in the current milestone; possible directions include:

- Advanced search (multi-field), NLP or structured KG queries
- Interactive knowledge-graph visualization (e.g., force-directed layout), timelines, maps
- User accounts, profiles, favorites, history, recommendations
- Relic comparison, richer media (high-res / zoom), export (CSV / JSON), dashboards / statistics

Additional ideas over time:

- Stronger recommendation and scoring  
- AI-assisted discovery, image similarity  
- Multi-language UI  
- Mobile client  

See issues or project board for what is actively planned.

---

## Author

**Phase 1 fully implemented by Turgut Sofuyev**

---

## License

MIT License
