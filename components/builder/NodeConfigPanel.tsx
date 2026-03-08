"use client"

import { useUIStore } from "@/lib/store/ui-store"
import { useFlowStore } from "@/lib/store/flow-store"
import { useVariablesStore } from "@/lib/store/variables-store"
import { useReactFlow } from "@xyflow/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { IconX, IconPlus, IconTrash } from "@tabler/icons-react"
import type {
  MessageNodeData,
  TextInputNodeData,
  ChoiceInputNodeData,
  ChoiceChoice,
  ConditionNodeData,
  ConditionOperator,
  SetVariableNodeData,
} from "@/lib/types"

export function NodeConfigPanel() {
  const { selectedNodeId, isConfigPanelOpen, closeConfigPanel } = useUIStore()
  const { nodes, updateNodeData, pushSnapshot } = useFlowStore()
  const { deleteElements } = useReactFlow()

  if (!isConfigPanelOpen || !selectedNodeId) return null

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  const typeLabel = (node.type ?? "node").replace(/_/g, " ")

  function handleDeleteNode() {
    pushSnapshot()
    deleteElements({ nodes: [{ id: selectedNodeId! }] })
    closeConfigPanel()
  }

  return (
    <aside className="flex w-72 flex-col border-l border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {typeLabel} config
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeConfigPanel}
          className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
        >
          <IconX size={14} />
        </Button>
      </div>
      <Separator className="bg-zinc-800" />
      <div className="flex-1 overflow-y-auto p-4">
        {node.type === "message" && (
          <MessageConfig
            data={node.data as MessageNodeData}
            onChange={(d) => updateNodeData(selectedNodeId, d)}
          />
        )}
        {node.type === "text_input" && (
          <TextInputConfig
            data={node.data as TextInputNodeData}
            onChange={(d) => updateNodeData(selectedNodeId, d)}
          />
        )}
        {node.type === "choice_input" && (
          <ChoiceInputConfig
            data={node.data as ChoiceInputNodeData}
            onChange={(d) => updateNodeData(selectedNodeId, d)}
          />
        )}
        {node.type === "condition" && (
          <ConditionConfig
            data={node.data as ConditionNodeData}
            onChange={(d) => updateNodeData(selectedNodeId, d)}
          />
        )}
        {node.type === "set_variable" && (
          <SetVariableConfig
            data={node.data as SetVariableNodeData}
            onChange={(d) => updateNodeData(selectedNodeId, d)}
          />
        )}
        {(node.type === "start" || node.type === "end") && (
          <p className="text-xs text-zinc-500">
            This node has no configurable properties.
          </p>
        )}
        {node.type === "sticky_note" && (
          <p className="text-xs text-zinc-500">
            Edit text directly on the note in the canvas.
          </p>
        )}
      </div>
      <Separator className="bg-zinc-800" />
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteNode}
          className="w-full gap-1.5 text-xs text-red-500 hover:bg-red-950 hover:text-red-400"
        >
          <IconTrash size={13} />
          Delete node
        </Button>
      </div>
    </aside>
  )
}

// ─── Message ────────────────────────────────────────────────────────────────

function MessageConfig({
  data,
  onChange,
}: {
  data: MessageNodeData
  onChange: (d: Partial<MessageNodeData>) => void
}) {
  const text = data?.content?.find((c) => c.type === "text")?.text ?? ""

  return (
    <div className="space-y-3">
      <FieldLabel>Message text</FieldLabel>
      <textarea
        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none"
        rows={4}
        placeholder="Type your message… use {{variable}} for variables"
        value={text}
        onChange={(e) =>
          onChange({ content: [{ type: "text", text: e.target.value }] })
        }
      />
    </div>
  )
}

// ─── Text Input ─────────────────────────────────────────────────────────────

function TextInputConfig({
  data,
  onChange,
}: {
  data: TextInputNodeData
  onChange: (d: Partial<TextInputNodeData>) => void
}) {
  const { variables } = useVariablesStore()

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <FieldLabel>Question to ask</FieldLabel>
        <textarea
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none"
          rows={3}
          placeholder="What is your name?"
          value={data?.question ?? ""}
          onChange={(e) => onChange({ question: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Placeholder</FieldLabel>
        <Input
          value={data?.placeholder ?? ""}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          placeholder="Type here…"
          className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Save answer to variable</FieldLabel>
        <VariableSelect
          value={data?.variableId ?? ""}
          onChange={(id) => onChange({ variableId: id || undefined })}
          variables={variables}
        />
      </div>
    </div>
  )
}

// ─── Choice Input ────────────────────────────────────────────────────────────

function ChoiceInputConfig({
  data,
  onChange,
}: {
  data: ChoiceInputNodeData
  onChange: (d: Partial<ChoiceInputNodeData>) => void
}) {
  const choices: ChoiceChoice[] = data?.choices ?? []

  function addChoice() {
    const id = `choice_${Date.now()}`
    onChange({ choices: [...choices, { id, label: "" }] })
  }

  function updateChoice(id: string, label: string) {
    onChange({ choices: choices.map((c) => (c.id === id ? { ...c, label } : c)) })
  }

  function removeChoice(id: string) {
    onChange({ choices: choices.filter((c) => c.id !== id) })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <FieldLabel>Question</FieldLabel>
        <textarea
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none"
          rows={2}
          placeholder="Choose an option:"
          value={data?.question ?? ""}
          onChange={(e) => onChange({ question: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <FieldLabel>Choices</FieldLabel>
        {choices.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <Input
              value={c.label}
              onChange={(e) => updateChoice(c.id, e.target.value)}
              placeholder="Option label"
              className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeChoice(c.id)}
              className="h-7 w-7 shrink-0 text-zinc-600 hover:text-red-400"
            >
              <IconTrash size={12} />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={addChoice}
          className="w-full border border-dashed border-zinc-700 text-xs text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
        >
          <IconPlus size={12} className="mr-1" />
          Add choice
        </Button>
      </div>
    </div>
  )
}

// ─── Condition ───────────────────────────────────────────────────────────────

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "not contains" },
  { value: "gt", label: "greater than" },
  { value: "lt", label: "less than" },
  { value: "is_set", label: "is set" },
  { value: "is_empty", label: "is empty" },
]

const NO_VALUE_OPS: ConditionOperator[] = ["is_set", "is_empty"]

function ConditionConfig({
  data,
  onChange,
}: {
  data: ConditionNodeData
  onChange: (d: Partial<ConditionNodeData>) => void
}) {
  const { variables } = useVariablesStore()
  const op = data?.operator ?? "eq"
  const needsValue = !NO_VALUE_OPS.includes(op)

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <FieldLabel>Variable</FieldLabel>
        <VariableSelect
          value={data?.variableId ?? ""}
          onChange={(id) => onChange({ variableId: id || undefined })}
          variables={variables}
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Operator</FieldLabel>
        <select
          value={op}
          onChange={(e) =>
            onChange({ operator: e.target.value as ConditionOperator })
          }
          className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        >
          {OPERATORS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {needsValue && (
        <div className="space-y-1.5">
          <FieldLabel>Value</FieldLabel>
          <Input
            value={data?.value ?? ""}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder='e.g. "yes" or 18'
            className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
      )}
      <div className="rounded-md border border-zinc-800 bg-zinc-800/30 p-2 text-[10px] text-zinc-500">
        Connect the <span className="font-semibold text-emerald-500">True</span> handle for the
        matching branch and <span className="font-semibold text-red-500">False</span> for the other.
      </div>
    </div>
  )
}

// ─── Set Variable ────────────────────────────────────────────────────────────

function SetVariableConfig({
  data,
  onChange,
}: {
  data: SetVariableNodeData
  onChange: (d: Partial<SetVariableNodeData>) => void
}) {
  const { variables } = useVariablesStore()

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <FieldLabel>Variable to set</FieldLabel>
        <VariableSelect
          value={data?.variableId ?? ""}
          onChange={(id) => onChange({ variableId: id || undefined })}
          variables={variables}
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Value</FieldLabel>
        <Input
          value={data?.value ?? ""}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder='e.g. "hello" or {{otherVar}}'
          className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
        />
        <p className="text-[10px] text-zinc-600">
          Use <code className="text-zinc-500">{"{{variable}}"}</code> to reference other variables.
        </p>
      </div>
    </div>
  )
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-xs text-zinc-400">{children}</Label>
}

function VariableSelect({
  value,
  onChange,
  variables,
}: {
  value: string
  onChange: (id: string) => void
  variables: Array<{ id: string; name: string; type: string }>
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600"
    >
      <option value="">— select variable —</option>
      {variables.map((v) => (
        <option key={v.id} value={v.id}>
          {"{{"}{v.name}{"}}"} ({v.type})
        </option>
      ))}
    </select>
  )
}
