import { beforeEach, describe, expect, it, vi } from "vitest"
import { useFlowStore } from "./flow-store"
import type { AppEdge, AppNode } from "@/lib/types"

function node(id: string, x = 0, y = 0): AppNode {
  return {
    id,
    type: "message",
    position: { x, y },
    data: { text: id },
  } as AppNode
}

function edge(id: string, source = "a", target = "b"): AppEdge {
  return {
    id,
    source,
    target,
  } as AppEdge
}

describe("useFlowStore", () => {
  beforeEach(() => {
    useFlowStore.setState(useFlowStore.getInitialState(), true)
  })

  it("pushSnapshot guarda estado actual y limpia future", () => {
    useFlowStore.setState({
      nodes: [node("n1")],
      edges: [edge("e1")],
      future: [{ nodes: [node("f1")], edges: [] }],
    })

    useFlowStore.getState().pushSnapshot()

    const state = useFlowStore.getState()
    expect(state.history).toHaveLength(1)
    expect(state.history[0]).toEqual({ nodes: [node("n1")], edges: [edge("e1")] })
    expect(state.future).toEqual([])
  })

  it("pushSnapshot no guarda mas de 30 entradas", () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      nodes: [node(`h${i}`)],
      edges: [],
    }))

    useFlowStore.setState({ history, nodes: [node("current")], edges: [] })

    useFlowStore.getState().pushSnapshot()

    const state = useFlowStore.getState()
    expect(state.history).toHaveLength(30)
    expect(state.history[0]?.nodes[0]?.id).toBe("h1")
    expect(state.history[29]?.nodes[0]?.id).toBe("current")
  })

  it("undo mueve actual a future y restaura ultimo history", () => {
    useFlowStore.setState({
      nodes: [node("now")],
      edges: [edge("now-edge")],
      history: [{ nodes: [node("prev")], edges: [edge("prev-edge")] }],
      future: [],
    })

    useFlowStore.getState().undo()

    const state = useFlowStore.getState()
    expect(state.nodes[0]?.id).toBe("prev")
    expect(state.edges[0]?.id).toBe("prev-edge")
    expect(state.history).toHaveLength(0)
    expect(state.future[0]?.nodes[0]?.id).toBe("now")
  })

  it("undo no hace nada si history esta vacio", () => {
    useFlowStore.setState({ nodes: [node("n1")], edges: [edge("e1")], history: [] })

    useFlowStore.getState().undo()

    const state = useFlowStore.getState()
    expect(state.nodes[0]?.id).toBe("n1")
    expect(state.edges[0]?.id).toBe("e1")
    expect(state.future).toHaveLength(0)
  })

  it("redo mueve actual a history y restaura primer future", () => {
    useFlowStore.setState({
      nodes: [node("now")],
      edges: [edge("now-edge")],
      history: [],
      future: [{ nodes: [node("next")], edges: [edge("next-edge")] }],
    })

    useFlowStore.getState().redo()

    const state = useFlowStore.getState()
    expect(state.nodes[0]?.id).toBe("next")
    expect(state.edges[0]?.id).toBe("next-edge")
    expect(state.history[0]?.nodes[0]?.id).toBe("now")
    expect(state.future).toHaveLength(0)
  })

  it("redo no hace nada si future esta vacio", () => {
    useFlowStore.setState({ nodes: [node("n1")], future: [] })

    useFlowStore.getState().redo()

    expect(useFlowStore.getState().nodes[0]?.id).toBe("n1")
  })

  it("redo se limpia al hacer pushSnapshot", () => {
    useFlowStore.setState({
      nodes: [node("n1")],
      future: [{ nodes: [node("f1")], edges: [] }],
    })

    useFlowStore.getState().pushSnapshot()

    expect(useFlowStore.getState().future).toEqual([])
  })

  it("updateNodeData llama pushSnapshot antes de modificar", () => {
    const calls: string[] = []
    const snapshotSpy = vi.fn(() => {
      calls.push(`snapshot:${(useFlowStore.getState().nodes[0]?.data as { text?: string }).text}`)
    })

    useFlowStore.setState({
      nodes: [node("n1")],
      pushSnapshot: snapshotSpy,
    })

    useFlowStore.getState().updateNodeData("n1", { text: "updated" })

    expect(snapshotSpy).toHaveBeenCalledTimes(1)
    expect(calls[0]).toBe("snapshot:n1")
    expect((useFlowStore.getState().nodes[0]?.data as { text?: string }).text).toBe("updated")
  })

  it("onConnect llama pushSnapshot antes de agregar edge", () => {
    const observedEdgesLength: number[] = []
    const snapshotSpy = vi.fn(() => {
      observedEdgesLength.push(useFlowStore.getState().edges.length)
    })

    useFlowStore.setState({ edges: [], pushSnapshot: snapshotSpy })

    useFlowStore
      .getState()
      .onConnect({ source: "a", target: "b", sourceHandle: null, targetHandle: null })

    expect(snapshotSpy).toHaveBeenCalledTimes(1)
    expect(observedEdgesLength[0]).toBe(0)
    expect(useFlowStore.getState().edges).toHaveLength(1)
  })

  it("onNodesChange remove llama pushSnapshot", () => {
    const snapshotSpy = vi.fn()
    useFlowStore.setState({ nodes: [node("n1")], pushSnapshot: snapshotSpy })

    useFlowStore.getState().onNodesChange([{ id: "n1", type: "remove" } as never])

    expect(snapshotSpy).toHaveBeenCalledTimes(1)
  })

  it("onNodesChange position final llama pushSnapshot", () => {
    const snapshotSpy = vi.fn()
    useFlowStore.setState({ nodes: [node("n1")], pushSnapshot: snapshotSpy })

    useFlowStore.getState().onNodesChange([
      {
        id: "n1",
        type: "position",
        position: { x: 20, y: 30 },
        dragging: false,
      } as never,
    ])

    expect(snapshotSpy).toHaveBeenCalledTimes(1)
  })

  it("onNodesChange position dragging=true NO llama pushSnapshot", () => {
    const snapshotSpy = vi.fn()
    useFlowStore.setState({ nodes: [node("n1")], pushSnapshot: snapshotSpy })

    useFlowStore.getState().onNodesChange([
      {
        id: "n1",
        type: "position",
        position: { x: 20, y: 30 },
        dragging: true,
      } as never,
    ])

    expect(snapshotSpy).not.toHaveBeenCalled()
  })
})