# Overseas Relic Knowledge Service Subsystem
## Project Management Plan

**Project Name:** Relic System – Overseas Chinese Cultural Relics Knowledge Service Platform  
**Version:** 1.1  
**Date:** April 27, 2026  
**Project Manager:** Riad  

### 1. Project Overview
This project develops a modern web application that provides browsing, querying, visualization, and personalized services based on the **Knowledge Graph** of overseas Chinese cultural relics.

The system offers:
- Multi-dimensional data browsing and relic comparison
- Advanced search and knowledge graph queries
- Interactive visualizations (force-directed graph, timeline, geographic map, statistical dashboard)
- User account management with optional features (favorites, history, comments, personalized recommendations)

**Reference UI:** Cleveland Museum of Art and British Museum websites.

**GitHub Repository:** https://github.com/turgutino/Relic-system  
**Project Board (Trello):** https://trello.com/b/fkHtM60I/se-website

### 2. Finalized Team Structure

**Project Manager**  
- Riad (overall coordination, planning, progress tracking, stakeholder communication)

**Main Developer / Technical Lead**  
- Turgut (responsible for overall technical direction, architecture decisions, code quality, and leading the backend team)

**Backend Team**  
- Turgut (Main Developer & Backend Lead)  
- Murad  
- Iulian  

**Frontend Team**  
- Fidan  
- Max  
- Shafa  

**Total Team Size:** 7 members

### 3. Roles and Responsibilities

| Role                          | Name              | Responsibilities |
|-------------------------------|-------------------|------------------|
| **Project Manager**           | Riad             | Define roadmap, manage Trello board, facilitate meetings, track progress, resolve blockers, ensure quality and timeline |
| **Main Developer / Technical Lead** | Turgut       | Lead technical architecture, make key technology decisions, review code, ensure backend quality, guide backend team, coordinate with frontend team |
| **Backend Developers**        | Murad, Iulian    | Implement APIs, database integration, search & querying logic, user management, visualization support |
| **Frontend Developers**       | Fidan, Max, Shafa| UI/UX implementation, responsive design, visualizations, integration with backend APIs |

All team members are expected to:
- Follow Git workflow (feature branches → Pull Requests → Code Review by Turgut or Riad)
- Update Trello board daily
- Participate in weekly progress meetings

### 4. Technical Roadmap (High-Level Phases)

**Phase 0: Project Setup (Current – 1 week)**
- Finalize team roles and responsibilities (Done)
- Create and organize GitHub repository + Trello board (In progress)
- Finalize technology stack and database decisions (led by Turgut)
- Establish coding standards, branch strategy, and CI/CD basics

**Phase 1: Foundation & Backend Core (Weeks 2–5)**
- Database setup: Neo4j (Knowledge Graph) + PostgreSQL (users/favorites) — led by Turgut
- Backend project structure and API skeleton
- Core relic browsing (list, card, filtering, sorting, detail page)
- Simple and advanced search
- Basic user authentication & authorization

**Phase 2: Advanced Features & Visualization Support (Weeks 6–9)**
- Knowledge graph queries and subgraph export
- Related recommendations and relic comparison
- Data export (CSV/JSON)
- Backend support for visualizations (timeline aggregates, geo data, stats)
- Favorites, browsing history, and basic personalization

**Phase 3: Frontend Implementation & Integration (Weeks 8–12, overlapping with Phase 2)**
- React/Vue-based UI with reference to world-class museum designs
- List/Card views, detail pages, comparison tool
- Interactive visualizations (force-directed graph, timeline, world map, dashboards)
- Responsive design and image zoom/full-screen

**Phase 4: Polish, Testing & Deployment (Weeks 13–15)**
- Comments, likes, advanced recommendations (optional)
- Performance optimization and caching
- Comprehensive testing (unit, integration, E2E)
- Documentation and deployment (Docker recommended)
- Final review and demo preparation

**Phase 5: Future Enhancements (Post-MVP)**
- AI-powered natural language queries
- Visual similarity search
- Multi-language support
- Mobile responsiveness improvements

### 5. Technology Stack (To Be Confirmed in Week 1)
**Led by Turgut (Main Developer)**

- **Backend:** FastAPI (Python) or Node.js/Express (to be decided)
- **Knowledge Graph:** Neo4j (primary recommendation)
- **User Data:** PostgreSQL
- **Frontend:** React (recommended) or Vue.js
- **Visualization:** D3.js, ECharts, Leaflet (for maps)
- **Other:** Redis (caching), Docker, JWT authentication

### 6. Project Management Tools & Processes

- **Task Management:** Trello Board[](https://trello.com/b/fkHtM60I/se-website) – All tasks must be tracked here.
- **Code Repository:** GitHub[](https://github.com/turgutino/Relic-system)
  - Main branch: stable code
  - Develop/feature branches for new work
  - Pull Requests required with code review (Turgut as primary reviewer)
- **Communication:** Recommend creating a group chat (WeChat / Telegram / Discord)
- **Meetings:** Weekly sync meetings (progress, blockers, next sprint)
- **Documentation:** All major decisions and API specs will be maintained in GitHub (Turgut to lead technical documentation)

### 7. Deliverables & Milestones

- **Week 1:** Project plan published, tech stack finalized (led by Turgut), repository organized
- **Week 5:** Working backend APIs for relic browsing and search
- **Week 9:** Visualization data endpoints ready + basic frontend integration
- **Week 12:** Feature-complete MVP
- **Week 15:** Deployed, documented, and tested system

### 8. Risks & Mitigation

- Unclear Knowledge Graph schema → Early exploration session led by Turgut
- Technology decision delay → Turgut to propose options and finalize in Week 1
- Team member availability → Clear task assignment with buffer time
- Scope creep → Strict MVP definition with optional features marked

---

**Approved by:** Riad (Project Manager)  
**Date:** April 27, 2026

---

### How to add this to your repository:

1. Go to your GitHub repo: https://github.com/turgutino/Relic-system
2. Click **"Add file"** → **"Create new file"**
3. Name the file: `PROJECT_MANAGEMENT_PLAN.md`
4. Paste all the content above
5. Scroll down and click **"Commit new file"** (or "Commit changes")

After committing, the document will be nicely formatted and viewable at:  
**https://github.com/turgutino/Relic-system/blob/main/PROJECT_MANAGEMENT_PLAN.md**

Would you like me to also create a clean `README.md` file that links to this plan? Just say yes and I'll provide it.