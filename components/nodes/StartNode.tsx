"use client"

import { useState } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeWrapper } from "./NodeWrapper"
import { useFlowStore } from "@/lib/store/flow-store"
import { IconCopy, IconCheck } from "@tabler/icons-react"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://back-bot.lain.ar"

export function StartNode({ id, selected }: NodeProps) {
  const flowId = useFlowStore((s) => s.flowId)
  const flowSettings = useFlowStore((s) => s.flowSettings)
  const [copied, setCopied] = useState(false)

  const schema = flowSettings?.schema ?? "chatwoot_wp"
  const webhookUrl = `${BACKEND_URL}?flowId=${flowId}&schema=${schema}`

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <NodeWrapper
      id={id}
      selected={selected}
      className={`w-56 rounded-lg border-2 bg-zinc-900 px-3 py-2.5 shadow-md transition-colors ${
        selected ? "border-emerald-500" : "border-emerald-700"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            ▶
          </span>
          <span className="text-xs font-semibold text-emerald-400">Start</span>
        </div>
        <button
          onClick={handleCopy}
          className="rounded p-0.5 text-zinc-500 hover:text-emerald-400 transition-colors"
          title="Copy webhook URL"
        >
          {copied ? (
            <IconCheck size={12} className="text-emerald-400" />
          ) : (
            <IconCopy size={12} />
          )}
        </button>
      </div>
      <p className="mt-1 truncate text-[10px] text-zinc-500" title={webhookUrl}>
        {webhookUrl}
      </p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5 w-2.5 border-2 border-zinc-700 bg-zinc-900"
      />
    </NodeWrapper>
  )
}
