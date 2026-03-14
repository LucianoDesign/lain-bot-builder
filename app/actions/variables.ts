"use server"

import { auth } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { z } from "zod"

const createVariableSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Must be a valid identifier"),
  type: z.enum(["string", "number", "boolean", "array", "object"]).default("string"),
  defaultValue: z.string().nullable().optional(),
})

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function createVariable(
  flowId: string,
  data: { name: string; type: string; defaultValue?: string | null }
) {
  const session = await getSession()
  if (!session) return { error: "Unauthorized" as const }

  const flow = await prisma.flow.findFirst({ where: { id: flowId, userId: session.user.id } })
  if (!flow) return { error: "Not found" as const }

  const parsed = createVariableSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  try {
    const variable = await prisma.variable.create({
      data: {
        flowId,
        name: parsed.data.name,
        type: parsed.data.type,
        defaultValue: parsed.data.defaultValue ?? null,
      },
    })
    return { variable }
  } catch {
    return { error: "Variable name already exists in this flow" as const }
  }
}

export async function deleteVariable(flowId: string, variableId: string) {
  const session = await getSession()
  if (!session) return { error: "Unauthorized" as const }

  const variable = await prisma.variable.findFirst({
    where: { id: variableId, flowId, flow: { userId: session.user.id } },
  })
  if (!variable) return { error: "Not found" as const }

  await prisma.variable.delete({ where: { id: variableId } })
  return { success: true }
}
