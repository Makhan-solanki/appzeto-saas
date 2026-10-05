# Appzeto SaaS - Multi-Tenant Project Management & Real-Time Collaboration System

An enterprise-grade, high-performance multi-tenant project management SaaS with strict server-side RBAC, real-time Kanban synchronization via WebSockets, atomic audit logging, JWT & Bcrypt authentication, and compound indexed filtering engineered for 100,000+ tasks.

---

## 🏗 Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │        React 18 + Vite Frontend        │
                      │  - Kanban DnD (Optimistic UI)          │
                      │  - Real-Time WebSocket Event Listeners │
                      │  - Modern Sidebar & Sprint Velocity    │
                      │  - Interactive RBAC Role Sandbox       │
                      │  - Debounced Multi-Param Search        │
                      │  - JWT & Bcrypt Auth Modal             │
                      └──────────────────┬─────────────────────┘
                                         │ HTTP REST & Socket.IO
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Node.js + Express API         │
                      │  - Socket.IO Rooms (project & user)    │
                      │  - Reusable Server-Side RBAC Guard     │
                      │  - Atomic Transactions & Audit Engine  │
                      │  - JWT Verification & Auth Router      │
                      └──────────────────┬─────────────────────┘
                                         │ Prisma ORM (v5.22.0)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │      Neon PostgreSQL Cloud Database    │
                      │  - Native Enums (Role, Status, Priority)│
                      │  - Compound Multi-Tenant B-Tree Indexes│
                      └────────────────────────────────────────┘
```

---

## 🔑 Demo Personas & Credentials

The database is pre-seeded with 4 test personas covering every role in the specification.

| Role | Name | Email | Password | Allowed Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **OWNER** | Alex Rivera | `alex.owner@techcorp.io` | `password123` | Full organization access, delete any task, manage projects, audit logs. |
| **ADMIN** | Sarah Chen | `sarah.admin@techcorp.io` | `password123` | Manage projects & members, delete any task, view audit logs. |
| **MEMBER** | Marcus Bell | `marcus.member@techcorp.io` | `password123` | Create tasks, edit **assigned** tasks, add comments & `@mentions`. |
| **VIEWER** | Linda Ross | `linda.viewer@techcorp.io` | `password123` | **Read-only**. Dragging/updating tasks immediately returns `403 Forbidden`. |

---

## 🚀 How to Run the Application

You can run both servers concurrently or run backend and frontend in separate terminals.

### Prerequisites
- Node.js (v18+)
- npm

---

### Option 1: Run Both Concurrently (Recommended)

In your terminal:

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Push database schema to Neon PostgreSQL
npx prisma db push

# 3. Seed initial multi-tenant data, tasks, and bcrypt accounts
npx tsx server/src/prisma/seed.ts

# 4. Start both Server (Port 5000) and Client (Port 3000) concurrently
npm run dev
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API & WebSockets:** [http://localhost:5000](http://localhost:5000)

---

### Option 2: Run in Separate Terminals

#### Terminal 1 — Backend API & WebSockets:
```bash
npm run dev:server
```
*Starts Express + Socket.IO server on `http://localhost:5000` with hot reloading via `tsx`.*

#### Terminal 2 — React Vite Frontend:
```bash
npm run dev:client
```
*Starts Vite development server on `http://localhost:3000` with WebSocket and API proxies.*

---

### Additional Helpful Commands

```bash
# Open interactive Prisma Database Studio in browser
npx prisma studio

# Re-seed fresh demo data at any time
npx tsx server/src/prisma/seed.ts

# Build production bundle
npm run build
```

---

## 🔐 1. Server-Side RBAC Architecture & Tenant Isolation

Authorization is strictly enforced on the server (`server/src/middleware/rbac.ts`). The application defines a 4-tier hierarchy:

$$\text{VIEWER (10)} < \text{MEMBER (20)} < \text{ADMIN (30)} < \text{OWNER (40)}$$

### Granular Matrix:
* **`VIEWER`**: Read-only access to projects, tasks, and comments. Any write attempt (`POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`) immediately returns `403 Forbidden`.
* **`MEMBER`**: Can create tasks, edit tasks **assigned to them or created by them**, and post comments. Attempts to delete tasks or edit unassigned tasks are rejected with `403 Forbidden`.
* **`ADMIN`**: Can manage projects, invite/remove members, update any task, and delete tasks.
* **`OWNER`**: Full organization access, including ownership administration.

> **Tenant Boundary Validation:**
> In addition to role rank, the middleware resolves the entity’s parent organization (`task.organizationId === currentOrgId`) preventing cross-tenant access.

---

## ⚡ 2. Database Indexing Strategy (100,000 Task Dataset)

To guarantee sub-15ms query execution on tables exceeding 100,000 tasks, 10,000 users, and 1,000 organizations, Prisma models include composite B-Tree indexes:

```prisma
model Task {
  // ... fields ...

  // 1. Compound index for Kanban & Board filtering by status and priority
  @@index([projectId, status, priority])

  // 2. Multi-tenant temporal ordering for audit and dashboard activity
  @@index([organizationId, createdAt])

  // 3. High-frequency user assignee workload queries
  @@index([assigneeId, status])

  // 4. Deadline / SLA alerting queries
  @@index([projectId, dueDate])

  // 5. Global status-priority aggregation
  @@index([status, priority])
}

model AuditLog {
  // Multi-tenant audit trail temporal scans
  @@index([organizationId, timestamp])
  @@index([entity, entityId])
}
```

### Why these indexes?
1. **`[projectId, status, priority]`**: Queries filtering tasks within a project by column status and ordering by priority run on an Index-Only or Index-Filtered scan without loading the entire project task tree.
2. **`[assigneeId, status]`**: Immediately returns active or pending work items for any user without scanning tasks belonging to other users.
3. **`[projectId, dueDate]`**: Optimizes deadline approaching cron jobs and date range queries (`?dueDateBefore=...`).
4. **Elimination of N+1 Queries**: Relations (`assignee`, `creator`, `_count.comments`) are fetched using Prisma's eager-loaded selective projections (`select: { id: true, name: true }`).

---

## 🔄 3. Real-Time WebSocket Synchronization (Socket.IO)

* **Project Rooms (`project:${projectId}`)**:
  - Broadcasts `task:created`, `task:updated`, and `task:deleted` events.
  - When User A drags a task from **TODO** to **IN_PROGRESS**, the server updates the database and emits `task:updated` to the room. Connected clients update their local Kanban state instantaneously without page reload.
* **User Notification Rooms (`user:${userId}`)**:
  - Private streams for:
    - Task assignments
    - `@mentions` in comments (e.g. `@Alex`)
    - Task status changes
    - Organization additions

---

## 📝 4. Atomic Audit Logging

All sensitive entity modifications use Prisma atomic transactions (`prisma.$transaction`):
- When a task status is changed via `PUT /api/tasks/:id`, the old status and new status are captured into the `AuditLog` table within the same transaction.
- If the audit log insert fails, the task update is rolled back automatically.

---

## 🔒 5. Authentication & Account Security (JWT + Bcrypt)

- `POST /api/auth/register`: Salts and hashes passwords with `bcryptjs.hash(password, 10)`, creates user, organization, default project, sets role to `OWNER`, and returns signed JWT.
- `POST /api/auth/login`: Authenticates credentials with `bcryptjs.compare`, returns signed JWT with 7-day expiration.
- `GET /api/auth/me`: Verifies `Bearer <token>` header and returns user profile with memberships.
- `POST /api/auth/forgot-password`: Generates secure crypto reset token valid for 1 hour.
- `POST /api/auth/reset-password`: Validates token and resets password with bcrypt hash.

---

## 📡 6. Complete API Reference

| Endpoint | Method | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Register new user + workspace |
| `/api/auth/login` | `POST` | Public | Authenticate and obtain JWT |
| `/api/auth/forgot-password` | `POST` | Public | Generate password reset token |
| `/api/auth/reset-password` | `POST` | Public | Reset password using token |
| `/api/organizations` | `POST` | Authenticated | Create a new organization |
| `/api/organizations` | `GET` | Authenticated | List organizations for current user |
| `/api/organizations/:id/members` | `POST` | `ADMIN` / `OWNER` | Add member to organization |
| `/api/organizations/:id/members/:userId` | `DELETE` | `ADMIN` / `OWNER` | Remove member from organization |
| `/api/projects` | `POST` | `ADMIN` / `OWNER` | Create a new project |
| `/api/projects/:id` | `GET` | Org Member | Fetch project details |
| `/api/tasks` | `POST` | $\ge$ `MEMBER` | Create task |
| `/api/tasks` | `GET` | Org Member | Advanced search & indexed filters |
| `/api/tasks/:id` | `GET` | Org Member | Get task with comments & history |
| `/api/tasks/:id` | `PUT` | $\ge$ `MEMBER`* | Update task / move Kanban status |
| `/api/tasks/:id` | `DELETE` | `ADMIN` / `OWNER` | Delete task |
| `/api/tasks/:id/comments` | `POST` | $\ge$ `MEMBER` | Post comment + trigger `@mention` notifications |
| `/api/audit-logs` | `GET` | `ADMIN` / `OWNER` | Searchable & filterable audit trail |
| `/api/notifications` | `GET` | Authenticated | Fetch user notifications |

*\*`MEMBER` can edit assigned tasks or tasks they created. `ADMIN` and `OWNER` can edit any task.*

---

## ☁️ 7. Vercel Deployment Instructions

### Frontend on Vercel:
1. Connect this repository to **Vercel**.
2. **Framework Preset:** Vite
3. **Build Command:** `npm run build:client`
4. **Output Directory:** `dist`
5. **Environment Variable:** `VITE_API_URL=https://your-backend-service.railway.app`

### Backend on Railway / Render:
1. Connect repository to Railway or Render.
2. **Start Command:** `npm run dev:server` or `node dist-server/index.js`
3. Set Environment Variables:
   - `DATABASE_URL` (Your Neon connection string)
   - `DIRECT_URL` (Your Neon direct migration string)
   - `JWT_SECRET`
   - `PORT=5000`
