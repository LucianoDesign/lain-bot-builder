import Link from "next/link"
import { auth } from "@/app/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/dashboard/SignOutButton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { IconBolt } from "@tabler/icons-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const initials = session.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-zinc-800 bg-zinc-900">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 px-4">
          <IconBolt size={20} className="text-zinc-100" />
          <span className="font-semibold tracking-tight text-zinc-50">Lain Builder</span>
        </div>

        <Separator className="bg-zinc-800" />

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-2 pt-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            Flows
          </Link>
        </nav>

        {/* User */}
        <Separator className="bg-zinc-800" />
        <div className="flex items-center gap-3 p-4">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-zinc-700 text-xs text-zinc-200">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-200">{session.user.name}</p>
            <p className="truncate text-[11px] text-zinc-500">{session.user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
