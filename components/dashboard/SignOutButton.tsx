"use client"

import { useRouter } from "next/navigation"
import { signOut } from "@/app/lib/auth-client"
import { IconLogout } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSignOut}
      className="h-7 w-7 text-zinc-500 hover:text-zinc-200"
      title="Sign out"
    >
      <IconLogout size={15} />
    </Button>
  )
}
