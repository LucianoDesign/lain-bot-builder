import { beforeEach, describe, expect, it } from "vitest"
import { useUIStore } from "./ui-store"

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      selectedNodeId: null,
      isConfigPanelOpen: false,
      isVariablesPanelOpen: false,
    })
  })

  it("selectNode opens config panel when node exists", () => {
    const store = useUIStore.getState()

    store.selectNode("node-1")

    const state = useUIStore.getState()
    expect(state.selectedNodeId).toBe("node-1")
    expect(state.isConfigPanelOpen).toBe(true)
  })

  it("closeConfigPanel also clears selected node", () => {
    useUIStore.setState({ selectedNodeId: "node-2", isConfigPanelOpen: true })

    useUIStore.getState().closeConfigPanel()

    const state = useUIStore.getState()
    expect(state.selectedNodeId).toBeNull()
    expect(state.isConfigPanelOpen).toBe(false)
  })

  it("toggleVariablesPanel flips panel state", () => {
    const store = useUIStore.getState()

    store.toggleVariablesPanel()
    expect(useUIStore.getState().isVariablesPanelOpen).toBe(true)

    store.toggleVariablesPanel()
    expect(useUIStore.getState().isVariablesPanelOpen).toBe(false)
  })
})