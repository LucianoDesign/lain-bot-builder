import { create } from "zustand"

interface UIStore {
  selectedNodeId: string | null
  isConfigPanelOpen: boolean
  isVariablesPanelOpen: boolean

  selectNode: (id: string | null) => void
  openConfigPanel: () => void
  closeConfigPanel: () => void
  toggleVariablesPanel: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedNodeId: null,
  isConfigPanelOpen: false,
  isVariablesPanelOpen: false,

  selectNode: (id) =>
    set({ selectedNodeId: id, isConfigPanelOpen: id !== null }),

  openConfigPanel: () => set({ isConfigPanelOpen: true }),
  closeConfigPanel: () => set({ isConfigPanelOpen: false, selectedNodeId: null }),
  toggleVariablesPanel: () =>
    set((state) => ({ isVariablesPanelOpen: !state.isVariablesPanelOpen })),
}))
