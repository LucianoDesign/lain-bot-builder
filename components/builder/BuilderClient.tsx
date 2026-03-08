"use client"

import { useEffect } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { Canvas } from "./Canvas"
import { Sidebar } from "./Sidebar"
import { Toolbar } from "./Toolbar"
import { NodeConfigPanel } from "./NodeConfigPanel"
import { VariablesPanel } from "./VariablesPanel"
import { useFlow } from "@/hooks/useFlow"
import { useAutoSave } from "@/hooks/useAutoSave"
import { useFlowStore } from "@/lib/store/flow-store"
import { useVariablesStore, type FlowVariable } from "@/lib/store/variables-store"
import type { DbFlow } from "@/lib/types"

interface BuilderClientProps {
  flow: DbFlow
}

function BuilderInner({ flow }: BuilderClientProps) {
  useFlow({
    dbNodes: flow.nodes ?? [],
    dbEdges: flow.edges ?? [],
  })

  useAutoSave(flow.id)

  // Initialize variables from server-loaded props
  const { setVariables } = useVariablesStore()
  useEffect(() => {
    if (flow.variables) setVariables(flow.variables as FlowVariable[])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts for undo/redo
  const undo = useFlowStore((s) => s.undo)
  const redo = useFlowStore((s) => s.redo)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [undo, redo])

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <Toolbar flowId={flow.id} flowName={flow.name} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <Canvas />
        </div>
        <NodeConfigPanel />
      </div>
      <VariablesPanel flowId={flow.id} />
    </div>
  )
}

export function BuilderClient({ flow }: BuilderClientProps) {
  return (
    <ReactFlowProvider>
      <BuilderInner flow={flow} />
    </ReactFlowProvider>
  )
}
