import { Handle, Position, type NodeProps } from "@xyflow/react";

export function StartNode({ selected }: NodeProps) {
  return (
    <div
      className={`w-40 rounded-lg border-2 bg-zinc-900 px-3 py-2.5 shadow-md transition-colors ${
        selected ? "border-emerald-500" : "border-emerald-700"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
          ▶
        </span>
        <span className="text-xs font-semibold text-emerald-400">Start</span>
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">Flow entry point</p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5 w-2.5 border-2 border-zinc-700 bg-zinc-900"
      />
    </div>
  );
}
