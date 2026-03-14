/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { TextInputNode } from "@/components/nodes/TextInputNode";

vi.mock("@xyflow/react", () => ({
  Handle: (props: { type: string; id?: string }) => (
    <div data-testid={`handle-${props.type}-${props.id ?? "none"}`} data-handle-id={props.id ?? ""} />
  ),
  Position: {
    Bottom: "bottom",
    Top: "top",
  },
}));

const baseProps: Record<string, unknown> = {
  id: "text-1",
  type: "text_input",
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

function renderNode(data: Record<string, unknown>) {
  return render(<TextInputNode {...(baseProps as never)} data={data} />);
}

describe("TextInputNode", () => {
  it("sin validacion renderiza un solo handle source", () => {
    renderNode({ question: "Tu nombre" });

    expect(screen.getAllByTestId(/handle-source-/i)).toHaveLength(1);
    expect(screen.queryByTestId("handle-source-default")).not.toBeInTheDocument();
    expect(screen.queryByTestId("handle-source-invalid")).not.toBeInTheDocument();
  });

  it("con validacion renderiza dos handles source: default e invalid", () => {
    renderNode({ question: "Email", validation: { type: "email" } });

    expect(screen.getByTestId("handle-source-default")).toBeInTheDocument();
    expect(screen.getByTestId("handle-source-invalid")).toBeInTheDocument();
  });

  it("con validacion muestra etiqueta del tipo de validacion activo", () => {
    renderNode({ question: "Email", validation: { type: "email" } });

    const validationBadge = screen
      .getAllByText(/email/i)
      .find((el) => el.className.includes("text-amber-500"));

    expect(validationBadge).toBeDefined();
  });

  it('con validacion muestra etiquetas "Valid" e "Invalid"', () => {
    renderNode({ question: "Email", validation: { type: "email" } });

    expect(screen.getByText("Valid")).toBeInTheDocument();
    expect(screen.getByText("Invalid")).toBeInTheDocument();
  });

  it("sin validacion no muestra etiquetas de valid/invalid ni badge", () => {
    renderNode({ question: "Nombre" });

    expect(screen.queryByText("Valid")).not.toBeInTheDocument();
    expect(screen.queryByText("Invalid")).not.toBeInTheDocument();
    expect(screen.queryByText(/email|number|regex|url|phone/i)).not.toBeInTheDocument();
  });

  it("muestra la pregunta configurada", () => {
    renderNode({ question: "Como te llamas?" });

    expect(screen.getByText("Como te llamas?")).toBeInTheDocument();
  });

  it("si no hay pregunta, muestra texto en cursiva", () => {
    renderNode({});

    const fallback = screen.getByText("No question set");
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveClass("italic");
  });
});
