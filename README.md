# CollabDocs 🚀

> A production-ready real-time collaborative document editor (mini Google Docs) built with React, Vite, TypeScript, Tailwind CSS, Tiptap, Yjs, Express, WebSocket, and PostgreSQL via Prisma.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Highlights
- **Real-time Multi-user Collaborative Editing**: Conflict-free editing powered by Yjs CRDTs with sub-50ms synchronization over WebSockets.
- **Presence & Live Cursors**: See active collaborator carets, selections, and profile avatars in real time.
- **Granular Role-based Access Control**: Owner, Editor, and Viewer permissions strictly enforced on both REST endpoints and WebSocket sync streams.
- **Autosave & Persistence**: Automatic debounced flushing to PostgreSQL and full Version History checkpoint snapshots with instant restore.
- **Modern Responsive Design**: Clean Google Docs-like interface with Dark/Light mode theme switching, toolbars, and responsive side drawers.
- **Hardened Security**: JWT access/refresh token rotation, bcrypt hashing, Helmet security headers, rate limiting, CORS protection, and Zod schema validation.
- **OpenAPI / Swagger Documentation**: Interactive API testing available at `/api/docs`.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Tiptap, Yjs (`y-websocket`, `y-protocols`)
- **Backend**: Node.js, Express, TypeScript, `ws`, Prisma ORM
- **Database**: PostgreSQL (Supabase / Docker PostgreSQL)
- **Deployment**: Backend on Render, Frontend on Vercel

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js >= 18
- Docker & Docker Compose (or local PostgreSQL)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd CollabDocs
npm install
```

### 2. Configure Environment
Copy `.env.example` in both `/server` and `/client`:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Start Database
```bash
docker compose up -d
```

### 4. Run Migrations & Start Services
```bash
# In server directory:
cd server
npx prisma migrate dev --name init

# From monorepo root:
npm run dev
```

Visit frontend at `http://localhost:5173` and backend API at `http://localhost:5000`.
API documentation is accessible at `http://localhost:5000/api/docs`.

---

## 📜 License
MIT License.
