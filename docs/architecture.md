# CollabDocs Architecture Overview

## System Architecture

CollabDocs is an enterprise-grade real-time collaborative document platform inspired by Google Docs, built on Conflict-free Replicated Data Types (CRDTs).

```
+-------------------------------------------------------------+
|                      Client (React + Vite)                  |
|  +---------------------+  +-------------------------------+  |
|  |     Tiptap Editor   |  |     Yjs CRDT Document         |  |
|  +----------+----------+  +---------------+---------------+  |
|             |                             |                  |
|             +--------------+--------------+                  |
|                            |                                 |
|               y-websocket Provider & Awareness               |
+----------------------------+--------------------------------+
                             |
                   WebSocket (wss://) & REST (https://)
                             |
+----------------------------v--------------------------------+
|                     Server (Node.js + Express)              |
|  +--------------------+  +--------------------------------+  |
|  |   REST API Layer   |  |   Yjs WebSocket Server         |  |
|  |  (Auth, Documents, |  |  (Awareness, Cursors,          |  |
|  |   Shares, Versions)|  |   Sync Protocol, CRDT Sync)    |  |
|  +---------+----------+  +----------------+---------------+  |
|            |                              |                  |
|            |     Security & Auth Filter   |                  |
|            |     (JWT Verify + Role Check)|                  |
|            |                              |                  |
|            +--------------+---------------+                  |
|                           |                                  |
|                 Prisma ORM Client                            |
+---------------------------+---------------------------------+
                            |
                     TCP Connection
                            |
+---------------------------v---------------------------------+
|              PostgreSQL Database (Supabase / Local)         |
|  +-----------+  +---------------+  +---------------------+  |
|  |   Users   |  |   Documents   |  | DocumentPermissions|  |
|  +-----------+  +---------------+  +---------------------+  |
|  | DocumentVersions             |  | RefreshTokens       |  |
|  +------------------------------+  +---------------------+  |
+-------------------------------------------------------------+
```

## Core Components
1. **Frontend**:
   - **Tiptap**: Headless rich text editor built on ProseMirror.
   - **Yjs**: High-performance CRDT framework enabling conflict-free peer synchronization.
   - **Collaboration Extensions**: `@tiptap/extension-collaboration` binds Yjs XML fragment to ProseMirror document model; `@tiptap/extension-collaboration-cursor` manages remote cursors, selections, and presence avatars.
   - **Tailwind CSS**: Modern utility styling supporting high-contrast Dark & Light mode.

2. **Backend**:
   - **Express REST API**: Handles JWT authentication (access & refresh tokens with bcrypt), document CRUD, sharing permission management, and version history snapshots.
   - **WebSocket Sync Server**: Integrates with the HTTP server, authenticating clients via JWT and checking document access roles before establishing session. Viewers are restricted from dispatching CRDT update operations.
   - **Document Persistence Manager**: Buffers and debounces CRDT binary document updates to the PostgreSQL database with fallback text snapshot generation for fast search and preview.
   - **Security**: Helmet HTTP headers, CORS origin allowlists, per-IP rate limiting, and Zod input validation schemas.

3. **Database**:
   - PostgreSQL accessed via Prisma Client with declarative migrations.
   - Data models for Users, Documents, Permissions (Owner, Editor, Viewer), Document Versions, and Revocable Refresh Tokens.
