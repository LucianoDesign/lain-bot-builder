"use client"

import { useCallback, useRef } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useFlowStore } from "@/lib/store/flow-store"
import { useUIStore } from "@/lib/store/ui-store"
import { StartNode } from "@/components/nodes/StartNode"
import { MessageNode } from "@/components/nodes/MessageNode"
import { EndNode } from "@/components/nodes/EndNode"
import type { AppNode } from "@/lib/types"

const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  end: EndNode,
  text_input: MessageNode,
  choice_input: MessageNode,
  condition: MessageNode,
  set_variable: MessageNode,
}

let nodeCounter = Date.now()
const getNewId = () => `node_${nodeCounter++}`

function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useFlowStore()
  const { selectNode } = useUIStore()
  const { screenToFlowPosition } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => selectNode(node.id),
    [selectNode]
  )

  const onPaneClick = useCallback(() => selectNode(null), [selectNode])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData("application/reactflow")
      if (!type || !wrapperRef.current) return

      const bounds = wrapperRef.current.getBoundingClientRect()
      const position = screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      })

      const newNode: AppNode = {
        id: getNewId(),
        type: type as AppNode["type"],
        position,
        data: type === "message" ? { content: [] } : {},
      }

      useFlowStore.setState((state) => ({
        nodes: [...state.nodes, newNode],
        isDirty: true,
      }))
    },
    [screenToFlowPosition]
  )

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        className="bg-zinc-950"
        deleteKeyCode="Delete"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#3f3f46"
        />
        <Controls className="[&>button]:border-zinc-700 [&>button]:bg-zinc-800 [&>button]:text-zinc-300" />
        <MiniMap
          className="!bg-zinc-900 !border-zinc-700"
          nodeColor={() => "#3f3f46"}
          maskColor="rgba(0,0,0,0.4)"
        />
      </ReactFlow>
    </div>
  )
}

export function Canvas() {
  return <CanvasInner />
}
