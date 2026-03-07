import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { MessageNodeData } from "@/lib/types"

export function MessageNode({ data, selected }: NodeProps) {
  const d = data as MessageNodeData
  const firstText = d?.content?.find((c) => c.type === "text")?.text

  return (
    <div
      className={`w-48 rounded-lg border-2 bg-zinc-900 px-3 py-2.5 shadow-md transition-colors ${
        selected ? "border-blue-500" : "border-blue-800"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-zinc-700 !bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px]">
          💬
        </span>
        <span className="text-xs font-semibold text-blue-400">Message</span>
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">
        {firstText ?? <span className="italic text-zinc-600">No message yet</span>}
      </p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-zinc-700 !bg-zinc-900"
      />
    </div>
  )
}
