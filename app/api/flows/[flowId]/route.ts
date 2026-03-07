import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { updateFlowSchema, toFlowEdgeRows, toFlowNodeRows } from "@/lib/flows/contracts"
import type { AppNode, AppEdge } from "@/lib/types"

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

  const updatedFlow = await prisma.flow.update({
    where: { id: flowId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  })

  if (nodes !== undefined && edges !== undefined) {
    const rfNodes = nodes as AppNode[]
    const rfEdges = edges as AppEdge[]

    await prisma.$transaction(async (tx) => {
      await tx.flowEdge.deleteMany({ where: { flowId } })
      await tx.flowNode.deleteMany({ where: { flowId } })

      if (rfNodes.length > 0) {
        await tx.flowNode.createMany({
          data: toFlowNodeRows(flowId, rfNodes),
        })
      }

      if (rfEdges.length > 0) {
        await tx.flowEdge.createMany({
          data: toFlowEdgeRows(flowId, rfEdges),
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