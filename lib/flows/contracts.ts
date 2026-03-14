import { z } from "zod"
import type { NodeType } from "@/app/generated/prisma/client"
import type { AppEdge, AppNode } from "@/lib/types"

export const nodeTypeSchema = z.enum([
  "start",
  "message",
  "text_input",
  "choice_input",
  "condition",
  "set_variable",
  "webhook",
  "ai_block",
  "wait",
  "jump",
  "code",
  "end",
  "sticky_note",
  "invalid_input",
])

const flowNodeSchema = z.object({
  id: z.string().min(1),
  type: nodeTypeSchema,
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  data: z.record(z.string(), z.unknown()).optional().default({}),
})

const flowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
})

export const createFlowSchema = z.object({
  name: z.string().min(1).max(100).default("Untitled Flow"),
  description: z.string().max(500).optional(),
})

export const updateFlowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  nodes: z.array(flowNodeSchema).optional(),
  edges: z.array(flowEdgeSchema).optional(),
})

export function toFlowNodeRows(flowId: string, nodes: AppNode[]) {
  return nodes.map((node) => ({
    id: node.id,
    flowId,
    type: node.type as NodeType,
    positionX: node.position.x,
    positionY: node.position.y,
    data: (node.data ?? {}) as object,
  }))
}

export function toFlowEdgeRows(flowId: string, edges: AppEdge[]) {
  return edges.map((edge) => ({
    id: edge.id,
    flowId,
    sourceNodeId: edge.source,
    targetNodeId: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    label: typeof edge.label === "string" ? edge.label : null,
  }))
}