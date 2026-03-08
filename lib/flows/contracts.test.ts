import { describe, expect, it } from "vitest"
import {
  createFlowSchema,
  nodeTypeSchema,
  toFlowEdgeRows,
  toFlowNodeRows,
  updateFlowSchema,
} from "./contracts"
import type { AppEdge, AppNode } from "@/lib/types"

describe("flow contracts", () => {
  it("nodeTypeSchema acepta sticky_note", () => {
    expect(nodeTypeSchema.parse("sticky_note")).toBe("sticky_note")
  })

  it("nodeTypeSchema rechaza tipos invalidos", () => {
    expect(() => nodeTypeSchema.parse("unknown_type")).toThrow()
  })

  it("createFlowSchema aplica default Untitled Flow", () => {
    const parsed = createFlowSchema.parse({})
    expect(parsed.name).toBe("Untitled Flow")
  })

  it("createFlowSchema rechaza name vacio", () => {
    const result = createFlowSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("updateFlowSchema acepta nodes y edges opcionales", () => {
    const result = updateFlowSchema.safeParse({
      nodes: [{ id: "n1", type: "message", position: { x: 10, y: 20 }, data: {} }],
      edges: [{ id: "e1", source: "n1", target: "n2" }],
    })

    expect(result.success).toBe(true)
  })

  it("toFlowNodeRows mapea posicion y serializa data", () => {
    const nodes = [
      {
        id: "n1",
        type: "message",
        position: { x: 100, y: 200 },
        data: { text: "hi" },
      },
    ] as AppNode[]

    expect(toFlowNodeRows("flow-1", nodes)).toEqual([
      {
        id: "n1",
        flowId: "flow-1",
        type: "message",
        positionX: 100,
        positionY: 200,
        data: { text: "hi" },
      },
    ])
  })

  it("toFlowEdgeRows convierte sourceHandle undefined a null", () => {
    const edges = [{ id: "e1", source: "n1", target: "n2", sourceHandle: undefined }] as AppEdge[]

    expect(toFlowEdgeRows("flow-1", edges)[0]?.sourceHandle).toBeNull()
  })

  it("toFlowEdgeRows ignora labels no string", () => {
    const edges = [{ id: "e1", source: "n1", target: "n2", label: 123 }] as AppEdge[]

    expect(toFlowEdgeRows("flow-1", edges)[0]?.label).toBeNull()
  })
})