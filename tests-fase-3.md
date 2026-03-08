# Tests — Fase 3

Suite de tests para los features implementados en la tercera fase del builder.

---

## 1. Flow Store — Metadata

**Archivo sugerido:** `lib/store/flow-store.test.ts`

- [ ] `setFlowMeta` actualiza `flowId`, `isPublished` y `flowSettings` en el store
- [ ] `setIsPublished` actualiza solo `isPublished` sin afectar el resto del estado
- [ ] `updateFlowSettings` actualiza solo `flowSettings` sin afectar el resto del estado
- [ ] El estado inicial tiene `flowId: ""`, `isPublished: false`, `flowSettings: {}`

---

## 2. UI Store — Flow Settings Panel

**Archivo sugerido:** `lib/store/ui-store.test.ts`

- [ ] `toggleFlowSettingsPanel` cambia `isFlowSettingsPanelOpen` de false a true
- [ ] `toggleFlowSettingsPanel` cambia `isFlowSettingsPanelOpen` de true a false
- [ ] El estado inicial tiene `isFlowSettingsPanelOpen: false`

---

## 3. StartNode

**Archivo sugerido:** `components/nodes/StartNode.test.tsx`

- [ ] Renderiza el label "Start"
- [ ] Muestra la URL de webhook usando `flowId` y `schema` del store
- [ ] Usa el schema por defecto `chatwoot_wp` cuando `flowSettings.schema` no está definido
- [ ] Al cambiar `flowSettings.schema` la URL se actualiza automáticamente
- [ ] Clic en el botón copy llama `navigator.clipboard.writeText` con la URL correcta
- [ ] Muestra el ícono de check tras copiar y vuelve al ícono de copy después de 2s
- [ ] El botón copy detiene propagación del evento (no abre el panel de config)

---

## 4. TextInputNode — Validación

**Archivo sugerido:** `components/nodes/TextInputNode.test.tsx`

- [ ] Sin validación: renderiza un solo handle de salida (source)
- [ ] Con validación: renderiza dos handles de salida (`id="default"` e `id="invalid"`)
- [ ] Con validación: muestra la etiqueta del tipo de validación activo (ej: "✉ email")
- [ ] Con validación: muestra las etiquetas "Valid" e "Invalid" junto a los handles
- [ ] Sin validación: no muestra etiquetas de valid/invalid ni badge de validación
- [ ] Muestra la pregunta configurada o texto en cursiva si está vacía

---

## 5. InvalidInputNode

**Archivo sugerido:** `components/nodes/InvalidInputNode.test.tsx`

- [ ] Renderiza el label "Invalid Input"
- [ ] Renderiza el texto descriptivo "Fires when input validation fails"
- [ ] Tiene un handle de entrada (target) en la parte superior
- [ ] Tiene un handle de salida (source) en la parte inferior
- [ ] El handle de entrada tiene `id="invalid"`

---

## 6. NodeConfigPanel — Start

**Archivo sugerido:** `components/builder/NodeConfigPanel.test.tsx` (extender existente)

- [ ] Nodo `start`: muestra el label "Webhook URL"
- [ ] Nodo `start`: el input de URL es de solo lectura
- [ ] Nodo `start`: la URL contiene el `flowId` y el `schema` del store
- [ ] Nodo `start`: clic en botón copy invoca `navigator.clipboard.writeText`
- [ ] Nodo `start`: muestra la nota sobre configurar en "Flow Settings"

---

## 7. NodeConfigPanel — Text Input Validación

**Archivo sugerido:** `components/builder/NodeConfigPanel.test.tsx` (extender existente)

- [ ] Muestra el selector de "Validation" con opción `— none —` por defecto
- [ ] Al seleccionar `regex` aparece el campo "Regex pattern"
- [ ] Al seleccionar otro tipo (`email`, `number`, etc.) NO aparece "Regex pattern"
- [ ] Al seleccionar cualquier tipo (distinto de none) aparece el campo "Error message"
- [ ] Al seleccionar `— none —` llama `updateNodeData` con `validation: undefined`
- [ ] Al seleccionar un tipo llama `updateNodeData` con el tipo correcto dentro de `validation`
- [ ] Al escribir en "Regex pattern" llama `updateNodeData` con el `pattern` actualizado
- [ ] Al escribir en "Error message" llama `updateNodeData` con `errorMessage` actualizado

---

## 8. NodeConfigPanel — Invalid Input Event

**Archivo sugerido:** `components/builder/NodeConfigPanel.test.tsx` (extender existente)

- [ ] Nodo `invalid_input`: muestra texto explicativo sobre la función del nodo
- [ ] Nodo `invalid_input`: menciona el handle "Invalid" del Text Input
- [ ] Nodo `invalid_input`: NO muestra campos de configuración editables

---

## 9. FlowSettingsPanel

**Archivo sugerido:** `components/builder/FlowSettingsPanel.test.tsx`

- [ ] No renderiza nada cuando `isFlowSettingsPanelOpen` es false
- [ ] Renderiza el dialog cuando `isFlowSettingsPanelOpen` es true
- [ ] Muestra los campos: Schema, Domain, Admin API Key, Chatwoot Bot Key, WABA Key, Phone ID
- [ ] Los inputs se inicializan con los valores actuales de `flowSettings` en el store
- [ ] Al abrir de nuevo tras cerrar, los inputs reflejan el estado actual del store (no el previo)
- [ ] Al hacer clic en "Cancel" llama `toggleFlowSettingsPanel` sin guardar
- [ ] Al hacer clic en "Save" llama la server action `saveFlowSettings` con el `flowId` y los valores del form
- [ ] Mientras guarda, el botón muestra "Saving..." y queda deshabilitado
- [ ] Tras guardar con éxito, llama `updateFlowSettings` en el store con los nuevos valores
- [ ] Tras guardar con éxito, cierra el dialog (`toggleFlowSettingsPanel`)
- [ ] Si la action retorna error, muestra el mensaje de error y NO cierra el dialog

---

## 10. Toolbar — Publish y Settings

**Archivo sugerido:** `components/builder/Toolbar.test.tsx`

- [ ] Botón "Settings" llama `toggleFlowSettingsPanel` al hacer clic
- [ ] Botón "Publish" muestra texto "Publish" cuando `isPublished` es false
- [ ] Botón "Publish" muestra texto "Re-publish" cuando `isPublished` es true
- [ ] Badge muestra "Draft" cuando `isPublished` es false
- [ ] Badge muestra "Published" cuando `isPublished` es true
- [ ] Al hacer clic en "Publish" llama la server action `publishFlow` con el `flowId`
- [ ] Mientras publica, el botón muestra "Publishing..." y queda deshabilitado
- [ ] Tras publicar con éxito, llama `setIsPublished(true)` en el store

---

## 11. Server Actions — saveFlowSettings

**Archivo sugerido:** `app/actions/flows.test.ts` (extender existente)

- [ ] Retorna `{ error: "Unauthorized" }` si no hay sesión activa
- [ ] Retorna `{ error: "Not found" }` si el flow no pertenece al usuario
- [ ] Actualiza `settings` en la DB con el objeto `FlowSettings` recibido
- [ ] Retorna `{ success: true }` tras guardar correctamente

---

## 12. Server Actions — publishFlow

**Archivo sugerido:** `app/actions/flows.test.ts` (extender existente)

- [ ] Retorna `{ error: "Unauthorized" }` si no hay sesión activa
- [ ] Retorna `{ error: "Not found" }` si el flow no pertenece al usuario
- [ ] Guarda un snapshot con `nodes`, `edges` y `variables` en `publishedSnapshot`
- [ ] Establece `isPublished: true` en el flow
- [ ] Retorna `{ success: true }` tras publicar correctamente

---

## 13. Server Actions — createFlow (auto Start node)

**Archivo sugerido:** `app/actions/flows.test.ts` (extender existente)

- [ ] Al crear un flow, se crea automáticamente un nodo de tipo `start`
- [ ] El Start node creado tiene `positionX: 300` y `positionY: 100`
- [ ] El Start node creado tiene `data: {}`

---

## 14. Sidebar

**Archivo sugerido:** `components/builder/Sidebar.test.tsx`

- [ ] Muestra el nodo "Start" como item arrastrable
- [ ] Muestra la sección "Events" con el nodo "Invalid Input"
- [ ] El drag del nodo "invalid_input" establece el dataTransfer correcto
- [ ] El drag del nodo "start" establece el dataTransfer correcto
