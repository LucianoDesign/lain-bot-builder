"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconPlus,
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import type { DbFlow } from "@/lib/types";

interface FlowsClientProps {
  flows: DbFlow[];
}

export function FlowsClient({ flows: initialFlows }: FlowsClientProps) {
  const router = useRouter();
  const [flows, setFlows] = useState(initialFlows);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const res = await fetch("/api/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName || "Untitled Flow" }),
    });

    if (res.ok) {
      const flow = await res.json();
      setCreateOpen(false);
      setNewName("");
      router.push(`/builder/${flow.id}`);
    }

    setCreating(false);
  }

  async function handleDelete(flowId: string) {
    const res = await fetch(`/api/flows/${flowId}`, { method: "DELETE" });
    if (res.ok) {
      setFlows((prev) => prev.filter((f) => f.id !== flowId));
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Flows</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {flows.length === 0
              ? "No flows yet. Create your first one."
              : `${flows.length} flow${flows.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 bg-zinc-100 text-zinc-900 hover:bg-white"
        >
          <IconPlus size={16} />
          New flow
        </Button>
      </div>

      {/* Grid */}
      {flows.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-800">
          <div className="text-center">
            <p className="text-sm text-zinc-500">No flows yet</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-zinc-400 hover:text-zinc-200"
              onClick={() => setCreateOpen(true)}
            >
              <IconPlus size={14} className="mr-1" />
              Create your first flow
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {flows.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              onDelete={() => handleDelete(flow.id)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-50">New flow</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Flow name</Label>
              <Input
                placeholder="My awesome chatbot"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                className="text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-zinc-100 text-zinc-900 hover:bg-white"
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FlowCard({ flow, onDelete }: { flow: DbFlow; onDelete: () => void }) {
  const router = useRouter();

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="truncate font-medium text-zinc-100">{flow.name}</h3>
          {flow.description && (
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {flow.description}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-zinc-600 hover:text-zinc-300"
            >
              <IconDotsVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-zinc-700 bg-zinc-800 text-zinc-200"
          >
            <DropdownMenuItem
              onClick={() => router.push(`/builder/${flow.id}`)}
              className="gap-2 focus:bg-zinc-700"
            >
              <IconPencil size={14} />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2 text-red-400 focus:bg-zinc-700 focus:text-red-300"
            >
              <IconTrash size={14} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant={flow.isPublished ? "default" : "secondary"}
          className={
            flow.isPublished
              ? "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/50"
              : "bg-zinc-800 text-zinc-500 hover:bg-zinc-800"
          }
        >
          {flow.isPublished ? "Published" : "Draft"}
        </Badge>
        <span className="text-[11px] text-zinc-600">
          {new Date(flow.updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Click overlay */}
      <button
        onClick={() => router.push(`/builder/${flow.id}`)}
        className="absolute inset-0 rounded-xl"
        aria-label={`Open ${flow.name}`}
      />
    </div>
  );
}
