/// <reference types="@testing-library/jest-dom/vitest" />
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StartNode } from "@/components/nodes/StartNode";
import { useFlowStore } from "@/lib/store/flow-store";

vi.mock("@xyflow/react", () => ({
  Handle: (props: { type: string; id?: string }) => (
    <div data-testid={`handle-${props.type}`} data-handle-id={props.id ?? ""} />
  ),
  Position: {
    Bottom: "bottom",
    Top: "top",
  },
}));

const baseProps: Record<string, unknown> = {
  id: "start-1",
  type: "start",
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

function renderNode() {
  return render(<StartNode {...(baseProps as never)} />);
}

describe("StartNode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFlowStore.setState(useFlowStore.getInitialState(), true);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn(),
      },
    });
  });

  it('renderiza el label "Start"', () => {
    renderNode();

    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("muestra URL webhook con flowId y schema del store", () => {
    useFlowStore.setState({
      flowId: "flow-123",
      flowSettings: { schema: "custom_schema" },
    });

    renderNode();

    expect(
      screen.getByText("https://back-bot.lain.ar?flowId=flow-123&schema=custom_schema"),
    ).toBeInTheDocument();
  });

  it("usa schema por defecto chatwoot_wp cuando no hay schema", () => {
    useFlowStore.setState({
      flowId: "flow-123",
      flowSettings: {},
    });

    renderNode();

    expect(
      screen.getByText("https://back-bot.lain.ar?flowId=flow-123&schema=chatwoot_wp"),
    ).toBeInTheDocument();
  });

  it("actualiza la URL cuando cambia flowSettings.schema", () => {
    useFlowStore.setState({
      flowId: "flow-123",
      flowSettings: { schema: "schema_a" },
    });

    renderNode();

    expect(
      screen.getByText("https://back-bot.lain.ar?flowId=flow-123&schema=schema_a"),
    ).toBeInTheDocument();

    act(() => {
      useFlowStore.setState({ flowSettings: { schema: "schema_b" } });
    });

    expect(
      screen.getByText("https://back-bot.lain.ar?flowId=flow-123&schema=schema_b"),
    ).toBeInTheDocument();
  });

  it("clic en copy llama navigator.clipboard.writeText con URL correcta", () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    useFlowStore.setState({
      flowId: "flow-copy",
      flowSettings: { schema: "chatwoot_wp" },
    });

    renderNode();

    fireEvent.click(screen.getByTitle("Copy webhook URL"));

    expect(writeText).toHaveBeenCalledWith(
      "https://back-bot.lain.ar?flowId=flow-copy&schema=chatwoot_wp",
    );
  });

  it("muestra icono check tras copiar y vuelve a copy despues de 2s", () => {
    vi.useFakeTimers();

    renderNode();

    const copyButton = screen.getByTitle("Copy webhook URL");

    expect(copyButton.querySelector("svg.text-emerald-400")).not.toBeInTheDocument();

    fireEvent.click(copyButton);

    expect(copyButton.querySelector("svg.text-emerald-400")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(copyButton.querySelector("svg.text-emerald-400")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("el boton copy detiene propagacion del evento", () => {
    const onContainerClick = vi.fn();

    render(
      <div onClick={onContainerClick}>
        <StartNode {...(baseProps as never)} />
      </div>,
    );

    fireEvent.click(screen.getByTitle("Copy webhook URL"));

    expect(onContainerClick).not.toHaveBeenCalled();
  });
});
