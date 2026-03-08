import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

type RouteParams = { params: Promise<{ flowId: string; variableId: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { flowId, variableId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const variable = await prisma.variable.findFirst({
    where: { id: variableId, flowId, flow: { userId: session.user.id } },
  })
  if (!variable) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.variable.delete({ where: { id: variableId } })
  return NextResponse.json({ success: true })
}
