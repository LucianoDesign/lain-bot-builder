import { fireEvent, render, screen } from "@testing-library/react";
import React, { type CSSProperties, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeletableEdge } from "./DeletableEdge";
import { useFlowStore } from "../../lib/store/flow-store";
import { useUIStore } from "../../lib/store/ui-store";

const mocks = vi.hoisted(() => ({
  deleteElements: vi.fn(),
}));

vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({ deleteElements: mocks.deleteElements }),
  getBezierPath: () => ["M0 0", 10, 20],
  BaseEdge: ({ style }: { style?: CSSProperties }) => (
    <div data-testid="base-edge" style={style} />
  ),
  EdgeLabelRenderer: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

function renderEdge(id = "edge-1") {
  return render(
    <DeletableEdge
      id={id}
      source="source-node"
      target="target-node"
      sourceX={0}
      sourceY={0}
      targetX={100}
      targetY={100}
      sourcePosition={"right" as never}
      targetPosition={"left" as never}
      {...({} as object)}
    />,
  );
}

describe("DeletableEdge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFlowStore.setState(useFlowStore.getInitialState(), true);
    useUIStore.setState(useUIStore.getInitialState(), true);
  });

  it("boton eliminar invisible cuando hoveredEdgeId no coincide", () => {
    useUIStore.setState({ hoveredEdgeId: "other-edge" });

    renderEdge("edge-1");

    const button = screen.getByRole("button", { name: "Delete connection" });
    expect(button.className).toContain("opacity-0");
  });

  it("boton eliminar visible cuando hoveredEdgeId coincide", () => {
    useUIStore.setState({ hoveredEdgeId: "edge-1" });

    renderEdge("edge-1");

    const button = screen.getByRole("button", { name: "Delete connection" });
    expect(button.className).toContain("opacity-100");
  });

  it("click en eliminar llama deleteElements y pushSnapshot", () => {
    const pushSnapshot = vi.fn();
    useUIStore.setState({ hoveredEdgeId: "edge-1" });
    useFlowStore.setState({ pushSnapshot });

    renderEdge("edge-1");

    fireEvent.click(screen.getByRole("button", { name: "Delete connection" }));

    expect(pushSnapshot).toHaveBeenCalledTimes(1);
    expect(mocks.deleteElements).toHaveBeenCalledWith({
      edges: [{ id: "edge-1" }],
    });
  });

  it("edge cambia color y grosor cuando esta en hover", () => {
    useUIStore.setState({ hoveredEdgeId: "edge-1" });

    renderEdge("edge-1");

    const baseEdge = screen.getByTestId("base-edge");
    expect((baseEdge as HTMLDivElement).style.stroke).toBe(
      "rgb(161, 161, 170)",
    );
    expect((baseEdge as HTMLDivElement).style.strokeWidth).toBe("2");
  });
});
