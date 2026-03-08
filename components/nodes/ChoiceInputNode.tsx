import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeWrapper } from "./NodeWrapper"
import type { ChoiceInputNodeData } from "@/lib/types"

export function ChoiceInputNode({ id, data, selected }: NodeProps) {
  const d = data as ChoiceInputNodeData
  const choices = d?.choices ?? []

  return (
    <NodeWrapper
      id={id}
      selected={selected}
      className={`w-52 rounded-lg border-2 bg-zinc-900 px-3 py-2.5 shadow-md transition-colors ${
        selected ? "border-amber-500" : "border-amber-800"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-2.5 w-2.5 border-2 border-zinc-700 bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-700 text-[10px]">
          🔘
        </span>
        <span className="text-xs font-semibold text-amber-400">Choice</span>
      </div>
      <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400">
        {d?.question ? (
          d.question
        ) : (
          <span className="italic text-zinc-600">No question set</span>
        )}
      </p>
      {choices.length > 0 ? (
        <div className="mt-1.5 space-y-0.5">
          {choices.slice(0, 3).map((c) => (
            <div
              key={c.id}
              className="rounded border border-amber-900/50 bg-amber-950/30 px-1.5 py-0.5 text-[10px] text-amber-300"
            >
              {c.label}
            </div>
          ))}
          {choices.length > 3 && (
            <p className="text-[10px] text-zinc-600">+{choices.length - 3} more</p>
          )}
        </div>
      ) : (
        <p className="mt-1 text-[10px] italic text-zinc-600">No choices yet</p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5 w-2.5 border-2 border-zinc-700 bg-zinc-900"
      />
    </NodeWrapper>
  )
}
