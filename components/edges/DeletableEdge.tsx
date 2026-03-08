"use client"

import { useCallback } from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react"
import { useFlowStore } from "@/lib/store/flow-store"
import { useUIStore } from "@/lib/store/ui-store"
import { IconTrash } from "@tabler/icons-react"

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  const { deleteElements } = useReactFlow()
  const pushSnapshot = useFlowStore((s) => s.pushSnapshot)
  const hoveredEdgeId = useUIStore((s) => s.hoveredEdgeId)

  const isHovered = hoveredEdgeId === id

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      pushSnapshot()
      deleteElements({ edges: [{ id }] })
      useUIStore.getState().setHoveredEdgeId(null)
    },
    [id, deleteElements, pushSnapshot],
  )

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isHovered ? "#a1a1aa" : "#3f3f46",
          strokeWidth: isHovered ? 2 : 1.5,
          transition: "stroke 0.15s, stroke-width 0.15s",
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <button
            onClick={handleDelete}
            title="Delete connection"
            className={`flex h-5 w-5 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-zinc-400 shadow-md transition-all hover:border-red-500 hover:bg-red-600 hover:text-white ${
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
            }`}
          >
            <IconTrash size={10} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
