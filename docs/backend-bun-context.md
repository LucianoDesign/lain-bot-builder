# Contexto: Front (Lain Builder) + Backend con Bun

Este documento describe el **frontend existente** (Lain Builder) y todo lo que necesitás para armar el **proyecto backend aparte** con **Bun**: API de ejecución de flows, stateless, escalable y con múltiples sesiones en simultáneo.

---

## 1. Contexto del frontend (Lain Builder)

### 1.1 Qué es

- **Lain Builder**: builder visual de chatflows (estilo Typebot). Los usuarios crean chatbots en un canvas drag-and-drop (React Flow), guardan flows en la DB y luego los publican. La **ejecución** de esos flows (conversaciones con usuarios finales) no vive en el front: se delega a una **API externa** que vas a construir con Bun.

### 1.2 Stack del front

| Capa        | Tecnología                    |
|------------|--------------------------------|
| Framework  | Next.js 16 (App Router)        |
| Auth       | Better Auth (email/password)    |
| ORM + DB   | Prisma 7 + PostgreSQL         |
| Canvas     | @xyflow/react v12 (React Flow) |
| Estado     | Zustand                        |
| Validación | Zod                            |
| UI         | Tailwind CSS v4 + shadcn/ui    |

- Repo: `lain-bot-builder`. Comandos: `bun install`, `bunx prisma db push`, `bunx prisma generate`, `bun dev` → http://localhost:3000.

### 1.3 Qué hace el front (y qué no)

- **Sí hace**: login/register, dashboard de flows, builder (canvas + nodos + edges + variables), guardado de flow (draft), **publicar** flow (snapshot en `flows.published_snapshot`). Las APIs del front son solo para auth y CRUD de flows (el builder llama a `GET/PUT /api/flows/[flowId]`).
- **No hace**: ejecutar conversaciones. El widget/chat y los canales externos (web, WhatsApp, etc.) llamarán a **tu API con Bun**, no al Next.js.

### 1.4 Cómo se guarda un flow

- **Draft**: el builder escribe en las tablas `flows`, `nodes`, `edges`, `variables`. Cada nodo tiene `type`, `positionX`, `positionY`, `data` (JSONB con lo específico del nodo). Cada edge tiene `sourceNodeId`, `targetNodeId`, `sourceHandle` (opcional: para conditions/choices).
- **Publish**: al publicar, el front serializa nodos + edges + variables en un único JSON y lo guarda en `flows.published_snapshot`. Además pone `flows.is_published = true`.
- **Runtime**: tu backend con Bun debe usar **solo** el `published_snapshot` cuando `is_published === true`; no leer las tablas `nodes`/`edges` para ejecutar. Así los edits en el builder no afectan conversaciones en curso.

### 1.5 Estructura del front (referencia)

```
app/
├── (auth)/              # Login / Register
├── (dashboard)/         # Lista de flows
├── api/
│   ├── auth/[...all]/   # Better Auth
│   └── flows/           # GET/PUT/DELETE flows (CRUD)
├── builder/[flowId]/    # Página del builder
└── lib/                 # auth, permissions

lib/
├── prisma.ts            # PrismaClient
├── types/index.ts       # Tipos (NodeType, MessageNodeData, etc.)
├── flows/contracts.ts    # Zod + toFlowNodeRows / toFlowEdgeRows
└── store/               # Zustand (flow-store, ui-store)

prisma/schema.prisma     # Schema compartido con tu backend
```

- El front **no** tiene rutas `/api/execute` ni runtime; eso lo implementás en el proyecto Bun.

### 1.6 Tipos de nodos (y `data` esperado)

Los que el runtime debe tratar (el front ya tiene nodos visuales y guarda `data` así):

| Tipo           | Descripción                         | Requiere input usuario | Ejemplo de `data` (campos clave) |
|----------------|-------------------------------------|------------------------|-----------------------------------|
| `start`        | Entrada del flow                    | No                     | `{}`                              |
| `message`      | Envía texto/imagen al usuario       | No                     | `content: [{ type: "text", text: "..." }, { type: "image", url: "..." }]` |
| `text_input`   | Pide texto, guarda en variable      | Sí (texto)             | `question`, `variableId`, `placeholder` |
| `choice_input` | Botones, guarda selección           | Sí (choice id)         | `question`, `choices: [{ id, label }]`, `variableId` (opcional) |
| `condition`    | Bifurca por variable                | No                     | `variableId`, `operator`, `value` (y en doc: `conditions[]`, `logicOperator`) |
| `set_variable` | Asigna variable                     | No                     | `variableId`, `value`             |
| `end`          | Fin de conversación                 | No                     | `{}`                              |
| `webhook`      | HTTP a API externa (futuro)         | No                     | `url`, `method`, `headers`, `body`, `responseVariableId` |
| `ai_block`     | LLM (futuro)                        | No                     | `provider`, `model`, `systemPrompt`, etc. |
| `wait`         | Pausa + typing (futuro)             | No                     | `duration`, `showTypingIndicator` |
| `code`         | JS custom (futuro)                 | No                     | `code`, `resultVariableId`        |
| `sticky_note`  | Solo decorativo, no ejecutar        | —                      | Ignorar en runtime                |

- En el front, algunos nodos usan `question` en lugar de `prompt` (ej. `TextInputNodeData.question`, `ChoiceInputNodeData.question`). El runtime debe aceptar ambos si el front no está unificado.
- **Edges**: `sourceHandle` identifica la rama (conditions: `"true"`/`"false"` o id de condición; choices: `id` del choice). Para nodos con una sola salida suele ser `"default"` o null.

### 1.7 Base de datos compartida

Tu backend Bun usará **la misma PostgreSQL** (misma `DATABASE_URL`). Modelos relevantes para el runtime:

- **flows**: `id`, `is_published`, `published_snapshot` (JSONB). No necesitás tocar `userId` para execute (solo leer flow por id y snapshot).
- **nodes** / **edges** / **variables**: solo para draft en el front; en runtime usás `published_snapshot` que ya incluye la estructura equivalente (nodos, edges, variables).
- **chat_sessions**: `id`, `flow_id`, `channel`, `external_id`, `current_node_id`, `variables_state` (JSONB), `status`, `metadata`.
- **session_messages**: `session_id`, `node_id`, `role` (bot/user/system), `content` (JSONB).

Enums útiles: `ChannelType` (web, whatsapp, api), `SessionStatus` (active, completed, abandoned, error), `MessageRole` (bot, user, system).

---

## 2. Backend con Bun — qué tenés que hacer

### 2.1 Objetivo

- **API externa** (servicio separado del Next.js) que:
  - Recibe eventos/mensajes de usuarios (web widget, WhatsApp, API).
  - Ejecuta el flow publicado (stateless: estado solo en DB).
  - Escala horizontalmente (varias instancias detrás de un load balancer).
  - Gestiona **múltiples sesiones en simultáneo** sin estado en memoria por sesión.

### 2.2 Stack sugerido

- **Runtime**: Bun.
- **HTTP**: `Bun.serve` o un framework mínimo (e.g. Hono o Elysia sobre Bun).
- **DB**: mismo PostgreSQL; **Prisma** (mismo `schema.prisma` que el front, o copia solo los modelos que necesites: Flow, ChatSession, SessionMessage; si no usás auth en este servicio, podés omitir User/Session/Account/Verification).
- **Validación**: Zod para body de `/execute` y webhooks.

### 2.3 Endpoints a implementar

1. **POST /execute** (o `/api/execute`)  
   - Cuerpo: `{ flowId: string, sessionId?: string, input?: string | { choiceId: string }, channel?: "web" | "whatsapp" | "api", externalId?: string }`.  
   - Si no hay `sessionId`, crear sesión (y opcionalmente vincular `externalId`).  
   - Cargar sesión → cargar flow (published_snapshot) → procesar input (si viene) → resolver siguiente nodo → ejecutar nodos en cadena hasta uno que requiera input o End.  
   - Respuesta: ver contrato abajo.

2. **Webhooks** (fase posterior): p. ej. `POST /webhooks/chatwoot` o `POST /webhooks/whatsapp` que reciben el evento, normalizan a `flowId + input + externalId` y llaman a la misma lógica de execute (o encolan un job). Opcional: validación de firma/API key.

### 2.4 Contrato de POST /execute

**Request (body):**

```ts
{
  flowId: string;           // obligatorio
  sessionId?: string;        // si no hay, se crea sesión nueva
  input?: string | { choiceId: string };  // texto o selección de choice
  channel?: "web" | "whatsapp" | "api";   // default "web"
  externalId?: string;       // ej: teléfono WhatsApp, chatwoot contact_id
}
```

**Response (200):**

```ts
interface ExecuteResponse {
  sessionId: string;
  outputs: OutputBlock[];      // mensajes del bot a mostrar en orden
  waitingForInput: boolean;    // true si el siguiente nodo es text_input o choice_input
  inputType?: "text" | "choice";
  inputConfig?: {
    placeholder?: string;
    choices?: { id: string; label: string }[];
    validation?: { type: string; message: string };
  };
  isCompleted: boolean;        // true si llegó a End
}

interface OutputBlock {
  type: "text" | "image" | "typing";
  content: string;
  delay?: number;  // ms antes de mostrar
}
```

- El front (widget) y los adapters de canal consumen este contrato. Mantené tipos compartidos (ej. en un paquete `shared` o copiando estas interfaces al repo Bun).

### 2.5 Flujo del runtime (resumen)

1. **Get/Create session**: por `sessionId` o por `(flowId, channel, externalId)`. Si no existe, crear `ChatSession` con `currentNodeId = null`, `variablesState = {}`, `status = active`.
2. **Load flow**: leer `Flow` por `flowId`; si `is_published` usar `published_snapshot` (objeto con `nodes`, `edges`, `variables`). Opcional: cache en memoria/Redis por `flowId` (invalidar al republicar).
3. **Determinar nodo actual**: si `currentNodeId` es null, buscar el nodo de tipo `start` y usarlo como actual.
4. **Process input** (si viene `input`): validar en el nodo actual (text_input: validaciones; choice_input: que el choice exista). Guardar en `variables_state`, insertar `SessionMessage` (role user), avanzar por el edge correspondiente (para choice: `sourceHandle === choiceId`).
5. **Resolve next node**: desde el nodo actual, seguir el edge (y en condition evaluar con `variables_state` para elegir el handle). Repetir hasta llegar a un nodo que requiera input o a `end`.
6. **Execute node**: según tipo, generar outputs (message → texto/imagen; set_variable → actualizar estado; condition → ya resuelto en paso 5; start/end → sin output o fin). Para message, interpolar `{{varName}}` en textos con `variables_state`.
7. **Persistir**: actualizar `ChatSession` (`currentNodeId`, `variables_state`, `status` si es end). Insertar `SessionMessage` para cada mensaje bot.
8. **Responder**: devolver `ExecuteResponse` con `sessionId`, `outputs`, `waitingForInput`, `inputType`, `inputConfig`, `isCompleted`.

### 2.6 Interpolación y condiciones

- **Interpolación**: en cualquier string (mensajes, prompts, etc.) reemplazar `{{nombreVariable}}` con el valor en `variables_state`. Regex sugerida: `/\{\{(\w+)\}\}/g`.
- **Condiciones**: operadores típicos (equals, not_equals, contains, gt, lt, is_empty, is_not_empty, matches). Evaluar con el valor de la variable indicada en el nodo condition y el `value` configurado; elegir el edge por `sourceHandle` ("true"/"false" o id de condición). Si hay varias condiciones, usar `logicOperator` (and/or) según el doc del front.

### 2.7 Concurrencia y múltiples sesiones

- **Stateless**: cada request lee y escribe en DB. No guardar estado de sesión en memoria.
- **Múltiples sesiones**: muchas `ChatSession` distintas (por flow, canal, externalId) se procesan en paralelo; PostgreSQL maneja bien muchas transacciones cortas.
- **Misma sesión**: si puede llegar más de un request simultáneo para el mismo `sessionId`, usar **bloqueo por fila** (ej. `SELECT ... FOR UPDATE` en una transacción) o actualización condicional (ej. `UPDATE chat_sessions SET ... WHERE id = ? AND updated_at = ?`) para evitar condiciones de carrera en `variables_state` y `current_node_id`.
- **Connection pool**: configurar Prisma (o el cliente) con un pool por instancia (ej. 10–20 conexiones). Así muchas sesiones simultáneas reparten carga entre instancias.

### 2.8 Seguridad

- **Autenticación del endpoint**: el front y los canales no usan cookies de Better Auth para execute. Definir auth para `/execute`: p. ej. API key en header (`X-API-Key` o `Authorization: Bearer <token>`) o firma por request. Los secretos (API key, keys de WhatsApp, etc.) solo en el backend Bun, nunca en el front.
- **Webhooks**: validar firma/secret del proveedor (Chatwoot, WhatsApp, etc.) antes de procesar.

### 2.9 Variables de entorno (backend Bun)

- `DATABASE_URL`: misma que el front (PostgreSQL).
- `API_KEY` o `EXECUTE_SECRET`: para autorizar llamadas a `/execute`.
- Opcional: `REDIS_URL` si usás Redis para cache de snapshots o colas.
- Opcional: `PORT` (default ej. 3001).

### 2.10 Estructura sugerida del proyecto Bun

```
runtime-api/           # o el nombre que elijas
├── package.json       # "bun" como runtime
├── tsconfig.json
├── .env.example
├── prisma/
│   └── schema.prisma # copia de flows + chat_sessions + session_messages (y tablas que necesites)
├── src/
│   ├── index.ts      # Bun.serve, rutas
│   ├── routes/
│   │   ├── execute.ts    # POST /execute
│   │   └── webhooks.ts   # futuros webhooks
│   ├── engine/
│   │   ├── executor.ts   # orquestación: session → flow → run loop
│   │   ├── resolver.ts   # siguiente nodo (edges, conditions)
│   │   └── handlers/
│   │       ├── message.ts
│   │       ├── text-input.ts
│   │       ├── choice-input.ts
│   │       ├── condition.ts
│   │       ├── set-variable.ts
│   │       └── start-end.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── interpolate.ts
│   │   ├── conditions.ts
│   │   └── types.ts     # ExecuteRequest, ExecuteResponse, OutputBlock, snapshot types
│   └── middleware/
│       └── auth.ts      # validar API key
└── README.md
```

- Compartir tipos con el front: podés publicar un paquete `@lain/shared` o copiar las interfaces en `src/lib/types.ts` y mantenerlas alineadas con el front.

### 2.11 Publicar flow (front) y consumo en el backend

- El front al publicar escribe en `flows` el `published_snapshot` y `is_published = true`. No tenés que hacer nada en el backend para “recibir” el snapshot: solo leer de la misma DB. Si más adelante el front llama a una API tuya para invalidar cache, podés exponer algo como `POST /internal/invalidate-cache?flowId=...` (protegido por otro secret).

---

## 3. Checklist para arrancar el proyecto aparte (Bun)

- [ ] Crear repo/carpeta del backend (Bun).
- [ ] Copiar o referenciar `prisma/schema.prisma` (solo modelos necesarios: Flow, ChatSession, SessionMessage; opcional FlowNode si cargás draft en algún flujo).
- [ ] Configurar `DATABASE_URL` (misma DB que el front).
- [ ] Implementar `POST /execute`: parsear body (Zod), get/create session, load flow (published_snapshot), loop execute + resolve.
- [ ] Implementar handlers por tipo de nodo: start, message, text_input, choice_input, condition, set_variable, end.
- [ ] Interpolación `{{var}}` y evaluación de condiciones.
- [ ] Respuesta según contrato `ExecuteResponse` / `OutputBlock`.
- [ ] Auth (API key o similar) en el endpoint.
- [ ] Manejo de concurrencia por sesión (lock o conditional update).
- [ ] (Opcional) Cache de snapshot por flowId; (opcional) Redis.
- [ ] (Futuro) Webhooks (Chatwoot, WhatsApp) que normalicen a execute.
- [ ] Documentar en el README del backend cómo correr (bun run dev, migraciones si las usás) y qué env vars necesita.

Con este MD tenés el contexto del front y todo lo que vas a requerir en el backend con Bun para arrancar el proyecto aparte de forma alineada con Lain Builder.
