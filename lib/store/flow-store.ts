import { create } from "zustand"
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react"
import type { AppNode, AppEdge, SaveStatus } from "@/lib/types"

interface HistoryEntry {
  nodes: AppNode[]
  edges: AppEdge[]
}

interface FlowStore {
  // React Flow state
  nodes: AppNode[]
  edges: AppEdge[]
  // Save status
  saveStatus: SaveStatus
  // Tracking for auto-save
  isDirty: boolean
  // Undo/Redo
  history: HistoryEntry[]
  future: HistoryEntry[]

  // Actions
  setNodes: (nodes: AppNode[]) => void
  setEdges: (edges: AppEdge[]) => void
  onNodesChange: (changes: NodeChange<AppNode>[]) => void
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void
  onConnect: (connection: Connection) => void
  updateNodeData: (nodeId: string, data: Partial<AppNode["data"]>) => void
  setSaveStatus: (status: SaveStatus) => void
  markClean: () => void
  pushSnapshot: () => void
  undo: () => void
  redo: () => void
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  nodes: [],
  edges: [],
  saveStatus: "idle",
  isDirty: false,
  history: [],
  future: [],

  setNodes: (nodes) => set({ nodes, isDirty: false }),
  setEdges: (edges) => set({ edges, isDirty: false }),

  pushSnapshot: () => {
    const { nodes, edges, history } = get()
    set({
      history: [...history.slice(-29), { nodes: [...nodes], edges: [...edges] }],
      future: [],
    })
  },

  onNodesChange: (changes) => {
    const hasRemove = changes.some((c) => c.type === "remove")
    const hasFinalMove = changes.some(
      (c) => c.type === "position" && c.dragging === false
    )
    if (hasRemove || hasFinalMove) get().pushSnapshot()

    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as AppNode[],
      isDirty: true,
    }))
  },

  onEdgesChange: (changes) => {
    if (changes.some((c) => c.type === "remove")) get().pushSnapshot()
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges) as AppEdge[],
      isDirty: true,
    }))
  },

  onConnect: (connection) => {
    get().pushSnapshot()
    set((state) => ({
      edges: addEdge(connection, state.edges) as AppEdge[],
      isDirty: true,
    }))
  },

  updateNodeData: (nodeId, data) => {
    get().pushSnapshot()
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
      isDirty: true,
    }))
  },

  setSaveStatus: (saveStatus) => set({ saveStatus }),
  markClean: () => set({ isDirty: false }),

  undo: () => {
    const { nodes, edges, history, future } = get()
    if (history.length === 0) return
    const prev = history[history.length - 1]
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      history: history.slice(0, -1),
      future: [{ nodes, edges }, ...future],
      isDirty: true,
    })
  },

  redo: () => {
    const { nodes, edges, history, future } = get()
    if (future.length === 0) return
    const next = future[0]
    set({
      nodes: next.nodes,
      edges: next.edges,
      history: [...history, { nodes, edges }],
      future: future.slice(1),
      isDirty: true,
    })
  },
}))
