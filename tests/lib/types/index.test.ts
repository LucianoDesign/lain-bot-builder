import { describe, expect, it } from "vitest"
import { dbEdgesToRF, dbNodesToRF, type DbFlowEdge, type DbFlowNode } from "@/lib/types"

describe("dbNodesToRF", () => {
  it("convierte posicion correctamente para nodos normales", () => {
    const dbNodes: DbFlowNode[] = [
      {
        id: "node-1",
        flowId: "flow-1",
        type: "message",
        positionX: 120,
        positionY: 80,
        data: { text: "hola" },
        createdAt: new Date("2026-01-01"),
      },
    ]

    const [node] = dbNodesToRF(dbNodes)

    expect(node.position).toEqual({ x: 120, y: 80 })
  })

  it("aplica style width/height para sticky_note con dimensiones", () => {
    const dbNodes: DbFlowNode[] = [
      {
        id: "sticky-1",
        flowId: "flow-1",
        type: "sticky_note",
        positionX: 0,
        positionY: 0,
        data: { text: "note", width: 320, height: 180 },
        createdAt: new Date("2026-01-01"),
      },
    ]

    const [node] = dbNodesToRF(dbNodes)

    expect(node.style).toEqual({ width: 320, height: 180 })
  })

  it("aplica dimensiones default para sticky_note sin width/height", () => {
    const dbNodes: DbFlowNode[] = [
      {
        id: "sticky-2",
        flowId: "flow-1",
        type: "sticky_note",
        positionX: 0,
        positionY: 0,
        data: { text: "note" },
        createdAt: new Date("2026-01-01"),
      },
    ]

    const [node] = dbNodesToRF(dbNodes)

    expect(node.style).toEqual({ width: 208, height: 120 })
  })

  it("no aplica style a nodos no sticky_note", () => {
    const dbNodes: DbFlowNode[] = [
      {
        id: "message-1",
        flowId: "flow-1",
        type: "message",
        positionX: 0,
        positionY: 0,
        data: { text: "x", width: 900, height: 900 },
        createdAt: new Date("2026-01-01"),
      },
    ]

    const [node] = dbNodesToRF(dbNodes)

    expect(node.style).toBeUndefined()
  })
})

describe("dbEdgesToRF", () => {
  it("mapea sourceHandle null a undefined", () => {
    const dbEdges: DbFlowEdge[] = [
      {
        id: "edge-1",
        flowId: "flow-1",
        sourceNodeId: "node-1",
        targetNodeId: "node-2",
        sourceHandle: null,
        label: "yes",
        createdAt: new Date("2026-01-01"),
      },
    ]

    const [edge] = dbEdgesToRF(dbEdges)

    expect(edge.sourceHandle).toBeUndefined()
  })

  it("mapea label null a undefined", () => {
    const dbEdges: DbFlowEdge[] = [
      {
        id: "edge-2",
        flowId: "flow-1",
        sourceNodeId: "node-1",
        targetNodeId: "node-2",
        sourceHandle: "h1",
        label: null,
        createdAt: new Date("2026-01-01"),
      },
    ]

    const [edge] = dbEdgesToRF(dbEdges)

    expect(edge.label).toBeUndefined()
  })
})
