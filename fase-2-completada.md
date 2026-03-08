# Fase 2 — Completada

## Resumen

Nodos completos con UI propia, sistema de variables, undo/redo y configuración por tipo de nodo.

## Archivos creados

### Nuevos nodos

- `components/nodes/TextInputNode.tsx` — nodo violeta, muestra la pregunta y si guarda en variable
- `components/nodes/ChoiceInputNode.tsx` — nodo ámbar, muestra la pregunta y preview de choices
- `components/nodes/ConditionNode.tsx` — nodo naranja, handles True/False separados (id="true", id="false")
- `components/nodes/SetVariableNode.tsx` — nodo cian, muestra variable=valor

### Variables

- `lib/store/variables-store.ts` — Zustand store: `variables`, `setVariables`, `addVariable`, `removeVariable`
- `app/api/flows/[flowId]/variables/route.ts` — GET + POST
- `app/api/flows/[flowId]/variables/[variableId]/route.ts` — DELETE
- `components/builder/VariablesPanel.tsx` — Dialog modal para CRUD de variables

## Archivos modificados

### Tipos (`lib/types/index.ts`)

Añadidos: `TextInputNodeData`, `TextInputNodeData`, `ChoiceChoice`, `ChoiceInputNodeData`,
`ConditionOperator`, `ConditionNodeData`, `SetVariableNodeData`

### Flow store (`lib/store/flow-store.ts`)

Undo/Redo: `history[]`, `future[]`, `pushSnapshot()`, `undo()`, `redo()`

- Snapshots automáticos en: remove node, node move final, remove edge, connect, updateNodeData, drop node

### Canvas (`components/builder/Canvas.tsx`)

- Registra los 4 nuevos node types
- `initialNodeData` map para data inicial correcta por tipo
- Llama `pushSnapshot()` antes de hacer drop

### NodeConfigPanel (`components/builder/NodeConfigPanel.tsx`)

Config completa por tipo:

- **message**: textarea de texto
- **text_input**: pregunta + placeholder + variable selector
- **choice_input**: pregunta + add/remove choices dinámicos
- **condition**: variable + operador (8 opciones) + valor (oculto si is_set/is_empty) + hint true/false
- **set_variable**: variable + valor con hint de interpolación

### Toolbar (`components/builder/Toolbar.tsx`)

- Botones Undo/Redo (deshabilitados cuando no hay historia)
- Botón "Variables" abre el panel

### BuilderClient (`components/builder/BuilderClient.tsx`)

- Carga variables al montar via `/api/flows/[flowId]/variables`
- Keyboard shortcuts: `Ctrl+Z` = undo, `Ctrl+Y` / `Ctrl+Shift+Z` = redo
- Renderiza `<VariablesPanel />`
