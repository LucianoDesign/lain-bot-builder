import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeWrapper } from "./NodeWrapper"

export function InvalidInputNode({ id, selected }: NodeProps) {
  return (
    <NodeWrapper
      id={id}
      selected={selected}
      className={`w-48 rounded-lg border-2 bg-zinc-900 px-3 py-2.5 shadow-md transition-colors ${
        selected ? "border-red-500" : "border-red-900"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="invalid"
        className="h-2.5 w-2.5 border-2 border-red-800 bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-900 text-[10px]">
          ⚠
        </span>
        <span className="text-xs font-semibold text-red-400">Invalid Input</span>
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">
        Fires when input validation fails
      </p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5 w-2.5 border-2 border-zinc-700 bg-zinc-900"
      />
    </NodeWrapper>
  )
}
