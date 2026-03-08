"use client"

import { useEffect, useRef } from "react"
import {
  IconLayoutGrid,
  IconSelectAll,
  IconX,
  IconClipboard,
} from "@tabler/icons-react"

interface CanvasContextMenuProps {
  x: number
  y: number
  hasClipboard: boolean
  onPaste: () => void
  onTidyUp: () => void
  onSelectAll: () => void
  onClearSelection: () => void
  onClose: () => void
}

export function CanvasContextMenu({
  x,
  y,
  hasClipboard,
  onPaste,
  onTidyUp,
  onSelectAll,
  onClearSelection,
  onClose,
}: CanvasContextMenuProps) {
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
    disabled = false,
  ) {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-zinc-500">{icon}</span>
        {label}
      </button>
    )
  }

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: y, left: x, zIndex: 1000 }}
      className="min-w-44 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-2xl"
    >
      {item(onPaste, <IconClipboard size={13} />, "Paste", !hasClipboard)}
      <div className="my-1 border-t border-zinc-800" />
      {item(onTidyUp, <IconLayoutGrid size={13} />, "Tidy up workflow")}
      <div className="my-1 border-t border-zinc-800" />
      {item(onSelectAll, <IconSelectAll size={13} />, "Select all")}
      {item(onClearSelection, <IconX size={13} />, "Clear selection")}
    </div>
  )
}
