# CollabDocs 🚀

> A production-grade, real-time collaborative document editor (mini Google Docs) built with React, Vite, TypeScript, Tailwind CSS, Tiptap, Yjs, Express, WebSocket, and PostgreSQL via Prisma.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-darkblue.svg)](https://www.prisma.io/)
[![Yjs](https://img.shields.io/badge/Yjs-CRDT-orange.svg)](https://yjs.dev/)

---

## 🌐 Live Deployments

- **🚀 Live Web App (Frontend)**: [https://client-omega-woad-15.vercel.app](https://client-omega-woad-15.vercel.app)
- **⚡ Production API (Backend)**: [https://collabdocs-server-h57s.onrender.com](https://collabdocs-server-h57s.onrender.com)
- **📖 API Documentation (Swagger UI)**: [https://collabdocs-server-h57s.onrender.com/api/docs](https://collabdocs-server-h57s.onrender.com/api/docs)
- **❤️ Live Health Check**: [https://collabdocs-server-h57s.onrender.com/health](https://collabdocs-server-h57s.onrender.com/health)
- **🗄️ Managed Database**: Supabase PostgreSQL

## 🌟 Key Features

- **Real-Time CRDT Multi-User Collaboration**: Sub-50ms peer synchronization powered by Yjs Conflict-Free Replicated Data Types (`y-websocket`, `y-protocols`).
- **Live Remote Cursors & Presence**: Interactive colored carets, selection highlights, and user avatar stack tracking live collaborator focus.
- **Granular Role-Based Access Control (RBAC)**:
  - **Owner**: Full administrative rights (edit, rename, delete document, manage collaborators).
  - **Editor**: Real-time collaborative editing and checkpoint snapshot creation.
  - **Viewer**: Read-only access enforced on both HTTP REST endpoints and WebSocket binary packet filters.
- **Continuous Version History & Snapshots**:
  - Name and record custom snapshot checkpoints.
  - Review historical revisions with timestamps and creator attribution.
  - One-click rollback restoring previous document states.
- **Autosave & Persistence**: Debounced synchronization to PostgreSQL storing both CRDT binary state updates and plain text snapshots for instant retrieval.
- **Rich Text ProseMirror Editor**: Comprehensive formatting toolbar including Headings (H1–H3), Lists (Bullet & Ordered), Blockquotes, Code Blocks, Inline Code, Text Alignment, Highlighting, and Undo/Redo.
- **Security & Hardening**:
  - JWT token rotation (short-lived access tokens + revocable refresh tokens).
  - Bcrypt password hashing.
  - Helmet HTTP security headers.
  - Per-IP rate limiting (`express-rate-limit`).
  - CORS origin allowlists with credential handling.
  - Zod payload validation.
- **Theme & Modern UI**: Smooth light/dark mode toggling, responsive layout, loading states, and accessible dialogs.
- **OpenAPI / Swagger Documentation**: Interactive API documentation available at `/api/docs`.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client ["Client (React + Vite + Tailwind)"]
        UI["Editor UI & Toolbar"]
        TT["Tiptap / ProseMirror"]
        YDocC["Yjs CRDT Document"]
        AwarenessC["Awareness / Presence"]
        UI --> TT
        TT <--> YDocC
        AwarenessC <--> YDocC
    end

    subgraph Transport ["Network Layer"]
        WS["WebSocket (wss://) Sync & Presence"]
        REST["REST API (https://) Auth & Management"]
    end

    subgraph Server ["Server (Node.js + Express)"]
        WSS["Yjs WebSocket Engine"]
        SecFilter["Auth & RBAC Filter (Owner/Editor/Viewer)"]
        API["Express Router & Controllers"]
        Persist["Debounced Persistence Manager"]
        Prisma["Prisma ORM Client"]
        
        WSS --> SecFilter
        SecFilter --> Persist
        API --> Prisma
        Persist --> Prisma
    end

    subgraph Database ["Database Layer"]
        PG[("PostgreSQL (Supabase / Local)")]
        Prisma --> PG
    end

    Client <-->|CRDT Packets & Awareness| WS
    Client <-->|JSON Requests & JWT| REST
    WS <--> WSS
    REST <--> API
```

---

## 📋 Environment Variables

### Server (`server/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | HTTP & WebSocket server port | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `DATABASE_URL` | PostgreSQL connection string (pooled for Supabase) | `postgresql://postgres:password@localhost:5432/collabdocs` |
| `DIRECT_URL` | PostgreSQL direct connection (for migrations) | `postgresql://postgres:password@localhost:5432/collabdocs` |
| `JWT_SECRET` | Secret key for signing short-lived access tokens | `min_32_characters_random_secret` |
| `JWT_REFRESH_SECRET` | Secret key for signing long-lived refresh tokens | `min_32_characters_random_secret` |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |

### Client (`client/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base HTTP endpoint for backend REST API | `http://localhost:5000` |
| `VITE_WS_URL` | Base WebSocket endpoint for realtime sync | `ws://localhost:5000` |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js >= 18.x
- Docker & Docker Compose **or** local PostgreSQL

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CollabDocs
```

### 2. Install Dependencies
```bash
# Install root, server, and client dependencies
npm install
```

### 3. Configure Environment
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 4. Start PostgreSQL Database
**Option A: Using Docker Compose**
```bash
docker compose up -d
```

**Option B: Using Embedded PostgreSQL (No Docker required)**
```bash
npm run db:local --workspace=server
```

### 5. Run Database Migrations
```bash
cd server
npx prisma migrate dev --name init
cd ..
```

### 6. Start Development Servers
```bash
# Start backend and frontend simultaneously
npm run dev

# Or start individually:
npm run dev:server   # Starts backend on http://localhost:5000
npm run dev:client   # Starts frontend on http://localhost:5173
```

---

## 🧪 Testing

The test suite covers authentication, input validation, document CRUD, sharing permissions, version history, and WebSocket authorization with **27 comprehensive automated tests**:

```bash
# Run backend tests
cd server
npm test
```

---

## 📖 API Documentation

Interactive Swagger OpenAPI 3.0 documentation is available at:
- **Live Swagger UI**: [https://collabdocs-server-h57s.onrender.com/api/docs](https://collabdocs-server-h57s.onrender.com/api/docs)
- **Local Swagger UI**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Production Health Check**: [https://collabdocs-server-h57s.onrender.com/health](https://collabdocs-server-h57s.onrender.com/health)

---

## 🚢 Deployment Architecture

- **Backend**: Hosted on **Render** as a Node.js Web Service with native WebSocket support.
- **Frontend**: Hosted on **Vercel** with client-side SPA routing rewrites (`vercel.json`).
- **Database**: **Supabase** Managed PostgreSQL.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
