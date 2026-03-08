/// <reference types="@testing-library/jest-dom/vitest" />
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NodeConfigPanel } from "@/components/builder/NodeConfigPanel";
import { useFlowStore } from "@/lib/store/flow-store";
import { useUIStore } from "@/lib/store/ui-store";
import { useVariablesStore } from "@/lib/store/variables-store";
import type { AppNode } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  deleteElements: vi.fn(),
}));

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    useReactFlow: () => ({ deleteElements: mocks.deleteElements }),
  };
});

function baseNode(overrides: Partial<AppNode>): AppNode {
  return {
    id: "node-1",
    type: "message",
    position: { x: 0, y: 0 },
    data: {},
    ...overrides,
  } as AppNode;
}

function renderPanel(node: AppNode) {
  const updateNodeData = vi.fn();
  const pushSnapshot = vi.fn();
  const closeConfigPanel = vi.fn();

  useUIStore.setState(
    {
      selectedNodeId: node.id,
      isConfigPanelOpen: true,
      closeConfigPanel,
    },
    false,
  );

  useFlowStore.setState(
    {
      nodes: [node],
      updateNodeData,
      pushSnapshot,
    },
    false,
  );

  useVariablesStore.setState(
    {
      variables: [
        {
          id: "var-1",
          flowId: "flow-1",
          name: "name",
          type: "string",
          defaultValue: null,
          isSystem: false,
        },
      ],
    },
    false,
  );

  render(<NodeConfigPanel />);

  return { updateNodeData, pushSnapshot, closeConfigPanel };
}

describe("NodeConfigPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState(useUIStore.getInitialState(), true);
    useFlowStore.setState(useFlowStore.getInitialState(), true);
    useVariablesStore.setState(useVariablesStore.getInitialState(), true);
  });

  it("muestra config de message", () => {
    renderPanel(
      baseNode({
        type: "message",
        data: { content: [{ type: "text", text: "hi" }] },
      }),
    );

    expect(screen.getByText("Message text")).toBeInTheDocument();
  });

  it("muestra config de text_input con campos esperados", () => {
    renderPanel(
      baseNode({
        type: "text_input",
        data: { question: "Q", placeholder: "P", variableId: "var-1" },
      }),
    );

    expect(screen.getByText("Question to ask")).toBeInTheDocument();
    expect(screen.getByText("Placeholder")).toBeInTheDocument();
    expect(screen.getByText("Save answer to variable")).toBeInTheDocument();
  });

  it("choice_input permite Add choice y llama updateNodeData", () => {
    const { updateNodeData } = renderPanel(
      baseNode({ type: "choice_input", data: { question: "Q", choices: [] } }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Add choice/i }));

    expect(updateNodeData).toHaveBeenCalledTimes(1);
    const payload = updateNodeData.mock.calls[0]?.[1] as {
      choices: Array<{ id: string; label: string }>;
    };
    expect(payload.choices).toHaveLength(1);
  });

  it("choice_input permite eliminar un choice sin afectar los demas", () => {
    const { updateNodeData } = renderPanel(
      baseNode({
        type: "choice_input",
        data: {
          question: "Q",
          choices: [
            { id: "c1", label: "A" },
            { id: "c2", label: "B" },
          ],
        },
      }),
    );

    const firstChoiceInput = screen.getByDisplayValue("A");
    const removeBtn = firstChoiceInput.parentElement?.querySelector(
      "button",
    ) as HTMLButtonElement;
    fireEvent.click(removeBtn);

    const payload = updateNodeData.mock.calls[0]?.[1] as {
      choices: Array<{ id: string; label: string }>;
    };
    expect(payload.choices).toEqual([{ id: "c2", label: "B" }]);
  });

  it("condition oculta Value para operador is_set", () => {
    renderPanel(baseNode({ type: "condition", data: { operator: "is_set" } }));

    expect(screen.queryByText("Value")).not.toBeInTheDocument();
  });

  it("condition muestra Value para otros operadores", () => {
    renderPanel(baseNode({ type: "condition", data: { operator: "eq" } }));

    expect(screen.getByText("Value")).toBeInTheDocument();
  });

  it("set_variable muestra selector y campo Value", () => {
    renderPanel(
      baseNode({
        type: "set_variable",
        data: { variableId: "var-1", value: "x" },
      }),
    );

    expect(screen.getByText("Variable to set")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
  });

  it("Delete node llama deleteElements y cierra panel", () => {
    const { pushSnapshot, closeConfigPanel } = renderPanel(
      baseNode({ type: "message", data: {} }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Delete node/i }));

    expect(pushSnapshot).toHaveBeenCalledTimes(1);
    expect(mocks.deleteElements).toHaveBeenCalledWith({
      nodes: [{ id: "node-1" }],
    });
    expect(closeConfigPanel).toHaveBeenCalledTimes(1);
  });

  it("sticky_note muestra mensaje de editar inline", () => {
    renderPanel(baseNode({ type: "sticky_note", data: {} }));

    expect(
      screen.getByText(/Edit text directly on the note in the canvas/i),
    ).toBeInTheDocument();
  });

  it("start muestra la webhook URL", () => {
    useFlowStore.setState({ flowId: "flow-123", flowSettings: { schema: "chatwoot_wp" } }, false);
    renderPanel(baseNode({ type: "start", data: {} }));
    expect(screen.getByText("Webhook URL")).toBeInTheDocument();
  });

  it("end muestra mensaje de no configurable", () => {
    renderPanel(baseNode({ type: "end", data: {} }));
    expect(screen.getByText(/no configurable properties/i)).toBeInTheDocument();
  });
});
