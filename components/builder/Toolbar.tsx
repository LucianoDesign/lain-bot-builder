"use client"

import Link from "next/link"
import { useFlowStore } from "@/lib/store/flow-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconArrowLeft, IconBolt } from "@tabler/icons-react"

interface ToolbarProps {
  flowId: string
  flowName: string
}

export function Toolbar({ flowId, flowName }: ToolbarProps) {
  const saveStatus = useFlowStore((s) => s.saveStatus)

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
