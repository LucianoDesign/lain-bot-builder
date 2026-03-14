import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeWrapper } from "./NodeWrapper"
import type { TextInputNodeData } from "@/lib/types"

const validationLabel: Record<string, string> = {
  email: "✉ email",
  number: "# number",
  url: "🔗 url",
  phone: "📱 phone",
  regex: "regex",
}

export function TextInputNode({ id, data, selected }: NodeProps) {
  const d = data as TextInputNodeData
  const hasValidation = !!d?.validation?.type

  return (
    <NodeWrapper
      id={id}
      selected={selected}
      className={`w-48 rounded-lg border-2 bg-zinc-900 px-3 py-2.5 shadow-md transition-colors ${
        selected ? "border-violet-500" : "border-violet-800"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-2.5 w-2.5 border-2 border-zinc-700 bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-700 text-[10px]">
          ✏️
        </span>
        <span className="text-xs font-semibold text-violet-400">Text Input</span>
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">
        {d?.question ? (
          d.question
        ) : (
          <span className="italic text-zinc-600">No question set</span>
        )}
      </p>
      {d?.variableId && (
        <p className="mt-0.5 text-[10px] text-violet-600">→ saves to variable</p>
      )}
      {hasValidation && (
        <p className="mt-0.5 text-[10px] text-amber-500">
          ⚡ {validationLabel[d.validation!.type]}
        </p>
      )}
      {hasValidation ? (
        <>
          <div className="relative mt-2 flex justify-between text-[9px]">
            <span className="text-violet-400">Valid</span>
            <span className="text-red-400">Invalid</span>
          </div>
          <Handle
            id="default"
            type="source"
            position={Position.Bottom}
            style={{ left: "25%" }}
            className="h-2.5 w-2.5 border-2 border-violet-700 bg-zinc-900"
          />
          <Handle
            id="invalid"
            type="source"
            position={Position.Bottom}
            style={{ left: "75%" }}
            className="h-2.5 w-2.5 border-2 border-red-700 bg-zinc-900"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="h-2.5 w-2.5 border-2 border-zinc-700 bg-zinc-900"
        />
      )}
    </NodeWrapper>
  )
}
