/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { InvalidInputNode } from "@/components/nodes/InvalidInputNode";

vi.mock("@xyflow/react", () => ({
  Handle: (props: { type: string; id?: string; position: string }) => (
    <div
      data-testid={`handle-${props.type}-${props.id ?? "none"}`}
      data-handle-id={props.id ?? ""}
      data-position={props.position}
    />
  ),
  Position: {
    Bottom: "bottom",
    Top: "top",
  },
}));

const baseProps: Record<string, unknown> = {
  id: "invalid-1",
  type: "invalid_input",
  data: {},
  selected: false,
  dragging: false,
  zIndex: 0,
  selectable: true,
  deletable: true,
  draggable: true,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
};

describe("InvalidInputNode", () => {
  it('renderiza el label "Invalid Input"', () => {
    render(<InvalidInputNode {...(baseProps as never)} />);

    expect(screen.getByText("Invalid Input")).toBeInTheDocument();
  });

  it('renderiza el texto "Fires when input validation fails"', () => {
    render(<InvalidInputNode {...(baseProps as never)} />);

    expect(screen.getByText("Fires when input validation fails")).toBeInTheDocument();
  });

  it("tiene handle de entrada (target) en la parte superior", () => {
    render(<InvalidInputNode {...(baseProps as never)} />);

    const targetHandle = screen.getByTestId("handle-target-invalid");
    expect(targetHandle).toBeInTheDocument();
    expect(targetHandle).toHaveAttribute("data-position", "top");
  });

  it("tiene handle de salida (source) en la parte inferior", () => {
    render(<InvalidInputNode {...(baseProps as never)} />);

    const sourceHandle = screen.getByTestId("handle-source-none");
    expect(sourceHandle).toBeInTheDocument();
    expect(sourceHandle).toHaveAttribute("data-position", "bottom");
  });

  it('el handle de entrada tiene id="invalid"', () => {
    render(<InvalidInputNode {...(baseProps as never)} />);

    expect(screen.getByTestId("handle-target-invalid")).toHaveAttribute("data-handle-id", "invalid");
  });
});
