import { describe, expect, it } from "vitest";
import {
  createFlowSchema,
  toFlowEdgeRows,
  toFlowNodeRows,
  updateFlowSchema,
} from "./contracts";
import type { AppEdge, AppNode } from "../types";

describe("flow contracts", () => {
  it("applies default flow name", () => {
    const parsed = createFlowSchema.parse({});

    expect(parsed.name).toBe("Untitled Flow");
  });

  it("rejects invalid update payload", () => {
    const result = updateFlowSchema.safeParse({ name: "" });

    expect(result.success).toBe(false);
  });

  it("rejects malformed nodes in update payload", () => {
    const result = updateFlowSchema.safeParse({
      nodes: [{ id: "n1", type: "message", position: { x: "bad", y: 1 } }],
      edges: [],
    });

    expect(result.success).toBe(false);
  });

  it("maps app nodes to DB row shape", () => {
    const nodes = [
      {
        id: "n1",
        type: "message",
        position: { x: 100, y: 200 },
        data: { text: "hi" },
      },
    ] as AppNode[];

    const rows = toFlowNodeRows("flow-1", nodes);

    expect(rows).toEqual([
      {
        id: "n1",
        flowId: "flow-1",
        type: "message",
        positionX: 100,
        positionY: 200,
        data: { text: "hi" },
      },
    ]);
  });

  it("maps app edges to DB row shape and normalizes labels", () => {
    const edges = [
      {
        id: "e1",
        source: "n1",
        target: "n2",
        sourceHandle: undefined,
        label: "next",
      },
    ] as AppEdge[];

    const rows = toFlowEdgeRows("flow-1", edges);

    expect(rows).toEqual([
      {
        id: "e1",
        flowId: "flow-1",
        sourceNodeId: "n1",
        targetNodeId: "n2",
        sourceHandle: null,
        label: "next",
      },
    ]);
  });
});
