import { auth } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { BuilderClient } from "@/components/builder/BuilderClient"

interface BuilderPageProps {
  params: Promise<{ flowId: string }>
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { flowId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const flow = await prisma.flow.findFirst({
    where: { id: flowId, userId: session.user.id },
    include: { nodes: true, edges: true, variables: true },
  })

  if (!flow) redirect("/")

  return <BuilderClient flow={flow} />
}
