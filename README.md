# 🌏 Overseas Relic Knowledge Platform

A full-stack web application for exploring overseas cultural relics using a **knowledge graph (Neo4j)**.

The system allows users to browse, search, filter, and explore relationships between historical artifacts in an interactive way.

---

## 🚀 Features

### 📦 Data Browsing

* Grid (card) view of relics
* Pagination (10 items per page)
* Detail panel for each relic
* Related relic recommendations

### 🔍 Data Querying

* Search by name or museum
* Filter by dynasty
* Combined filtering + pagination

### 🧠 Knowledge Graph Integration

* Neo4j-powered data source
* Dynamic fallback to JSON if Neo4j is unavailable
* Related relics based on shared attributes (dynasty / museum)

---

## 🛠 Tech Stack

### Backend

* FastAPI
* Neo4j (graph database)
* Python

### Frontend

* React (Vite)
* CSS

### Dev Tools

* Docker (for Neo4j)
* Git / GitHub

---

## ⚙️ Project Structure

```
Relic-system/
│
├── backend/
│   ├── app/
│   │   ├── core/        # database connection (Neo4j)
│   │   ├── services/    # business logic (relics)
│   │   └── main.py      # API routes
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── models/
│   └── package.json
│
└── database/
    └── graph/
        └── sample_relics.json
```

---

## ⚡ Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/relic-system.git
cd relic-system
```

---

### 2️⃣ Setup Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

---

### 3️⃣ Setup Environment Variables

Create `.env` file in `backend/`:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

---

### 4️⃣ Run Neo4j (Docker)

```bash
docker run --name neo4j-test \
-p 7474:7474 -p 7687:7687 \
-e NEO4J_AUTH=neo4j/your_password \
-d neo4j:5.11
```

Open:

```
http://localhost:7474
```

---

### 5️⃣ Run Backend

```bash
uvicorn app.main:app --reload
```

Backend runs at:

```
http://localhost:8000
```

---

### 6️⃣ Run Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

## 📡 API Endpoints

### Get relics (with pagination)

```
GET /relics?page=1&limit=10
```

### With filters

```
GET /relics?search=bronze&dynasty=Han&page=1
```

### Get related relics

```
GET /relics/{id}/related
```

---

## 🧪 Sample Cypher (Insert Data)

```cypher
CREATE (:Relic {
  id: "r001",
  name: "Ritual Bronze Ding",
  dynasty: "Western Zhou",
  museum: "British Museum",
  description: "Ancient ritual bronze vessel",
  image: ""
});
```

---

## 🔮 Future Improvements

* Advanced search (multi-field filtering)
* Knowledge graph visualization (force graph)
* User accounts & favorites
* Image support (real artifact images)
* Recommendation scoring system

---

## 👨‍💻 Author

**Turgut Sofuyev**

---

## 📄 License

MIT License
