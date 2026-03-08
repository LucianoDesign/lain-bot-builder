"use server"

import { auth } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { createFlowSchema, updateFlowSchema, toFlowNodeRows, toFlowEdgeRows } from "@/lib/flows/contracts"
import type { AppNode, AppEdge, FlowSettings } from "@/lib/types"

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function createFlow(name: string, description?: string) {
  const session = await getSession()
  if (!session) return { error: "Unauthorized" as const }

  const parsed = createFlowSchema.safeParse({ name, description })
  if (!parsed.success) return { error: parsed.error.flatten() }

  const flow = await prisma.flow.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      nodes: {
        create: {
          type: "start",
          positionX: 300,
          positionY: 100,
          data: {},
        },
      },
    },
  })

  return { flow }
}

export async function deleteFlow(flowId: string) {
  const session = await getSession()
  if (!session) return { error: "Unauthorized" as const }

  const flow = await prisma.flow.findFirst({
    where: { id: flowId, userId: session.user.id },
  })
  if (!flow) return { error: "Not found" as const }

  await prisma.flow.delete({ where: { id: flowId } })
  return { success: true }
}

export async function saveFlow(flowId: string, nodes: AppNode[], edges: AppEdge[]) {
  const session = await getSession()
  if (!session) return { error: "Unauthorized" as const }

  const parsed = updateFlowSchema.safeParse({ nodes, edges })
  if (!parsed.success) return { error: parsed.error.flatten() }

  const flow = await prisma.flow.findFirst({
    where: { id: flowId, userId: session.user.id },
  })
  if (!flow) return { error: "Not found" as const }

  await prisma.$transaction(async (tx) => {
    await tx.flowEdge.deleteMany({ where: { flowId } })
    await tx.flowNode.deleteMany({ where: { flowId } })

    if (nodes.length > 0) {
      await tx.flowNode.createMany({ data: toFlowNodeRows(flowId, nodes) })
    }
    if (edges.length > 0) {
      await tx.flowEdge.createMany({ data: toFlowEdgeRows(flowId, edges) })
    }
  })

  return { success: true }
}

export async function saveFlowSettings(flowId: string, settings: FlowSettings) {
  const session = await getSession()
  if (!session) return { error: "Unauthorized" as const }

  const flow = await prisma.flow.findFirst({
    where: { id: flowId, userId: session.user.id },
  })
  if (!flow) return { error: "Not found" as const }

  await prisma.flow.update({
    where: { id: flowId },
    data: { settings: settings as object },
  })

  return { success: true }
}

export async function publishFlow(flowId: string) {
  const session = await getSession()
  if (!session) return { error: "Unauthorized" as const }

  const flow = await prisma.flow.findFirst({
    where: { id: flowId, userId: session.user.id },
    include: { nodes: true, edges: true, variables: true },
  })
  if (!flow) return { error: "Not found" as const }

  const snapshot = {
    nodes: flow.nodes,
    edges: flow.edges,
    variables: flow.variables,
  }

  await prisma.flow.update({
    where: { id: flowId },
    data: {
      isPublished: true,
      publishedSnapshot: snapshot as object,
    },
  })

  return { success: true }
}
