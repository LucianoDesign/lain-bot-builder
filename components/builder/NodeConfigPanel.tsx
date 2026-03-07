"use client"

import { useUIStore } from "@/lib/store/ui-store"
import { useFlowStore } from "@/lib/store/flow-store"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { IconX } from "@tabler/icons-react"
import type { MessageNodeData } from "@/lib/types"

export function NodeConfigPanel() {
  const { selectedNodeId, isConfigPanelOpen, closeConfigPanel } = useUIStore()
  const { nodes, updateNodeData } = useFlowStore()

  if (!isConfigPanelOpen || !selectedNodeId) return null

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  return (
    <aside className="flex w-72 flex-col border-l border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {node.type?.replace("_", " ") ?? "Node"} config
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
            onChange={(data) => updateNodeData(selectedNodeId, data)}
          />
        )}
        {(node.type === "start" || node.type === "end") && (
          <p className="text-xs text-zinc-500">
            This node has no configurable properties.
          </p>
        )}
        {!["start", "end", "message"].includes(node.type ?? "") && (
          <p className="text-xs text-zinc-500">
            Configuration for <strong>{node.type}</strong> coming in Phase 2.
          </p>
        )}
      </div>
    </aside>
  )
}

function MessageConfig({
  data,
  onChange,
}: {
  data: MessageNodeData
  onChange: (d: Partial<MessageNodeData>) => void
}) {
  const text = data?.content?.find((c) => c.type === "text")?.text ?? ""

  function handleTextChange(value: string) {
    onChange({
      content: [{ type: "text", text: value }],
    })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">Message text</Label>
        <textarea
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none"
          rows={4}
          placeholder="Type your message here..."
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
        />
      </div>
    </div>
  )
}
