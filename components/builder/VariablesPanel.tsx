"use client"

import { useState } from "react"
import { useVariablesStore, type FlowVariable } from "@/lib/store/variables-store"
import { useUIStore } from "@/lib/store/ui-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { IconTrash, IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"

interface VariablesPanelProps {
  flowId: string
}

const VARIABLE_TYPES = ["string", "number", "boolean", "array", "object"] as const

export function VariablesPanel({ flowId }: VariablesPanelProps) {
  const { isVariablesPanelOpen, toggleVariablesPanel } = useUIStore()
  const { variables, addVariable, removeVariable } = useVariablesStore()

  const [name, setName] = useState("")
  const [type, setType] = useState<FlowVariable["type"]>("string")
  const [defaultValue, setDefaultValue] = useState("")
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`/api/flows/${flowId}/variables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, defaultValue: defaultValue || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to create variable")
        return
      }
      const v = await res.json()
      addVariable(v)
      setName("")
      setDefaultValue("")
      setType("string")
      toast.success(`Variable "${v.name}" created`)
    } catch {
      toast.error("Network error")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(v: FlowVariable) {
    try {
      const res = await fetch(`/api/flows/${flowId}/variables/${v.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        toast.error("Failed to delete variable")
        return
      }
      removeVariable(v.id)
      toast.success(`Variable "${v.name}" deleted`)
    } catch {
      toast.error("Network error")
    }
  }

  return (
    <Dialog open={isVariablesPanelOpen} onOpenChange={toggleVariablesPanel}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-900 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-zinc-200">
            Variables
          </DialogTitle>
        </DialogHeader>

        <p className="text-[11px] text-zinc-500">
          Use variables to store user input and pass data between nodes.
          Reference them with <code className="text-zinc-400">{"{{variableName}}"}</code>.
        </p>

        {/* Create form */}
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="myVariable"
                className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FlowVariable["type"])}
                className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              >
                {VARIABLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">Default value (optional)</Label>
            <Input
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder='e.g. "hello" or 0'
              className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={creating || !name.trim()}
            className="w-full bg-zinc-700 text-xs text-zinc-200 hover:bg-zinc-600"
          >
            <IconPlus size={12} className="mr-1" />
            Add Variable
          </Button>
        </form>

        <Separator className="bg-zinc-800" />

        {/* Variable list */}
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {variables.length === 0 ? (
            <p className="py-4 text-center text-xs text-zinc-600">No variables yet</p>
          ) : (
            variables.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-800/50 px-3 py-2"
              >
                <div>
                  <p className="text-xs font-medium text-zinc-200">
                    <code>{"{{" + v.name + "}}"}</code>
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {v.type}
                    {v.defaultValue ? ` · default: ${v.defaultValue}` : ""}
                    {v.isSystem ? " · system" : ""}
                  </p>
                </div>
                {!v.isSystem && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(v)}
                    className="h-6 w-6 text-zinc-600 hover:text-red-400"
                  >
                    <IconTrash size={12} />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
