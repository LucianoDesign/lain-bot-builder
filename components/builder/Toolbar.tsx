"use client"

import Link from "next/link"
import { useFlowStore } from "@/lib/store/flow-store"
import { useUIStore } from "@/lib/store/ui-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  IconArrowLeft,
  IconBolt,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconVariable,
} from "@tabler/icons-react"

interface ToolbarProps {
  flowId: string
  flowName: string
}

export function Toolbar({ flowName }: ToolbarProps) {
  const saveStatus = useFlowStore((s) => s.saveStatus)
  const history = useFlowStore((s) => s.history)
  const future = useFlowStore((s) => s.future)
  const undo = useFlowStore((s) => s.undo)
  const redo = useFlowStore((s) => s.redo)
  const { toggleVariablesPanel } = useUIStore()

  const statusLabel = {
    idle: null,
    saving: <span className="text-zinc-500">Saving...</span>,
    saved: <span className="text-emerald-500">Saved</span>,
    error: <span className="text-red-500">Error saving</span>,
  }[saveStatus]

  return (
    <header className="flex h-12 items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4">
      <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">
        <IconArrowLeft size={16} />
      </Link>

      <div className="flex items-center gap-1.5">
        <IconBolt size={14} className="text-zinc-500" />
        <span className="text-xs text-zinc-500">Lain</span>
        <span className="text-xs text-zinc-700">/</span>
        <span className="text-sm font-medium text-zinc-200">{flowName}</span>
      </div>

      <Separator orientation="vertical" className="h-5 bg-zinc-800" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={history.length === 0}
          title="Undo (Ctrl+Z)"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
        >
          <IconArrowBackUp size={15} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={future.length === 0}
          title="Redo (Ctrl+Y)"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
        >
          <IconArrowForwardUp size={15} />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-5 bg-zinc-800" />

      {/* Variables */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleVariablesPanel}
        className="h-7 gap-1.5 px-2 text-xs text-zinc-400 hover:text-zinc-200"
      >
        <IconVariable size={13} />
        Variables
      </Button>

      <div className="flex-1" />

      {statusLabel && (
        <span className="text-xs">{statusLabel}</span>
      )}

      <Badge
        variant="secondary"
        className="bg-zinc-800 text-zinc-500 hover:bg-zinc-800 text-[11px]"
      >
        Draft
      </Badge>
    </header>
  )
}
