import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { createFlowSchema } from "@/lib/flows/contracts"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const flows = await prisma.flow.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(flows)
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = createFlowSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const flow = await prisma.flow.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
    },
  })

  return NextResponse.json(flow, { status: 201 })
}