"use client"

import { useState, useCallback, useRef } from "react"
import { NodeResizer, useReactFlow, type NodeProps } from "@xyflow/react"
import { useFlowStore } from "@/lib/store/flow-store"
import { useUIStore } from "@/lib/store/ui-store"
import { IconX } from "@tabler/icons-react"
import type { StickyNoteNodeData } from "@/lib/types"

const COLORS = {
  yellow: {
    bg: "bg-yellow-400/10",
    border: "border-yellow-600/40",
    selectedBorder: "border-yellow-500",
    text: "text-yellow-100",
    placeholder: "placeholder-yellow-700",
    resizer: "#ca8a04",
  },
  blue: {
    bg: "bg-blue-400/10",
    border: "border-blue-600/40",
    selectedBorder: "border-blue-500",
    text: "text-blue-100",
    placeholder: "placeholder-blue-700",
    resizer: "#2563eb",
  },
  green: {
    bg: "bg-emerald-400/10",
    border: "border-emerald-600/40",
    selectedBorder: "border-emerald-500",
    text: "text-emerald-100",
    placeholder: "placeholder-emerald-700",
    resizer: "#059669",
  },
  pink: {
    bg: "bg-pink-400/10",
    border: "border-pink-600/40",
    selectedBorder: "border-pink-500",
    text: "text-pink-100",
    placeholder: "placeholder-pink-700",
    resizer: "#db2777",
  },
} as const

export function StickyNoteNode({ id, data, selected }: NodeProps) {
  const d = data as StickyNoteNodeData
  const color = COLORS[d?.color ?? "yellow"]

  const [localText, setLocalText] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { deleteElements } = useReactFlow()
  const { closeConfigPanel } = useUIStore()
  const pushSnapshot = useFlowStore((s) => s.pushSnapshot)

  // When entering edit mode, seed localText from current data
  const handleDoubleClick = useCallback(() => {
    setLocalText(d?.text ?? "")
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [d?.text])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    const currentText = d?.text ?? ""
    if (localText === currentText) return
    pushSnapshot()
    useFlowStore.setState((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, text: localText } } : n
      ),
      isDirty: true,
    }))
  }, [id, localText, d?.text, pushSnapshot])

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      pushSnapshot()
      deleteElements({ nodes: [{ id }] })
      closeConfigPanel()
    },
    [id, deleteElements, pushSnapshot, closeConfigPanel],
  )

  const handleResizeEnd = useCallback(
    (_: unknown, params: { width: number; height: number }) => {
      pushSnapshot()
      useFlowStore.setState((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id
            ? {
                ...n,
                style: { width: params.width, height: params.height },
                data: { ...n.data, width: params.width, height: params.height },
              }
            : n
        ),
        isDirty: true,
      }))
    },
    [id, pushSnapshot],
  )

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={80}
        handleStyle={{
          width: 10,
          height: 10,
          backgroundColor: color.resizer,
          border: "none",
          borderRadius: 2,
          opacity: 0.8,
        }}
        lineStyle={{ borderColor: color.resizer, opacity: 0.5 }}
        onResizeEnd={handleResizeEnd}
      />

      {/* Node body — fills whatever size React Flow gives it */}
      <div
        className={`relative h-full w-full rounded-lg border-2 p-2 ${color.bg} ${
          selected ? color.selectedBorder : color.border
        }`}
        onDoubleClick={handleDoubleClick}
      >
        {/* Delete button */}
        {selected && (
          <button
            onClick={handleDelete}
            title="Delete note"
            className="absolute -top-2.5 -right-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-zinc-400 transition-colors hover:border-red-500 hover:bg-red-600 hover:text-white"
          >
            <IconX size={9} />
          </button>
        )}

        <textarea
          ref={textareaRef}
          className={`nodrag nopan h-full w-full resize-none bg-transparent text-xs leading-relaxed focus:outline-none ${color.text} ${color.placeholder}`}
          placeholder="Write a note…"
          value={isEditing ? localText : (d?.text ?? "")}
          readOnly={!isEditing}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={handleBlur}
          style={{ cursor: isEditing ? "text" : "default" }}
        />

        {/* Hint shown when not editing and empty */}
        {!isEditing && !localText && (
          <p className={`pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] italic opacity-40 ${color.text}`}>
            Double-click to edit
          </p>
        )}
      </div>
    </>
  )
}
