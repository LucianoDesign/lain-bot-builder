"use client"

import { useCallback, useRef, useState, useMemo } from "react"
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
import { TextInputNode } from "@/components/nodes/TextInputNode"
import { ChoiceInputNode } from "@/components/nodes/ChoiceInputNode"
import { ConditionNode } from "@/components/nodes/ConditionNode"
import { SetVariableNode } from "@/components/nodes/SetVariableNode"
import { StickyNoteNode } from "@/components/nodes/StickyNoteNode"
import { DeletableEdge } from "@/components/edges/DeletableEdge"
import { CanvasContextMenu } from "./CanvasContextMenu"
import { NodeContextMenu } from "./NodeContextMenu"
import type { AppNode, AppEdge } from "@/lib/types"

const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  end: EndNode,
  text_input: TextInputNode,
  choice_input: ChoiceInputNode,
  condition: ConditionNode,
  set_variable: SetVariableNode,
  sticky_note: StickyNoteNode,
}

const edgeTypes = {
  default: DeletableEdge,
}

const initialNodeData: Record<string, AppNode["data"]> = {
  message: { content: [] },
  text_input: { question: "", variableId: undefined, placeholder: "" },
  choice_input: { question: "", choices: [] },
  condition: { variableId: undefined, operator: "eq", value: "" },
  set_variable: { variableId: undefined, value: "" },
  sticky_note: { text: "", color: "yellow" },
}

let nodeCounter = Date.now()
const getNewId = () => `node_${nodeCounter++}`

// ─── Tidy-up layout ──────────────────────────────────────────────────────────

function applyTidyLayout(nodes: AppNode[], edges: AppEdge[]): AppNode[] {
  const outgoing = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  for (const n of nodes) {
    outgoing.set(n.id, [])
    inDegree.set(n.id, 0)
  }
  for (const e of edges) {
    outgoing.get(e.source)?.push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
  }

  const level = new Map<string, number>()
  const queue: string[] = []

  for (const n of nodes) {
    if ((inDegree.get(n.id) ?? 0) === 0) {
      level.set(n.id, 0)
      queue.push(n.id)
    }
  }

  while (queue.length > 0) {
    const id = queue.shift()!
    const nextLevel = (level.get(id) ?? 0) + 1
    for (const child of outgoing.get(id) ?? []) {
      if (!level.has(child)) {
        level.set(child, nextLevel)
        queue.push(child)
      }
    }
  }

  for (const n of nodes) {
    if (!level.has(n.id)) level.set(n.id, 0)
  }

  const byLevel = new Map<number, string[]>()
  for (const [id, lv] of level) {
    if (!byLevel.has(lv)) byLevel.set(lv, [])
    byLevel.get(lv)!.push(id)
  }

  const X_GAP = 240
  const Y_GAP = 150
  const positions = new Map<string, { x: number; y: number }>()

  for (const [lv, ids] of byLevel) {
    const totalW = (ids.length - 1) * X_GAP
    ids.forEach((id, idx) => {
      positions.set(id, { x: idx * X_GAP - totalW / 2, y: lv * Y_GAP })
    })
  }

  return nodes.map((n) => ({
    ...n,
    position: positions.get(n.id) ?? n.position,
  }))
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

type CanvasContextMenuState = {
  x: number
  y: number
  flowX: number
  flowY: number
}

type NodeContextMenuState = {
  x: number
  y: number
  nodeId: string
}

function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, pushSnapshot } =
    useFlowStore()
  const { selectNode, setHoveredEdgeId, clipboard, setClipboard } = useUIStore()
  const { screenToFlowPosition, fitView, deleteElements } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null)
  const [nodeContextMenu, setNodeContextMenu] = useState<NodeContextMenuState | null>(null)

  // Sticky notes render first → always behind functional nodes
  const sortedNodes = useMemo(
    () => [
      ...nodes.filter((n) => n.type === "sticky_note"),
      ...nodes.filter((n) => n.type !== "sticky_note"),
    ],
    [nodes],
  )

  const closeAllMenus = useCallback(() => {
    setContextMenu(null)
    setNodeContextMenu(null)
  }, [])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type !== "sticky_note") selectNode(node.id)
    },
    [selectNode],
  )

  const onPaneClick = useCallback(() => {
    selectNode(null)
    closeAllMenus()
  }, [selectNode, closeAllMenus])

  const onPaneContextMenu = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      e.preventDefault()
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      setNodeContextMenu(null)
      setContextMenu({ x: e.clientX, y: e.clientY, flowX: flowPos.x, flowY: flowPos.y })
    },
    [screenToFlowPosition],
  )

  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      e.preventDefault()
      e.stopPropagation()
      setContextMenu(null)
      setNodeContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id })
    },
    [],
  )

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

      pushSnapshot()

      const newNode: AppNode = {
        id: getNewId(),
        type: type as AppNode["type"],
        position,
        data: initialNodeData[type] ?? {},
        ...(type === "sticky_note" && { style: { width: 208, height: 120 } }),
      }

      useFlowStore.setState((state) => ({
        nodes: [...state.nodes, newNode],
        isDirty: true,
      }))
    },
    [screenToFlowPosition, pushSnapshot],
  )

  // ─── Canvas context menu actions ──────────────────────────────────────────

  function handlePaste() {
    if (!clipboard || !contextMenu) return
    pushSnapshot()
    const newNode: AppNode = {
      id: getNewId(),
      type: clipboard.type,
      position: { x: contextMenu.flowX, y: contextMenu.flowY },
      data: { ...clipboard.data },
      ...(clipboard.style && { style: { ...clipboard.style } }),
    }
    useFlowStore.setState((state) => ({
      nodes: [...state.nodes, newNode],
      isDirty: true,
    }))
    closeAllMenus()
  }

  function handleTidyUp() {
    pushSnapshot()
    useFlowStore.setState((state) => ({
      nodes: applyTidyLayout(state.nodes, state.edges),
      isDirty: true,
    }))
    setTimeout(() => fitView({ duration: 400, padding: 0.1 }), 50)
    closeAllMenus()
  }

  function handleSelectAll() {
    useFlowStore.setState((state) => ({
      nodes: state.nodes.map((n) => ({ ...n, selected: true })),
    }))
    closeAllMenus()
  }

  function handleClearSelection() {
    useFlowStore.setState((state) => ({
      nodes: state.nodes.map((n) => ({ ...n, selected: false })),
    }))
    closeAllMenus()
  }

  // ─── Node context menu actions ────────────────────────────────────────────

  function handleCopyNode() {
    if (!nodeContextMenu) return
    const node = nodes.find((n) => n.id === nodeContextMenu.nodeId)
    if (!node) return
    setClipboard({ type: node.type, data: { ...node.data }, style: node.style })
    closeAllMenus()
  }

  function handleDeleteNode() {
    if (!nodeContextMenu) return
    pushSnapshot()
    deleteElements({ nodes: [{ id: nodeContextMenu.nodeId }] })
    useUIStore.getState().closeConfigPanel()
    closeAllMenus()
  }

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <ReactFlow
        nodes={sortedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
        onEdgeMouseLeave={() => setHoveredEdgeId(null)}
        onDragOver={onDragOver}
        onDrop={onDrop}
        selectionOnDrag
        panOnDrag={[1]}
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
          className="border-zinc-700 bg-zinc-900"
          nodeColor={() => "#3f3f46"}
          maskColor="rgba(0,0,0,0.4)"
        />
      </ReactFlow>

      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasClipboard={clipboard !== null}
          onPaste={handlePaste}
          onTidyUp={handleTidyUp}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onClose={closeAllMenus}
        />
      )}

      {nodeContextMenu && (
        <NodeContextMenu
          x={nodeContextMenu.x}
          y={nodeContextMenu.y}
          onCopy={handleCopyNode}
          onDelete={handleDeleteNode}
          onClose={closeAllMenus}
        />
      )}
    </div>
  )
}

export function Canvas() {
  return <CanvasInner />
}
