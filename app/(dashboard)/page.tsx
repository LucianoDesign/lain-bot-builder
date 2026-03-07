import { auth } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { FlowsClient } from "@/components/dashboard/FlowsClient"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const flows = await prisma.flow.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })

  return <FlowsClient flows={flows} />
}
