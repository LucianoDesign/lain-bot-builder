import type { Node as RFNode, Edge as RFEdge } from "@xyflow/react"

// ============================================
// DB types (mirroring Prisma models)
// ============================================

export interface DbFlowNode {
  id: string
  flowId: string
  type: string
  positionX: number
  positionY: number
  data: unknown
  createdAt: Date
}

export interface DbFlowEdge {
  id: string
  flowId: string
  sourceNodeId: string
  targetNodeId: string
  sourceHandle: string | null
  label: string | null
  createdAt: Date
}

export interface DbVariable {
  id: string
  flowId: string
  name: string
  type: string
  defaultValue: string | null
  isSystem: boolean
  createdAt: Date
}

export interface DbFlow {
  id: string
  userId: string
  name: string
  description: string | null
  isPublished: boolean
  publishedSnapshot: unknown
  settings: unknown
  createdAt: Date
  updatedAt: Date
  nodes?: DbFlowNode[]
  edges?: DbFlowEdge[]
  variables?: DbVariable[]
}

// ============================================
// Node Types
// ============================================

export type NodeType =
  | "start"
  | "message"
  | "text_input"
  | "choice_input"
  | "condition"
  | "set_variable"
  | "webhook"
  | "ai_block"
  | "wait"
  | "jump"
  | "code"
  | "end"
  | "sticky_note"

export interface StickyNoteNodeData {
  text?: string
  color?: "yellow" | "blue" | "green" | "pink"
  width?: number
  height?: number
}

export interface MessageNodeData {
  content?: Array<{ type: "text" | "image"; text?: string; url?: string }>
}

export interface TextInputNodeData {
  question?: string
  variableId?: string
  placeholder?: string
}

export interface ChoiceChoice {
  id: string
  label: string
}

export interface ChoiceInputNodeData {
  question?: string
  choices?: ChoiceChoice[]
}

export type ConditionOperator =
  | "eq"
  | "neq"
  | "contains"
  | "not_contains"
  | "gt"
  | "lt"
  | "is_set"
  | "is_empty"

export interface ConditionNodeData {
  variableId?: string
  operator?: ConditionOperator
  value?: string
}

export interface SetVariableNodeData {
  variableId?: string
  value?: string
}

export type AppNodeData = Record<string, unknown>

export type AppNode = RFNode<AppNodeData, NodeType>
export type AppEdge = RFEdge

// ============================================
// Save status
// ============================================
export type SaveStatus = "idle" | "saving" | "saved" | "error"

// ============================================
// Helpers: DB ↔ React Flow conversion
// ============================================

export function dbNodesToRF(dbNodes: DbFlowNode[]): AppNode[] {
  return dbNodes.map((n) => {
    const data = (n.data ?? {}) as AppNodeData
    const node: AppNode = {
      id: n.id,
      type: n.type as NodeType,
      position: { x: n.positionX, y: n.positionY },
      data,
    }
    // Restore sticky note dimensions from persisted data
    if (n.type === "sticky_note") {
      const d = data as StickyNoteNodeData
      node.style = { width: d.width ?? 208, height: d.height ?? 120 }
    }
    return node
  })
}

export function dbEdgesToRF(dbEdges: DbFlowEdge[]): AppEdge[] {
  return dbEdges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    sourceHandle: e.sourceHandle ?? undefined,
    label: e.label ?? undefined,
  }))
}
