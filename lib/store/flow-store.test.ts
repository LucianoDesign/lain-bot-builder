import { beforeEach, describe, expect, it } from "vitest"
import { useFlowStore } from "./flow-store"
import type { AppNode } from "@/lib/types"

describe("useFlowStore", () => {
  beforeEach(() => {
    useFlowStore.setState({
      nodes: [],
      edges: [],
      saveStatus: "idle",
      isDirty: false,
    })
  })

  it("updates node data and marks the flow as dirty", () => {
    const node = {
      id: "n1",
      type: "message",
      position: { x: 10, y: 20 },
      data: { message: "old" },
    } as AppNode

    const store = useFlowStore.getState()
    store.setNodes([node])

    store.updateNodeData("n1", { message: "new", tone: "friendly" })

    const state = useFlowStore.getState()
    expect(state.isDirty).toBe(true)
    expect(state.nodes[0]?.data).toEqual({ message: "new", tone: "friendly" })
  })

  it("adds edge on connect and marks as dirty", () => {
    const store = useFlowStore.getState()

    store.onConnect({ source: "n1", target: "n2" })

    const state = useFlowStore.getState()
    expect(state.isDirty).toBe(true)
    expect(state.edges.length).toBe(1)
    expect(state.edges[0]?.source).toBe("n1")
    expect(state.edges[0]?.target).toBe("n2")
  })

  it("markClean resets dirty flag", () => {
    useFlowStore.setState({ isDirty: true })

    useFlowStore.getState().markClean()

    expect(useFlowStore.getState().isDirty).toBe(false)
  })
})