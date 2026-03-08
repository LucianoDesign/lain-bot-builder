import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeWrapper } from "./NodeWrapper"
import type { ConditionNodeData } from "@/lib/types"

const operatorLabel: Record<string, string> = {
  eq: "=",
  neq: "≠",
  contains: "contains",
  not_contains: "not contains",
  gt: ">",
  lt: "<",
  is_set: "is set",
  is_empty: "is empty",
}

export function ConditionNode({ id, data, selected }: NodeProps) {
  const d = data as ConditionNodeData
  const hasCondition = d?.variableId && d?.operator

  return (
    <NodeWrapper
      id={id}
      selected={selected}
      className={`w-52 rounded-lg border-2 bg-zinc-900 px-3 py-2.5 shadow-md transition-colors ${
        selected ? "border-orange-500" : "border-orange-800"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-2.5 w-2.5 border-2 border-zinc-700 bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-700 text-[10px] font-bold text-white">
          ◇
        </span>
        <span className="text-xs font-semibold text-orange-400">Condition</span>
      </div>
      <p className="mt-1 text-[11px] text-zinc-400">
        {hasCondition ? (
          <span>
            <span className="text-orange-300">var</span>{" "}
            <span className="text-zinc-500">{operatorLabel[d.operator!]}</span>{" "}
            {d.value ? <span className="text-zinc-300">{d.value}</span> : null}
          </span>
        ) : (
          <span className="italic text-zinc-600">No condition set</span>
        )}
      </p>
      <div className="relative mt-2 flex justify-between text-[9px]">
        <span className="text-emerald-500">True</span>
        <span className="text-red-500">False</span>
      </div>
      <Handle
        id="true"
        type="source"
        position={Position.Bottom}
        style={{ left: "25%" }}
        className="h-2.5 w-2.5 border-2 border-emerald-700 bg-zinc-900"
      />
      <Handle
        id="false"
        type="source"
        position={Position.Bottom}
        style={{ left: "75%" }}
        className="h-2.5 w-2.5 border-2 border-red-700 bg-zinc-900"
      />
    </NodeWrapper>
  )
}
