import { describe, expect, it } from "vitest"
import { dbEdgesToRF, dbNodesToRF, type DbFlowEdge, type DbFlowNode } from "./index"

describe("dbNodesToRF", () => {
  it("maps db nodes to react flow nodes", () => {
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

    const nodes = dbNodesToRF(dbNodes)

    expect(nodes).toEqual([
      {
        id: "node-1",
        type: "message",
        position: { x: 120, y: 80 },
        data: { text: "hola" },
      },
    ])
  })

  it("uses empty object when node data is null", () => {
    const dbNodes: DbFlowNode[] = [
      {
        id: "node-2",
        flowId: "flow-1",
        type: "start",
        positionX: 0,
        positionY: 0,
        data: null,
        createdAt: new Date("2026-01-01"),
      },
    ]

    const [node] = dbNodesToRF(dbNodes)

    expect(node.data).toEqual({})
  })
})

describe("dbEdgesToRF", () => {
  it("maps db edges to react flow edges", () => {
    const dbEdges: DbFlowEdge[] = [
      {
        id: "edge-1",
        flowId: "flow-1",
        sourceNodeId: "node-1",
        targetNodeId: "node-2",
        sourceHandle: "a",
        label: "yes",
        createdAt: new Date("2026-01-01"),
      },
    ]

    const edges = dbEdgesToRF(dbEdges)

    expect(edges).toEqual([
      {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        sourceHandle: "a",
        label: "yes",
      },
    ])
  })

  it("converts null optional fields to undefined", () => {
    const dbEdges: DbFlowEdge[] = [
      {
        id: "edge-2",
        flowId: "flow-1",
        sourceNodeId: "node-1",
        targetNodeId: "node-2",
        sourceHandle: null,
        label: null,
        createdAt: new Date("2026-01-01"),
      },
    ]

    const [edge] = dbEdgesToRF(dbEdges)

    expect(edge.sourceHandle).toBeUndefined()
    expect(edge.label).toBeUndefined()
  })
})