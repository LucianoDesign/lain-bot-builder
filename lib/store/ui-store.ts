import { create } from "zustand"
import type { AppNode } from "@/lib/types"

interface ClipboardNode {
  type: AppNode["type"]
  data: AppNode["data"]
  style?: React.CSSProperties
}

interface UIStore {
  selectedNodeId: string | null
  isConfigPanelOpen: boolean
  isVariablesPanelOpen: boolean
  isFlowSettingsPanelOpen: boolean
  hoveredEdgeId: string | null
  clipboard: ClipboardNode | null

  selectNode: (id: string | null) => void
  openConfigPanel: () => void
  closeConfigPanel: () => void
  toggleVariablesPanel: () => void
  toggleFlowSettingsPanel: () => void
  setHoveredEdgeId: (id: string | null) => void
  setClipboard: (node: ClipboardNode | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedNodeId: null,
  isConfigPanelOpen: false,
  isVariablesPanelOpen: false,
  isFlowSettingsPanelOpen: false,
  hoveredEdgeId: null,
  clipboard: null,

  selectNode: (id) =>
    set({ selectedNodeId: id, isConfigPanelOpen: id !== null }),

  openConfigPanel: () => set({ isConfigPanelOpen: true }),
  closeConfigPanel: () => set({ isConfigPanelOpen: false, selectedNodeId: null }),
  toggleVariablesPanel: () =>
    set((state) => ({ isVariablesPanelOpen: !state.isVariablesPanelOpen })),
  toggleFlowSettingsPanel: () =>
    set((state) => ({ isFlowSettingsPanelOpen: !state.isFlowSettingsPanelOpen })),
  setHoveredEdgeId: (hoveredEdgeId) => set({ hoveredEdgeId }),
  setClipboard: (clipboard) => set({ clipboard }),
}))
