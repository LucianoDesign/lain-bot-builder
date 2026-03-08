import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { z } from "zod"

type RouteParams = { params: Promise<{ flowId: string }> }

const createVariableSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Must be a valid identifier"),
  type: z.enum(["string", "number", "boolean", "array", "object"]).default("string"),
  defaultValue: z.string().nullable().optional(),
})

async function getAuthorizedFlow(flowId: string, userId: string) {
  return prisma.flow.findFirst({ where: { id: flowId, userId } })
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { flowId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const flow = await getAuthorizedFlow(flowId, session.user.id)
  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const variables = await prisma.variable.findMany({
    where: { flowId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(variables)
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { flowId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const flow = await getAuthorizedFlow(flowId, session.user.id)
  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await request.json()
  const parsed = createVariableSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const variable = await prisma.variable.create({
      data: {
        flowId,
        name: parsed.data.name,
        type: parsed.data.type,
        defaultValue: parsed.data.defaultValue ?? null,
      },
    })
    return NextResponse.json(variable, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Variable name already exists in this flow" },
      { status: 409 }
    )
  }
}
