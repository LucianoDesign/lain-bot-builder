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

interface FlowStore {
  // React Flow state
  nodes: AppNode[]
  edges: AppEdge[]
  // Save status
  saveStatus: SaveStatus
  // Tracking for auto-save
  isDirty: boolean

  // Actions
  setNodes: (nodes: AppNode[]) => void
  setEdges: (edges: AppEdge[]) => void
  onNodesChange: (changes: NodeChange<AppNode>[]) => void
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void
  onConnect: (connection: Connection) => void
  updateNodeData: (nodeId: string, data: Partial<AppNode["data"]>) => void
  setSaveStatus: (status: SaveStatus) => void
  markClean: () => void
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  nodes: [],
  edges: [],
  saveStatus: "idle",
  isDirty: false,

  setNodes: (nodes) => set({ nodes, isDirty: false }),
  setEdges: (edges) => set({ edges, isDirty: false }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as AppNode[],
      isDirty: true,
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges) as AppEdge[],
      isDirty: true,
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(connection, state.edges) as AppEdge[],
      isDirty: true,
    })),

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
      isDirty: true,
    })),

  setSaveStatus: (saveStatus) => set({ saveStatus }),
  markClean: () => set({ isDirty: false }),
}))
