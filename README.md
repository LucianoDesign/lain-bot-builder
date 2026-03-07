# Lain Builder

Visual chatflow builder — create conversational chatbots through a drag-and-drop canvas, with real-time execution across multiple channels (web widget, WhatsApp, API).

Inspired by [Typebot](https://typebot.io).

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Auth | Better Auth (email/password, RBAC, admin plugin) |
| ORM + DB | Prisma 7 + PostgreSQL (Supabase) |
| Visual Canvas | @xyflow/react v12 (React Flow) |
| State | Zustand v5 |
| Validation | Zod v4 |
| UI | Tailwind CSS v4 + shadcn/ui |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- PostgreSQL database (Supabase recommended)

### Setup

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL

# Push schema to database
bunx prisma db push

# Generate Prisma client
bunx prisma generate

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-here
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

---

## Project Structure

```
app/
├── (auth)/              # Login + Register pages
├── (dashboard)/         # Flow list dashboard
├── api/
│   ├── auth/[...all]/   # Better Auth handler
│   └── flows/           # CRUD API for flows
├── builder/[flowId]/    # Visual builder page
└── lib/
    ├── auth.ts          # Better Auth server config
    ├── auth-client.ts   # Better Auth client hooks
    └── permissions.ts   # RBAC (roles + access control)

lib/
├── prisma.ts            # PrismaClient singleton
├── types/index.ts       # Shared TypeScript types
└── store/
    ├── flow-store.ts    # Zustand: nodes, edges, save state
    └── ui-store.ts      # Zustand: selected node, panels

components/
├── builder/             # Canvas, Sidebar, Toolbar, NodeConfigPanel
├── dashboard/           # FlowsClient, SignOutButton
└── nodes/               # Custom React Flow nodes

hooks/
├── useFlow.ts           # Load flow from DB into store
└── useAutoSave.ts       # Debounced auto-save (1.5s)

proxy.ts                 # Route protection (Next.js 16)
prisma/schema.prisma     # DB schema
```

---

## Database Schema

### Auth Tables (managed by Better Auth)
`user`, `session`, `account`, `verification`

### App Tables

| Table | Description |
|-------|-------------|
| `flows` | Each chatbot owned by a user |
| `nodes` | Flow nodes (type + position + JSONB data) |
| `edges` | Connections between nodes |
| `variables` | Flow variables for interpolation (`{{varName}}`) |
| `chat_sessions` | End-user conversation sessions |
| `session_messages` | Message log per session |

---

## Features & Progress

### Fase 1 — Fundamentos ✅

- [x] Next.js 16 + Tailwind 4 + shadcn/ui setup
- [x] Better Auth — email/password, session cookies, RBAC
- [x] Prisma schema — auth + app models (flows, nodes, edges, variables, sessions)
- [x] Auth pages — Login / Register
- [x] Dashboard — list, create, delete flows
- [x] Builder — React Flow canvas with Start, Message, End nodes
- [x] Drag-and-drop nodes from sidebar to canvas
- [x] Click-to-configure node panel (Message node)
- [x] Persistence — save/load flow from PostgreSQL
- [x] Auto-save with 1.5s debounce

---

### Fase 2 — Builder Completo

- [ ] Nodes: Text Input, Choice Input, Condition, Set Variable
- [ ] Full node config panel per type
- [ ] Variables system (CRUD + `{{interpolation}}`)
- [ ] Connection validation (Start = output only, End = input only)
- [ ] Undo / Redo
- [ ] Copy / Paste nodes

---

### Fase 3 — Runtime + Chat Widget

- [ ] Runtime engine (executor + node handlers + resolver)
- [ ] `POST /api/execute` — stateless flow execution endpoint
- [ ] Chat widget (web preview in builder)
- [ ] Embeddable chat widget (iframe + script tag)
- [ ] Typing indicators and delays
- [ ] Publish flow (snapshot to `published_snapshot`)

---

### Fase 4 — Features Avanzados

- [ ] Webhook node — HTTP calls to external APIs
- [ ] AI Block node — LLM integration (OpenAI / Anthropic)
- [ ] Code node — sandboxed JavaScript execution
- [ ] Analytics — sessions, completions, drop-offs
- [ ] Flow templates
- [ ] Duplicate flow

---

### Fase 5 — Canales Externos

- [ ] WhatsApp via n8n / WAHA (webhook entry point)
- [ ] Channel adapters (web → WhatsApp message types)
- [ ] WhatsApp-specific nodes (lists, templates)
- [ ] Session resume by `external_id`

---

## Architecture Notes

### Security
- No Supabase RLS — auth handled entirely by Better Auth (HTTP-only session cookies)
- All queries filtered by `userId` (owner of the flow)
- Public runtime endpoints (`/api/execute`) will require API key or signature
- Integration secrets (OpenAI, webhooks) stay server-side only

### Auto-save Strategy
```
[Canvas change] → Zustand store (isDirty=true) → debounce 1.5s → PUT /api/flows/[id]
```
Sends full `{ nodes, edges }` payload — server does delete-all + recreate in a transaction.

### Draft vs Published
- Builder always edits the **draft** (nodes/edges tables)
- On **Publish**: serializes everything into `flows.published_snapshot` (JSONB)
- Runtime uses the snapshot — edits don't affect live conversations

### Runtime Engine (Fase 3)
Stateless design: session state lives in `chat_sessions.variables_state` + `current_node_id`.
Each `POST /api/execute` call loads the session, processes input, resolves the next node, and streams outputs until a node that requires user input is reached.
