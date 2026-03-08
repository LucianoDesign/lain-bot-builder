import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeWrapper } from "./NodeWrapper"
import type { SetVariableNodeData } from "@/lib/types"

export function SetVariableNode({ id, data, selected }: NodeProps) {
  const d = data as SetVariableNodeData

  return (
    <NodeWrapper
      id={id}
      selected={selected}
      className={`w-48 rounded-lg border-2 bg-zinc-900 px-3 py-2.5 shadow-md transition-colors ${
        selected ? "border-cyan-500" : "border-cyan-800"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-2.5 w-2.5 border-2 border-zinc-700 bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-700 text-[10px]">
          📦
        </span>
        <span className="text-xs font-semibold text-cyan-400">Set Variable</span>
      </div>
      <p className="mt-1 text-[11px] text-zinc-400">
        {d?.variableId ? (
          <span>
            <span className="text-cyan-300">var</span>
            {d.value ? (
              <>
                {" "}
                <span className="text-zinc-500">=</span>{" "}
                <span className="line-clamp-1 text-zinc-300">{d.value}</span>
              </>
            ) : (
              <span className="italic text-zinc-600"> (no value)</span>
            )}
          </span>
        ) : (
          <span className="italic text-zinc-600">Not configured</span>
        )}
      </p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5 w-2.5 border-2 border-zinc-700 bg-zinc-900"
      />
    </NodeWrapper>
  )
}
