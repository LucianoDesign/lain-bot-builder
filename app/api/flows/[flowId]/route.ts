import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { z } from "zod"
import { NodeType } from "@/app/generated/prisma/client"
import type { AppNode, AppEdge } from "@/lib/types"

const updateFlowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
})

type RouteParams = { params: Promise<{ flowId: string }> }

async function getAuthorizedFlow(flowId: string, userId: string) {
  return prisma.flow.findFirst({
    where: { id: flowId, userId },
  })
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { flowId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const flow = await prisma.flow.findFirst({
    where: { id: flowId, userId: session.user.id },
    include: { nodes: true, edges: true, variables: true },
  })

  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(flow)
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { flowId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const flow = await getAuthorizedFlow(flowId, session.user.id)
  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await request.json()
  const parsed = updateFlowSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, description, nodes, edges } = parsed.data

  // Update flow metadata
  const updatedFlow = await prisma.flow.update({
    where: { id: flowId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  })

  // If nodes/edges are provided, do a full upsert
  if (nodes !== undefined && edges !== undefined) {
    const rfNodes = nodes as AppNode[]
    const rfEdges = edges as AppEdge[]

    await prisma.$transaction(async (tx) => {
      // Delete all existing nodes and edges (cascade deletes edges too)
      await tx.flowEdge.deleteMany({ where: { flowId } })
      await tx.flowNode.deleteMany({ where: { flowId } })

      // Re-create nodes
      if (rfNodes.length > 0) {
        await tx.flowNode.createMany({
          data: rfNodes.map((n) => ({
            id: n.id,
            flowId,
            type: n.type as NodeType,
            positionX: n.position.x,
            positionY: n.position.y,
            data: (n.data ?? {}) as object,
          })),
        })
      }

      // Re-create edges
      if (rfEdges.length > 0) {
        await tx.flowEdge.createMany({
          data: rfEdges.map((e) => ({
            id: e.id,
            flowId,
            sourceNodeId: e.source,
            targetNodeId: e.target,
            sourceHandle: e.sourceHandle ?? null,
            label: typeof e.label === "string" ? e.label : null,
          })),
        })
      }
    })
  }

  return NextResponse.json(updatedFlow)
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { flowId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const flow = await getAuthorizedFlow(flowId, session.user.id)
  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.flow.delete({ where: { id: flowId } })

  return NextResponse.json({ success: true })
}
