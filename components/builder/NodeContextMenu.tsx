"use client"

import { useEffect, useRef } from "react"
import { IconCopy, IconTrash } from "@tabler/icons-react"

interface NodeContextMenuProps {
  x: number
  y: number
  onCopy: () => void
  onDelete: () => void
  onClose: () => void
}

export function NodeContextMenu({
  x,
  y,
  onCopy,
  onDelete,
  onClose,
}: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [onClose])

  function item(
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    danger = false,
  ) {
    return (
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs hover:bg-zinc-800 ${
          danger ? "text-red-400 hover:text-red-300" : "text-zinc-300 hover:text-zinc-100"
        }`}
      >
        <span className={danger ? "text-red-500" : "text-zinc-500"}>{icon}</span>
        {label}
      </button>
    )
  }

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: y, left: x, zIndex: 1000 }}
      className="min-w-36 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-2xl"
    >
      {item(onCopy, <IconCopy size={13} />, "Copy")}
      <div className="my-1 border-t border-zinc-800" />
      {item(onDelete, <IconTrash size={13} />, "Delete", true)}
    </div>
  )
}
