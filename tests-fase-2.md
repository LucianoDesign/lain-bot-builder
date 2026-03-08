# Tests — Fase 2

Suite de tests para los features implementados en la segunda fase del builder.

---

## 1. Flow Store — Undo/Redo

**Archivo sugerido:** `lib/store/flow-store.test.ts`

- [ ] `pushSnapshot` guarda el estado actual en `history` y limpia `future`
- [ ] `pushSnapshot` no guarda más de 30 entradas (límite de historia)
- [ ] `undo` mueve el estado actual a `future` y restaura el último `history`
- [ ] `undo` no hace nada si `history` está vacío
- [ ] `redo` mueve el estado actual a `history` y restaura el primer `future`
- [ ] `redo` no hace nada si `future` está vacío
- [ ] `redo` se limpia al hacer `pushSnapshot` (nueva acción borra el futuro)
- [ ] `updateNodeData` llama `pushSnapshot` antes de modificar el nodo
- [ ] `onConnect` llama `pushSnapshot` antes de agregar el edge
- [ ] `onNodesChange` con tipo `"remove"` llama `pushSnapshot`
- [ ] `onNodesChange` con tipo `"position"` y `dragging: false` llama `pushSnapshot`
- [ ] `onNodesChange` con tipo `"position"` y `dragging: true` NO llama `pushSnapshot`

---

## 2. Variables Store

**Archivo sugerido:** `lib/store/variables-store.test.ts`

- [ ] `setVariables` reemplaza el array completo
- [ ] `addVariable` agrega una variable al final del array
- [ ] `removeVariable` elimina la variable con el id dado sin tocar las demás
- [ ] `removeVariable` con un id inexistente no modifica el array
- [ ] `setLoading` actualiza el flag `isLoading`

---

## 3. UI Store — Clipboard y Hover Edge

**Archivo sugerido:** `lib/store/ui-store.test.ts`

- [ ] `setClipboard` guarda el nodo copiado
- [ ] `setClipboard(null)` limpia el clipboard
- [ ] `setHoveredEdgeId` actualiza el id del edge bajo el cursor
- [ ] `selectNode` con id válido abre el config panel (`isConfigPanelOpen: true`)
- [ ] `selectNode(null)` cierra el config panel y limpia `selectedNodeId`
- [ ] `closeConfigPanel` limpia `selectedNodeId` y cierra el panel

---

## 4. Types — Conversión DB ↔ React Flow

**Archivo sugerido:** `lib/types/index.test.ts`

- [ ] `dbNodesToRF` convierte posición correctamente para nodos normales
- [ ] `dbNodesToRF` aplica `node.style = { width, height }` para nodos `sticky_note` con dimensiones en data
- [ ] `dbNodesToRF` aplica dimensiones default (208×120) si `sticky_note` no tiene width/height en data
- [ ] `dbNodesToRF` NO aplica `style` a nodos que no son `sticky_note`
- [ ] `dbEdgesToRF` mapea `sourceHandle` correctamente (null → undefined)
- [ ] `dbEdgesToRF` mapea `label` correctamente (null → undefined)

---

## 5. Contracts — Schemas y Conversión

**Archivo sugerido:** `lib/flows/contracts.test.ts`

- [ ] `nodeTypeSchema` acepta `"sticky_note"` como tipo válido
- [ ] `nodeTypeSchema` rechaza tipos no definidos en el enum
- [ ] `createFlowSchema` requiere `name` y aplica el default `"Untitled Flow"`
- [ ] `updateFlowSchema` acepta `nodes` y `edges` opcionales
- [ ] `toFlowNodeRows` mapea posición X/Y correctamente
- [ ] `toFlowNodeRows` serializa `data` como objeto
- [ ] `toFlowEdgeRows` serializa `sourceHandle` null cuando es undefined
- [ ] `toFlowEdgeRows` ignora labels que no sean string

---

## 6. API — Variables

**Archivo sugerido:** `app/api/flows/[flowId]/variables/route.test.ts`

- [ ] `GET` retorna 401 si no hay sesión activa
- [ ] `GET` retorna 404 si el flow no pertenece al usuario
- [ ] `GET` retorna la lista de variables del flow en orden de creación
- [ ] `POST` crea una variable con nombre y tipo válidos, retorna 201
- [ ] `POST` retorna 400 si el nombre está vacío
- [ ] `POST` retorna 400 si el nombre tiene caracteres inválidos (espacios, guiones, etc.)
- [ ] `POST` retorna 409 si ya existe una variable con ese nombre en el mismo flow
- [ ] `POST` asigna `type: "string"` por defecto si no se envía tipo
- [ ] `DELETE` retorna 401 sin sesión
- [ ] `DELETE` retorna 404 si la variable no existe o pertenece a otro usuario
- [ ] `DELETE` elimina la variable y retorna `{ success: true }`

---

## 7. Nodos — Configuración por tipo (NodeConfigPanel)

**Archivo sugerido:** `components/builder/NodeConfigPanel.test.tsx`

- [ ] Muestra config de `message` cuando el nodo seleccionado es de tipo message
- [ ] Muestra config de `text_input` con campos: pregunta, placeholder, variable
- [ ] Muestra config de `choice_input` con botón "Add choice" y lista de choices
- [ ] Agregar un choice actualiza el nodo vía `updateNodeData`
- [ ] Eliminar un choice remueve solo ese item de la lista
- [ ] Config de `condition` oculta el campo "Value" si el operador es `is_set` o `is_empty`
- [ ] Config de `condition` muestra el campo "Value" para todos los otros operadores
- [ ] Config de `set_variable` muestra selector de variable y campo valor
- [ ] El botón "Delete node" llama a `deleteElements` y cierra el panel
- [ ] Sticky note muestra mensaje de "editar inline" sin campos de config
- [ ] Nodos `start` y `end` muestran mensaje "no configurable properties"

---

## 8. Sticky Note — Edición y Resize

**Archivo sugerido:** `components/nodes/StickyNoteNode.test.tsx`

- [ ] Muestra el hint "Double-click to edit" cuando está vacía y no está en modo edición
- [ ] Un solo click NO activa el modo edición (textarea queda `readOnly`)
- [ ] Doble click activa el modo edición y hace focus en el textarea
- [ ] `onBlur` guarda el texto en el store solo si cambió
- [ ] `onBlur` NO llama `pushSnapshot` si el texto no cambió
- [ ] `onBlur` SÍ llama `pushSnapshot` si el texto cambió
- [ ] El componente sincroniza `localText` cuando `data.text` cambia externamente (undo/redo)
- [ ] `onResizeEnd` guarda `width` y `height` en `node.data` y en `node.style`
- [ ] El botón de eliminar (X) aparece solo cuando el nodo está seleccionado

---

## 9. Context Menu — Canvas (click derecho en pane)

**Archivo sugerido:** `components/builder/CanvasContextMenu.test.tsx`

- [ ] "Paste" aparece deshabilitado cuando `hasClipboard` es false
- [ ] "Paste" está habilitado cuando `hasClipboard` es true
- [ ] Hacer click en "Paste" llama `onPaste`
- [ ] Hacer click en "Tidy up workflow" llama `onTidyUp`
- [ ] Hacer click en "Select all" llama `onSelectAll`
- [ ] Hacer click fuera del menú llama `onClose`
- [ ] Presionar Escape llama `onClose`

---

## 10. Context Menu — Nodo (click derecho en nodo)

**Archivo sugerido:** `components/builder/NodeContextMenu.test.tsx`

- [ ] Hacer click en "Copy" llama `onCopy`
- [ ] Hacer click en "Delete" llama `onDelete` y tiene estilo de peligro (rojo)
- [ ] Hacer click fuera del menú llama `onClose`
- [ ] Presionar Escape llama `onClose`

---

## 11. Copy / Paste — Integración

**Archivo sugerido:** `components/builder/Canvas.test.tsx` o test E2E

- [ ] Click derecho en un nodo → "Copy" guarda `{ type, data, style }` en el clipboard
- [ ] El clipboard persiste hasta que se copia otro nodo o se limpia
- [ ] "Paste" en el canvas crea un nodo nuevo con nuevo ID
- [ ] El nodo pegado aparece en la posición donde se hizo click derecho (flow coords)
- [ ] El nodo pegado tiene el mismo `type` y `data` que el original
- [ ] Pegar un sticky note copia también el `style` (width/height)
- [ ] `pushSnapshot` se llama antes de pegar (paste es undoable)
- [ ] Click derecho en nodo → "Delete" elimina el nodo y cierra el config panel

---

## 12. Edges — Eliminación con hover

**Archivo sugerido:** `components/edges/DeletableEdge.test.tsx`

- [ ] El botón de eliminar es invisible cuando `hoveredEdgeId` no coincide con el id del edge
- [ ] El botón de eliminar es visible cuando `hoveredEdgeId` coincide con el id del edge
- [ ] Click en el botón llama `deleteElements` con el id del edge
- [ ] Click en el botón llama `pushSnapshot` antes de eliminar
- [ ] El edge cambia de color/grosor cuando está en hover

---

## 13. Tidy Up — Algoritmo de Layout

**Archivo sugerido:** `lib/utils/tidyLayout.test.ts` (si se extrae como utilidad)

- [ ] Un flow lineal (A→B→C) genera 3 niveles verticales centrados
- [ ] Nodos sin conexiones entrantes se ubican en el nivel 0
- [ ] Nodos desconectados (sin edges) van al nivel 0
- [ ] El espaciado horizontal entre nodos del mismo nivel es uniforme (240px)
- [ ] El espaciado vertical entre niveles es uniforme (150px)
- [ ] Un flow con ramas (condición true/false) posiciona los hijos en el mismo nivel

---

## Prioridad sugerida

| Prioridad | Área |
|-----------|------|
| 🔴 Alta | Flow store (undo/redo), API de variables, Contracts |
| 🟡 Media | NodeConfigPanel, Copy/paste integración, Sticky note |
| 🟢 Baja | Context menus (presentacionales), DeletableEdge, Tidy layout |
