import { beforeEach, describe, expect, it } from "vitest"
import { useUIStore } from "./ui-store"

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState(useUIStore.getInitialState(), true)
  })

  it("setClipboard guarda nodo copiado", () => {
    useUIStore.getState().setClipboard({ type: "message", data: { text: "hola" } })

    expect(useUIStore.getState().clipboard).toEqual({ type: "message", data: { text: "hola" } })
  })

  it("setClipboard(null) limpia el clipboard", () => {
    useUIStore.setState({ clipboard: { type: "message", data: { text: "x" } } })

    useUIStore.getState().setClipboard(null)

    expect(useUIStore.getState().clipboard).toBeNull()
  })

  it("setHoveredEdgeId actualiza el edge hover", () => {
    useUIStore.getState().setHoveredEdgeId("edge-1")

    expect(useUIStore.getState().hoveredEdgeId).toBe("edge-1")
  })

  it("selectNode con id abre config panel", () => {
    useUIStore.getState().selectNode("node-1")

    expect(useUIStore.getState().selectedNodeId).toBe("node-1")
    expect(useUIStore.getState().isConfigPanelOpen).toBe(true)
  })

  it("selectNode(null) cierra panel y limpia selectedNodeId", () => {
    useUIStore.setState({ selectedNodeId: "node-1", isConfigPanelOpen: true })

    useUIStore.getState().selectNode(null)

    expect(useUIStore.getState().selectedNodeId).toBeNull()
    expect(useUIStore.getState().isConfigPanelOpen).toBe(false)
  })

  it("closeConfigPanel limpia selectedNodeId y cierra panel", () => {
    useUIStore.setState({ selectedNodeId: "node-2", isConfigPanelOpen: true })

    useUIStore.getState().closeConfigPanel()

    expect(useUIStore.getState().selectedNodeId).toBeNull()
    expect(useUIStore.getState().isConfigPanelOpen).toBe(false)
  })
})