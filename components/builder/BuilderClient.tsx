"use client"

import { ReactFlowProvider } from "@xyflow/react"
import { Canvas } from "./Canvas"
import { Sidebar } from "./Sidebar"
import { Toolbar } from "./Toolbar"
import { NodeConfigPanel } from "./NodeConfigPanel"
import { useFlow } from "@/hooks/useFlow"
import { useAutoSave } from "@/hooks/useAutoSave"
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
