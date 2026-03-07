# Chat Flow Builder — Plan de Arquitectura

## Visión General

Construir un **chat flow builder visual** (estilo Typebot) que permita crear chatbots mediante drag & drop, con ejecución en tiempo real a través de múltiples canales (web widget, WhatsApp, API).

---

## Stack Tecnológico

| Capa               | Tecnología                       | Justificación                                                 |
| ------------------ | -------------------------------- | ------------------------------------------------------------- |
| Framework          | **Next.js 15** (App Router)      | SSR/ISR, Route Handlers, Server Actions                       |
| Auth               | **Better Auth**                  | Auth moderna para Next.js, sesiones/cookies, RBAC con plugins |
| ORM + DB           | **Prisma + PostgreSQL**          | Modelado tipado, migraciones versionadas, queries seguras     |
| Canvas visual      | **React Flow**                   | Custom nodes, handles múltiples, minimap                      |
| Estado del builder | **Zustand**                      | Liviano, sincroniza bien con React Flow                       |
| Validación         | **Zod**                          | Schemas tipados para nodos y payloads                         |
| Estilos            | **Tailwind CSS** + **shadcn/ui** | UI consistente y rápida de iterar                             |
| Runtime            | **Node.js** (Route Handlers)     | Ejecutor stateless del flow                                   |

## Schema de Base de Datos (Prisma + PostgreSQL)

### Enums

```sql
-- Tipos de nodo disponibles
CREATE TYPE node_type AS ENUM (
  'start',
  'message',
  'text_input',
  'choice_input',
  'condition',
  'set_variable',
  'webhook',
  'ai_block',
  'wait',
  'jump',
  'code',
  'end'
);

-- Tipos de variable
CREATE TYPE variable_type AS ENUM (
  'string',
  'number',
  'boolean',
  'array',
  'object'
);

-- Estado de la sesión
CREATE TYPE session_status AS ENUM (
  'active',
  'completed',
  'abandoned',
  'error'
);

-- Rol del mensaje
CREATE TYPE message_role AS ENUM (
  'bot',
  'user',
  'system'
);

-- Canal de comunicación
CREATE TYPE channel_type AS ENUM (
  'web',
  'whatsapp',
  'api'
);
```

### Tablas

```sql
-- ============================================
-- FLOWS (cada chatbot es un flow)
-- ============================================
CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Better Auth usa la tabla "user"; si usás IDs string/cuid, user_id debe ser TEXT.
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Flow',
  description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  -- El flow publicado se "congela" como snapshot
  published_snapshot JSONB,       -- { nodes: [...], edges: [...], variables: [...] }
  settings JSONB DEFAULT '{}'::jsonb,
  /*
    settings puede incluir:
    {
      "theme": { "primaryColor": "#...", "fontFamily": "..." },
      "general": { "rememberUser": true, "typingDelay": 1000 },
      "metadata": { "websiteUrl": "...", "description": "..." }
    }
  */
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_flows_user ON flows(user_id);

-- ============================================
-- NODES (bloques del flow)
-- ============================================
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  type node_type NOT NULL,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  -- "data" contiene todo lo específico del tipo de nodo
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
    Ejemplos de data por tipo:

    type: 'message'
    {
      "content": [
        { "type": "text", "text": "Hola! ¿En qué puedo ayudarte?" },
        { "type": "image", "url": "https://..." }
      ]
    }

    type: 'text_input'
    {
      "prompt": "¿Cuál es tu nombre?",
      "variableId": "uuid-de-variable",
      "placeholder": "Escribí tu nombre...",
      "validation": { "type": "email" }  -- opcional
    }

    type: 'choice_input'
    {
      "prompt": "¿Qué querés hacer?",
      "choices": [
        { "id": "c1", "label": "Ver productos", "value": "productos" },
        { "id": "c2", "label": "Hablar con ventas", "value": "ventas" },
        { "id": "c3", "label": "Soporte técnico", "value": "soporte" }
      ],
      "variableId": "uuid-de-variable"
    }

    type: 'condition'
    {
      "conditions": [
        {
          "id": "cond1",
          "variableId": "uuid",
          "operator": "equals",      -- equals, contains, gt, lt, isEmpty, isNotEmpty, matches
          "value": "productos"
        }
      ],
      "logicOperator": "and"        -- and | or (para múltiples condiciones)
    }

    type: 'set_variable'
    {
      "variableId": "uuid",
      "mode": "set",                -- set | append | increment
      "value": "valor fijo",
      "expression": null            -- o una expresión JS: "{{nombre}} {{apellido}}"
    }

    type: 'webhook'
    {
      "url": "https://api.example.com/data",
      "method": "POST",
      "headers": { "Authorization": "Bearer {{token}}" },
      "body": "{ \"name\": \"{{nombre}}\" }",
      "responseVariableId": "uuid",
      "timeout": 10000
    }

    type: 'ai_block'
    {
      "provider": "openai",         -- openai | anthropic | custom
      "model": "gpt-4o-mini",
      "systemPrompt": "Sos un asistente...",
      "userMessage": "{{user_input}}",
      "responseVariableId": "uuid",
      "temperature": 0.7,
      "maxTokens": 500
    }

    type: 'wait'
    {
      "duration": 2000,             -- ms
      "showTypingIndicator": true
    }

    type: 'code'
    {
      "code": "return variables.precio * 1.21;",
      "resultVariableId": "uuid"
    }
  */
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nodes_flow ON nodes(flow_id);

-- ============================================
-- EDGES (conexiones entre nodos)
-- ============================================
CREATE TABLE edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  -- source_handle identifica la salida específica del nodo
  -- Para condiciones: "true" / "false" / "cond1" / "cond2" / "default"
  -- Para choices: el id del choice ("c1", "c2", etc.)
  -- Para nodos simples: "default" o NULL
  source_handle TEXT,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_edges_flow ON edges(flow_id);
CREATE INDEX idx_edges_source ON edges(source_node_id);

-- ============================================
-- VARIABLES (variables del flow)
-- ============================================
CREATE TABLE variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type variable_type NOT NULL DEFAULT 'string',
  default_value TEXT,
  is_system BOOLEAN DEFAULT FALSE,   -- true para variables built-in (ej: {{user_input}})
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(flow_id, name)
);

CREATE INDEX idx_variables_flow ON variables(flow_id);

-- ============================================
-- SESSIONS (cada conversación de un usuario final)
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  channel channel_type NOT NULL DEFAULT 'web',
  external_id TEXT,                  -- ID externo (ej: whatsapp phone, chatwoot contact_id)
  current_node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
  variables_state JSONB DEFAULT '{}'::jsonb,   -- estado actual de todas las variables
  status session_status DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,          -- info del canal, user agent, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_flow ON sessions(flow_id);
CREATE INDEX idx_sessions_external ON sessions(external_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- ============================================
-- SESSION MESSAGES (log de la conversación)
-- ============================================
CREATE TABLE session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
  role message_role NOT NULL,
  content JSONB NOT NULL,
  /*
    content puede ser:
    { "type": "text", "text": "Hola!" }
    { "type": "choices", "choices": [...], "selected": "c1" }
    { "type": "image", "url": "https://..." }
    { "type": "input", "value": "Juan" }
  */
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_session ON session_messages(session_id);
CREATE INDEX idx_messages_created ON session_messages(created_at);

-- ============================================
-- TRIGGERS para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flows_updated_at
  BEFORE UPDATE ON flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Estrategia de Seguridad y Acceso (Better Auth)

- No usamos RLS de Supabase.
- La autenticación se resuelve con Better Auth (sesiones + cookies HTTP-only).
- La autorización se resuelve con RBAC en aplicación (roles/permisos).
- Toda query de editor debe filtrar por `user_id` (owner del flow).
- Los endpoints públicos de runtime (`/api/execute`, webhooks) deben validar API key o firma.
- Los secrets de integraciones (OpenAI, webhooks, etc.) se guardan server-side y nunca en el cliente.

---

## Arquitectura de Carpetas

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                 -- sidebar, nav
│   │   ├── page.tsx                   -- listado de flows
│   │   └── flows/
│   │       └── [flowId]/
│   │           └── analytics/page.tsx -- métricas del flow
│   ├── builder/
│   │   └── [flowId]/
│   │       └── page.tsx               -- editor visual (React Flow)
│   ├── chat/
│   │   └── [flowId]/
│   │       └── page.tsx               -- widget de chat (preview + embed)
│   └── api/
│       ├── auth/
│       │   └── [...all]/route.ts      -- Better Auth handler
│       ├── flows/
│       │   ├── route.ts               -- GET (list), POST (create)
│       │   └── [flowId]/
│       │       ├── route.ts           -- GET, PUT, DELETE
│       │       └── publish/route.ts   -- POST (snapshot + publish)
│       ├── execute/
│       │   └── route.ts               -- POST (runtime engine endpoint)
│       └── webhook/
│           └── [flowId]/route.ts      -- POST (entry point para canales externos)
├── components/
│   ├── builder/
│   │   ├── Canvas.tsx                 -- wrapper de React Flow
│   │   ├── Sidebar.tsx                -- panel de nodos (drag source)
│   │   ├── NodeConfigPanel.tsx        -- panel de edición del nodo seleccionado
│   │   ├── Toolbar.tsx                -- undo, redo, zoom, publish
│   │   └── VariablesPanel.tsx         -- CRUD de variables
│   ├── nodes/                         -- componentes custom de React Flow
│   │   ├── StartNode.tsx
│   │   ├── MessageNode.tsx
│   │   ├── TextInputNode.tsx
│   │   ├── ChoiceInputNode.tsx
│   │   ├── ConditionNode.tsx
│   │   ├── SetVariableNode.tsx
│   │   ├── WebhookNode.tsx
│   │   ├── AiBlockNode.tsx
│   │   ├── CodeNode.tsx
│   │   ├── WaitNode.tsx
│   │   └── EndNode.tsx
│   ├── chat/
│   │   ├── ChatWidget.tsx             -- componente principal del chat
│   │   ├── ChatBubble.tsx             -- burbuja de mensaje
│   │   ├── ChatInput.tsx              -- input del usuario
│   │   └── ChoiceButtons.tsx          -- botones de opciones
│   └── ui/                            -- shadcn/ui components
├── lib/
│   ├── auth.ts                        -- Better Auth server config
│   ├── auth-client.ts                 -- Better Auth client helpers/hooks
│   ├── permissions.ts                 -- RBAC (roles + access control)
│   ├── prisma.ts                      -- PrismaClient singleton
│   ├── engine/
│   │   ├── executor.ts                -- lógica principal del runtime
│   │   ├── node-handlers/             -- handler por tipo de nodo
│   │   │   ├── message.handler.ts
│   │   │   ├── text-input.handler.ts
│   │   │   ├── choice-input.handler.ts
│   │   │   ├── condition.handler.ts
│   │   │   ├── set-variable.handler.ts
│   │   │   ├── webhook.handler.ts
│   │   │   ├── ai-block.handler.ts
│   │   │   └── code.handler.ts
│   │   ├── resolver.ts               -- resuelve el próximo nodo via edges
│   │   └── interpolator.ts           -- reemplaza {{variable}} en textos
│   ├── store/
│   │   ├── flow-store.ts             -- Zustand: nodos, edges, operaciones
│   │   └── ui-store.ts               -- Zustand: panel abierto, nodo seleccionado
│   ├── schemas/
│   │   ├── node-schemas.ts           -- Zod schemas por tipo de nodo
│   │   └── flow-schemas.ts           -- Zod schemas para flow, edge, variable
│   └── types/
│       └── index.ts                   -- TypeScript types compartidos
└── hooks/
    ├── useFlow.ts                     -- cargar/guardar flow
    ├── useAutoSave.ts                 -- debounced auto-save
    └── useChat.ts                     -- lógica del chat widget
```

---

## Tipos de Nodos

### Fase 1 — MVP

| Nodo             | Descripción                               | Handles de salida  |
| ---------------- | ----------------------------------------- | ------------------ |
| **Start**        | Punto de entrada del flow                 | 1 (default)        |
| **Message**      | Envía texto/imagen al usuario             | 1 (default)        |
| **Text Input**   | Pide texto al usuario, guarda en variable | 1 (default)        |
| **Choice Input** | Muestra botones, guarda selección         | N (1 por choice)   |
| **Condition**    | Evalúa variable, bifurca el flow          | 2 (true/false) o N |
| **Set Variable** | Asigna/modifica una variable              | 1 (default)        |
| **End**          | Finaliza la conversación                  | 0                  |

### Fase 2 — Avanzado

| Nodo         | Descripción                             |
| ------------ | --------------------------------------- |
| **Webhook**  | HTTP request a API externa              |
| **AI Block** | Llamada a LLM (OpenAI, Anthropic, etc.) |
| **Wait**     | Pausa con typing indicator              |
| **Jump**     | Salta a otro nodo del flow              |
| **Code**     | Ejecuta JavaScript custom               |

### Fase 3 — Canales y Integraciones

| Nodo                  | Descripción                            |
| --------------------- | -------------------------------------- |
| **WhatsApp List**     | Muestra lista interactiva (WhatsApp)   |
| **WhatsApp Template** | Envía template aprobado                |
| **Media**             | Envía imagen/video/documento           |
| **Prisma Query**      | Lee/escribe en PostgreSQL vía Prisma   |
| **GHL Contact**       | Crea/actualiza contacto en GoHighLevel |

---

## Runtime Engine — Diseño

### Principios

1. **Stateless**: toda la sesión vive en la DB (current_node_id + variables_state)
2. **Agnóstico al canal**: recibe input genérico, retorna respuesta genérica
3. **Ejecuta en cadena**: si un nodo no requiere input del usuario (Message, Set Variable, Condition), avanza automáticamente al siguiente
4. **Idempotente**: si recibe el mismo input dos veces, el resultado es el mismo

### Flujo de Ejecución

```
[Canal] → POST /api/execute
           │
           ├─ body: { flowId, sessionId?, input?, channel }
           │
           ▼
    ┌─────────────────┐
    │  1. Get/Create   │ → Si no hay sessionId, crea sesión nueva
    │     Session      │ → Carga current_node_id + variables_state
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  2. Load Flow    │ → Carga nodos + edges (cacheable)
    │                  │ → Si is_published: usa published_snapshot
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  3. Process      │ → Si hay input: procesa en nodo actual
    │     Input        │ → Valida, guarda en variable, log message
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  4. Resolve Next │ → Busca edge desde nodo actual
    │     Node         │ → Para conditions: evalúa y elige handle
    │                  │ → Para choices: usa handle del choice elegido
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐     ┌──── Sí ────┐
    │  5. Execute Node │────▶│ ¿Requiere  │
    │                  │     │   input?    │
    └─────────────────┘     └──────┬──────┘
             │                     │
          No requiere         Sí requiere
          input (Message,     input (Text Input,
          Set Variable...)    Choice Input...)
             │                     │
             ▼                     ▼
    ┌─────────────────┐   ┌──────────────────┐
    │  Acumula output  │   │  Retorna outputs  │
    │  + vuelve a      │   │  acumulados +      │
    │  paso 4           │   │  espera input      │
    └─────────────────┘   └──────────────────┘
```

### Response Structure

```typescript
interface ExecuteResponse {
  sessionId: string;
  outputs: OutputBlock[]; // mensajes del bot a mostrar
  waitingForInput: boolean; // true si espera respuesta del usuario
  inputType?: "text" | "choice";
  inputConfig?: {
    placeholder?: string;
    choices?: { id: string; label: string }[];
    validation?: { type: string; message: string };
  };
  isCompleted: boolean; // true si llegó a End node
}

interface OutputBlock {
  type: "text" | "image" | "typing";
  content: string;
  delay?: number; // ms antes de mostrar
}
```

---

## Guardado del Flow

### Auto-save con Debounce

```
[Cambio en React Flow] → Zustand store → debounce 1.5s → PATCH /api/flows/[id]
```

- Cada cambio (mover nodo, editar data, crear/borrar edge) actualiza el Zustand store
- Un hook `useAutoSave` escucha cambios y guarda con debounce
- El PATCH envía `{ nodes: [...], edges: [...], variables: [...] }` completo (upsert)
- Indicador visual: "Saving..." / "Saved" / "Error"

### Draft vs Published

- El builder siempre edita el **draft** (tablas nodes, edges, variables)
- Al hacer **Publish**: se serializa todo como JSON en `flows.published_snapshot`
- El runtime usa `published_snapshot` si `is_published = true`
- Esto permite editar sin afectar conversaciones en curso

---

## Fases de Implementación

### Fase 1 — Fundamentos (Semana 1-2)

- [ x ] Setup Next.js + Tailwind + shadcn/ui
- [ x ] Configurar Prisma (schema + migraciones)
- [ x ] Configurar Better Auth (email/password + session cookies + RBAC)
- [ x ] Auth pages (login/register con Better Auth)
- [ x ] Dashboard: listar, crear, eliminar flows
- [ x ] Builder: canvas React Flow con nodos básicos (Start, Message, End)
- [ x ] Persistencia: guardar/cargar flow desde PostgreSQL con Prisma
- [ x ] Auto-save con debounce

### Fase 2 — Builder Completo (Semana 3-4)

- [ ] Nodos: Text Input, Choice Input, Condition, Set Variable
- [ ] Panel de configuración por tipo de nodo
- [ ] Sistema de variables (CRUD + interpolación {{var}})
- [ ] Validación de conexiones (ej: Start solo tiene output, End solo tiene input)
- [ ] Undo/Redo
- [ ] Minimap, controles de zoom
- [ ] Copy/paste de nodos

### Fase 3 — Runtime + Chat Widget (Semana 5-6)

- [ ] Runtime engine (executor + node handlers + resolver)
- [ ] API endpoint: POST /api/execute
- [ ] Chat widget web (preview en el builder)
- [ ] Chat widget embebible (iframe + script tag)
- [ ] Typing indicators y delays
- [ ] Publish flow (snapshot)

### Fase 4 — Features Avanzados (Semana 7-8)

- [ ] Webhook node
- [ ] AI Block node (integración con OpenAI/Anthropic)
- [ ] Code node (sandbox JS)
- [ ] Analytics básico (sesiones, completions, drop-offs)
- [ ] Templates de flows predefinidos
- [ ] Duplicar flow

### Fase 5 — Canales Externos (Semana 9-10)

- [ ] WhatsApp via n8n/WAHA (webhook entry point)
- [ ] Adapters por canal (web → WhatsApp message types)
- [ ] WhatsApp-specific nodes (lists, templates)
- [ ] Session resume (reconectar usuario por external_id)

---

## Dependencias Principales

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "better-auth": "^1.x",
    "@prisma/client": "^6.x",
    "reactflow": "^11.x",
    "zustand": "^4.x",
    "zod": "^3.x",
    "tailwindcss": "^3.x",
    "@radix-ui/react-*": "latest"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "prisma": "^6.x"
  }
}
```

---

## Notas Técnicas

### React Flow — Custom Nodes

Cada tipo de nodo tiene su componente visual. El nodo recibe `data` (el JSONB de la DB) y renderiza el preview. Al hacer click, abre el panel de configuración lateral.

Los **handles** (puntos de conexión) se definen por tipo:

- Nodos simples: 1 target (arriba) + 1 source (abajo)
- Choice Input: 1 target + N sources (1 por choice)
- Condition: 1 target + 2+ sources (true/false o múltiples condiciones)

### Interpolación de Variables

El engine reemplaza `{{nombreVariable}}` en cualquier texto antes de ejecutar. Usa regex simple:

```typescript
function interpolate(text: string, variables: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key]?.toString() ?? "";
  });
}
```

### Evaluación de Condiciones

```typescript
type Operator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "is_empty"
  | "is_not_empty"
  | "matches";

function evaluate(value: any, operator: Operator, target: any): boolean {
  switch (operator) {
    case "equals":
      return String(value) === String(target);
    case "contains":
      return String(value).includes(String(target));
    case "gt":
      return Number(value) > Number(target);
    case "is_empty":
      return !value || value === "";
    case "matches":
      return new RegExp(target).test(String(value));
    // ...etc
  }
}
```

### Cache del Flow

Para el runtime, el flow (nodos + edges) es inmutable una vez publicado. Podés cachear en memoria o Redis:

```typescript
const flowCache = new Map<
  string,
  { nodes: Node[]; edges: Edge[]; ttl: number }
>();
```

Invalidar al republicar.
