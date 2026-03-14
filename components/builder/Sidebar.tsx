"use client"

import { Separator } from "@/components/ui/separator"

interface NodeItem {
  type: string
  label: string
  color: string
  icon: string
  description: string
}

const STICKY_NOTE: NodeItem = {
  type: "sticky_note",
  label: "Sticky Note",
  color: "border-yellow-700 text-yellow-400",
  icon: "📝",
  description: "Add a canvas note",
}

const EVENT_NODES: NodeItem[] = [
  {
    type: "invalid_input",
    label: "Invalid Input",
    color: "border-red-900 text-red-400",
    icon: "⚠",
    description: "Input validation failed",
  },
]

const MVP_NODES: NodeItem[] = [
  {
    type: "start",
    label: "Start",
    color: "border-emerald-700 text-emerald-400",
    icon: "▶",
    description: "Flow entry point",
  },
  {
    type: "message",
    label: "Message",
    color: "border-blue-800 text-blue-400",
    icon: "💬",
    description: "Send text to user",
  },
  {
    type: "text_input",
    label: "Text Input",
    color: "border-violet-800 text-violet-400",
    icon: "✏️",
    description: "Ask user for input",
  },
  {
    type: "choice_input",
    label: "Choice",
    color: "border-amber-800 text-amber-400",
    icon: "🔘",
    description: "Show option buttons",
  },
  {
    type: "condition",
    label: "Condition",
    color: "border-orange-800 text-orange-400",
    icon: "◇",
    description: "Branch by condition",
  },
  {
    type: "set_variable",
    label: "Set Variable",
    color: "border-cyan-800 text-cyan-400",
    icon: "📦",
    description: "Assign a variable",
  },
  {
    type: "end",
    label: "End",
    color: "border-red-900 text-red-400",
    icon: "■",
    description: "End conversation",
  },
]

function NodeItem({
  node,
  onDragStart,
}: {
  node: NodeItem
  onDragStart: (e: React.DragEvent, type: string) => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node.type)}
      className={`flex cursor-grab items-center gap-2.5 rounded-md border bg-zinc-900/50 px-2.5 py-2 transition-colors hover:bg-zinc-800 active:cursor-grabbing ${node.color}`}
    >
      <span className="text-sm">{node.icon}</span>
      <div>
        <p className="text-xs font-medium text-zinc-200">{node.label}</p>
        <p className="text-[10px] text-zinc-500">{node.description}</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  function onDragStart(e: React.DragEvent, nodeType: string) {
    e.dataTransfer.setData("application/reactflow", nodeType)
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <aside className="flex w-52 flex-col border-r border-zinc-800 bg-zinc-900">
      <div className="px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Nodes
        </p>
      </div>
      <Separator className="bg-zinc-800" />
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {MVP_NODES.map((node) => (
          <NodeItem key={node.type} node={node} onDragStart={onDragStart} />
        ))}
        <Separator className="my-2 bg-zinc-800" />
        <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          Events
        </p>
        {EVENT_NODES.map((node) => (
          <NodeItem key={node.type} node={node} onDragStart={onDragStart} />
        ))}
        <Separator className="my-2 bg-zinc-800" />
        <NodeItem node={STICKY_NOTE} onDragStart={onDragStart} />
      </div>
    </aside>
  )
}
