import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

function ToolbarSkeleton() {
  return (
    <header className="flex h-12 items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4">
      {/* Back arrow */}
      <Skeleton className="h-4 w-4 bg-zinc-800" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-3 w-3 bg-zinc-800" />
        <Skeleton className="h-3 w-8 bg-zinc-800" />
        <Skeleton className="h-3 w-3 bg-zinc-800" />
        <Skeleton className="h-4 w-28 bg-zinc-800" />
      </div>

      <Separator orientation="vertical" className="h-5 bg-zinc-800" />

      {/* Undo / Redo */}
      <Skeleton className="h-7 w-7 bg-zinc-800" />
      <Skeleton className="h-7 w-7 bg-zinc-800" />

      <Separator orientation="vertical" className="h-5 bg-zinc-800" />

      {/* Variables + Settings */}
      <Skeleton className="h-7 w-20 bg-zinc-800" />
      <Skeleton className="h-7 w-20 bg-zinc-800" />

      <div className="flex-1" />

      {/* Publish button + badge */}
      <Skeleton className="h-7 w-20 bg-zinc-800" />
      <Skeleton className="h-5 w-14 rounded-full bg-zinc-800" />
    </header>
  )
}

function SidebarSkeleton() {
  return (
    <aside className="flex w-52 flex-col border-r border-zinc-800 bg-zinc-900">
      <div className="px-4 py-3">
        <Skeleton className="h-3 w-10 bg-zinc-800" />
      </div>
      <Separator className="bg-zinc-800" />
      <div className="flex-1 p-2 space-y-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-md border border-zinc-800 px-2.5 py-2"
          >
            <Skeleton className="h-5 w-5 shrink-0 bg-zinc-800" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-16 bg-zinc-800" />
              <Skeleton className="h-2.5 w-24 bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function CanvasSkeleton() {
  return (
    <div className="flex-1 overflow-hidden bg-zinc-950">
      <Skeleton className="h-full w-full rounded-none bg-zinc-900/40" />
    </div>
  )
}

export default function BuilderLoading() {
  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <ToolbarSkeleton />
      <div className="flex flex-1 overflow-hidden">
        <SidebarSkeleton />
        <CanvasSkeleton />
      </div>
    </div>
  )
}
