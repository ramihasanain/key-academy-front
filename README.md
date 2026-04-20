# Key Academy Platform 🎓

> An Enterprise-Grade E-Learning Platform built for high concurrency, real-time interactivity, and bank-level security.

![Architecture Platform Overview](https://img.shields.io/badge/Architecture-Monorepo-blue)
![Frontend](https://img.shields.io/badge/Frontend-React.js_%20Vite-61DAFB?logo=react)
![Backend](https://img.shields.io/badge/Backend-Django_&_Channels-092E20?logo=django)
![Database](https://img.shields.io/badge/Database-PostgreSQL_%20PgBouncer-336791?logo=postgresql)
![Cache](https://img.shields.io/badge/Cache-Redis_WS_%20Caching-DC382D?logo=redis)

---

## 🏗️ Architecture Overview

The repository is structured as a **Monorepo** containing both the Frontend and Backend to streamline deployments.

### 🌐 Frontend (`/src`)
A modern Single Page Application (SPA) utilizing Vite for lightning-fast HMR and optimized builds.
- **`assets/`**: Static assets, brand files, and offline media.
- **`components/`**: Reusable isolated UI widgets (e.g., `SecurePDFViewer.jsx`, `LiveChat.jsx`).
- **`pages/`**: Main application routes corresponding directly to React Router.
- **`hooks/` & `contexts/`**: Global state management and reusable logic.

### ⚙️ Backend (`/backend/apps`)
Built using Django standard application isolation patterns.
- **`accounts/`**: Custom User models, JWT Authentication, and profile state.
- **`courses/`**: Educational Core (Courses, Modules, Lessons, Progress tracking).
- **`enrollments/`**: Invoicing, Subscriptions, and Student Progress gating.
- **`interactions/`**: High-concurrency WebSockets (RedisChannelLayer), Live Chat routing, and Security Mute validations.

---

## 🚀 Environment Setup (Local Development)

### 1. Backend Initialization (Python 3.10+)
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
```
*Create a `.env` file inside `/backend` following `.env.example`.*
```bash
python manage.py migrate
python manage.py runserver  # Defaults to :8000
```

### 2. Frontend Initialization (Node.js 18+)
Open a **new terminal tab** at the project root:
```bash
npm install
npm run dev
```

---

## ⚡ Performance Optimization & Scale

The platform relies on several aggressive optimizations tailored for DigitalOcean App Platform scale:

1. **Lazy Loading:** Massive libraries (like `react-pdf`) are split out of the core chunk using `React.lazy()` to guarantee instant primary paints.
2. **WebSockets Pub/Sub:** All real-time streams are offloaded from Python Memory to Redis, drastically mitigating memory-leak potentials during rapid concurrency.
3. **Connection Pooling (PgBouncer):** `conn_max_age` is forced to `0`. We dynamically intercept DO's strict `25060` port and forcibly route the pool exclusively to `25061`.
4. **B-Tree DB Indexes:** Critical filtering boolean fields (`is_completed`, `is_active`) use explicit indices avoiding O(n) Database Sequential Scans.
5. **Caching:** Highly-accessed endpoints utilize purely Native Django `RedisCache`, preventing millions of repetitive Postgres hits.

> **Note on DigitalOcean Deployments:** If DO fails the deployment health checks, ensure `Connection Pool` is actively generated within DO Database UI. The `settings.py` rewiring will handle the rest.

---

## 🔐 Security Protocols
- **Anti-Scraping:** Built-in PDF/Video disablers, Right-click prevention contexts, and dynamically floating JWT-bound watermarks over documents.
- **Authoritative Sockets:** Bans, mutes, and constraints are cross-verified deeply at the WebSocket layer upon `receive()`, preventing bypassed payloads from restricted actors.

---
*Created and Architected for Scale by Key Academy Engineering.*
