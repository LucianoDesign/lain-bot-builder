# Fase 1 — Fundamentos (Completada)

## Resumen

Implementación completa de la Fase 1 del Chat Flow Builder. El proyecto compila sin errores y tiene todas las rutas funcionando.

---

## Lo que se hizo

### 1. Base de datos — Prisma Schema

**Modelos agregados** (además de los de auth que ya existían):

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `Flow` | `flows` | Cada chatbot/flow del usuario |
| `FlowNode` | `nodes` | Nodos del flow (tipo + posición + data JSONB) |
| `FlowEdge` | `edges` | Conexiones entre nodos |
| `Variable` | `variables` | Variables del flow (para interpolación) |
| `ChatSession` | `chat_sessions` | Sesiones de conversación de usuarios finales |
| `SessionMessage` | `session_messages` | Log de mensajes por sesión |

**Enums agregados:** `NodeType`, `VariableType`, `SessionStatus`, `MessageRole`, `ChannelType`

**Sync:** Se usó `prisma db push` en vez de `migrate dev` porque las tablas de auth existían sin historial de migrations. DB en sync con el schema.

---

### 2. Packages instalados

```
@xyflow/react@12.10.1   -- Canvas visual (React Flow v12)
zustand@5.0.11          -- Estado del builder
zod@4.3.6               -- Validación de schemas
```

**shadcn/ui components agregados:** `input`, `label`, `card`, `badge`, `dropdown-menu`, `dialog`, `skeleton`, `separator`, `avatar`, `sonner`

---

### 3. Infraestructura

- **`lib/prisma.ts`** — Singleton de PrismaClient con PrismaPg adapter (Supabase)
- **`lib/types/index.ts`** — Tipos compartidos (DbFlow, AppNode, AppEdge, helpers de conversión DB↔ReactFlow)
- **`lib/store/flow-store.ts`** — Zustand store: nodes, edges, isDirty, saveStatus, operaciones de React Flow
- **`lib/store/ui-store.ts`** — Zustand store: nodo seleccionado, panel de config abierto
- **`proxy.ts`** — Route protection (Next.js 16 usa `proxy.ts` en lugar de `middleware.ts`). Redirige `/` y `/builder/*` a `/login` si no hay sesión.

---

### 4. Auth Pages

- **`app/(auth)/layout.tsx`** — Layout centrado, fondo `zinc-950`
- **`app/(auth)/login/page.tsx`** — Formulario email + password con Better Auth client
- **`app/(auth)/register/page.tsx`** — Formulario nombre + email + password

**Nota:** Se simplificó `auth-client.ts` removiendo `adminClient` con roles (causaba imports de `node:module` en el browser). El RBAC del admin queda server-side via `auth.api`.

---

### 5. Dashboard

- **`app/(dashboard)/layout.tsx`** — Sidebar con logo, navegación, avatar del usuario y botón de sign out
- **`app/(dashboard)/page.tsx`** — Server component que carga los flows del usuario
- **`components/dashboard/FlowsClient.tsx`** — Grid de cards con: crear flow (dialog), editar, eliminar (dropdown)
- **`components/dashboard/SignOutButton.tsx`** — Botón client-side de logout

---

### 6. API Routes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/flows` | Listar flows del usuario autenticado |
| `POST` | `/api/flows` | Crear nuevo flow |
| `GET` | `/api/flows/[flowId]` | Obtener flow con nodes, edges, variables |
| `PUT` | `/api/flows/[flowId]` | Actualizar flow (nombre/desc + upsert nodes/edges) |
| `DELETE` | `/api/flows/[flowId]` | Eliminar flow |

Todas las rutas validan sesión con `auth.api.getSession()` y filtran por `userId`.

La estrategia de guardado: **delete-all + recreate** en una transacción Prisma (simple y confiable para MVP).

---

### 7. Builder Visual

**Nodos custom:**
- `StartNode` — Verde, solo handle de salida (bottom)
- `MessageNode` — Azul, handles entrada (top) + salida (bottom), preview del texto
- `EndNode` — Rojo, solo handle de entrada (top)

**Componentes del builder:**
- `Canvas.tsx` — ReactFlow con drag-and-drop desde sidebar, Background dots, Controls, MiniMap
- `Sidebar.tsx` — Panel izquierdo con los tipos de nodos arrastrables
- `Toolbar.tsx` — Barra superior con nombre del flow y estado de guardado
- `NodeConfigPanel.tsx` — Panel derecho, configura el nodo seleccionado (Fase 1: solo Message)
- `BuilderClient.tsx` — Wrapper que une todo + inicializa hooks

**Hooks:**
- `hooks/useFlow.ts` — Carga nodes/edges de DB al Zustand store al montar
- `hooks/useAutoSave.ts` — Auto-save con debounce de 1500ms. Llama `PUT /api/flows/[id]` con nodes+edges completos

**Página:**
- `app/builder/[flowId]/page.tsx` — Server component que verifica auth, carga el flow de DB y pasa a `BuilderClient`

---

### 8. Fixes varios

- `.env` corrección: `BETTER_AUTH_URL=http://localhost:3000` (línea 1 tenía `BETTER_AUTH_SECRET` mal asignado)
- `app/lib/permissions.ts` actualizado: recurso `flows` en lugar de `posts`
- `app/layout.tsx` actualizado: metadata correcta + Toaster (sonner)
- `app/page.tsx` eliminado (era boilerplate de Next.js, el dashboard lo reemplaza via route group)

---

## Estructura creada

```
app/
├── (auth)/
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   └── page.tsx
├── api/
│   └── flows/
│       ├── route.ts
│       └── [flowId]/route.ts
├── builder/
│   └── [flowId]/page.tsx
├── lib/
│   ├── auth.ts         (existente, sin cambios)
│   ├── auth-client.ts  (simplificado)
│   └── permissions.ts  (actualizado: flows en vez de posts)
└── layout.tsx          (actualizado)

lib/
├── prisma.ts
├── types/index.ts
└── store/
    ├── flow-store.ts
    └── ui-store.ts

components/
├── builder/
│   ├── BuilderClient.tsx
│   ├── Canvas.tsx
│   ├── NodeConfigPanel.tsx
│   ├── Sidebar.tsx
│   └── Toolbar.tsx
├── dashboard/
│   ├── FlowsClient.tsx
│   └── SignOutButton.tsx
└── nodes/
    ├── StartNode.tsx
    ├── MessageNode.tsx
    └── EndNode.tsx

hooks/
├── useFlow.ts
└── useAutoSave.ts

proxy.ts    (route protection, Next.js 16)
```

---

## Estado del Build

```
Route (app)
├ ƒ /                      Dashboard (server-rendered)
├ ƒ /api/auth/[...all]     Better Auth handler
├ ƒ /api/flows             GET + POST
├ ƒ /api/flows/[flowId]    GET + PUT + DELETE
├ ƒ /builder/[flowId]      Builder visual
├ ○ /login                 Login page (static)
└ ○ /register              Register page (static)

ƒ Proxy (Middleware)        Route protection
```

✅ Build exitoso. 0 errores de TypeScript.

---

## Notas para Fase 2

- El builder solo tiene nodos MVP visualmente (Start, Message, End). Los tipos `text_input`, `choice_input`, `condition`, `set_variable` usan `MessageNode` como placeholder.
- `NodeConfigPanel` solo configura el nodo `Message`. Fase 2 agrega configuración completa por tipo.
- Variables panel está en el store (UI store tiene `isVariablesPanelOpen`) pero la UI se implementa en Fase 2.
- Undo/Redo pendiente para Fase 2.
- El middleware/proxy usa solo el cookie de sesión para decidir (fast). La validación real de sesión ocurre en cada server component y API route via `auth.api.getSession()`.
