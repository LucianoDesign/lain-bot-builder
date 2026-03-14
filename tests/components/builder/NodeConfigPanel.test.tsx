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

function renderPanel(node: AppNode, options?: { syncUpdates?: boolean }) {
  const updateNodeDataSpy = vi.fn();
  const pushSnapshot = vi.fn();
  const closeConfigPanel = vi.fn();

  const updateNodeData = (nodeId: string, data: Partial<AppNode["data"]>) => {
    updateNodeDataSpy(nodeId, data);

    if (options?.syncUpdates) {
      useFlowStore.setState((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: { ...n.data, ...data },
              }
            : n,
        ),
      }));
    }
  };

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

  return { updateNodeData: updateNodeDataSpy, pushSnapshot, closeConfigPanel };
}

describe("NodeConfigPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState(useUIStore.getInitialState(), true);
    useFlowStore.setState(useFlowStore.getInitialState(), true);
    useVariablesStore.setState(useVariablesStore.getInitialState(), true);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn(),
      },
    });
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

  it("start muestra label, URL readonly y nota de Flow Settings", () => {
    useFlowStore.setState({
      flowId: "flow-123",
      flowSettings: { schema: "custom_schema" },
    });

    renderPanel(baseNode({ type: "start", data: {} }));

    expect(screen.getByText("Webhook URL")).toBeInTheDocument();

    const input = screen.getByDisplayValue(
      "https://back-bot.lain.ar?flowId=flow-123&schema=custom_schema",
    );
    expect(input).toHaveAttribute("readonly");
    expect(screen.getByText(/Flow Settings/i)).toBeInTheDocument();
  });

  it("start copia la URL al clipboard", () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    useFlowStore.setState({
      flowId: "flow-abc",
      flowSettings: { schema: "chatwoot_wp" },
    });

    renderPanel(baseNode({ type: "start", data: {} }));

    fireEvent.click(screen.getByTitle("Copy URL"));

    expect(writeText).toHaveBeenCalledWith(
      "https://back-bot.lain.ar?flowId=flow-abc&schema=chatwoot_wp",
    );
  });

  it("text_input muestra Validation con - none - por defecto", () => {
    renderPanel(baseNode({ type: "text_input", data: {} }));

    expect(screen.getByText("Validation")).toBeInTheDocument();
    const validationSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    expect(validationSelect.value).toBe("");
    const noneOption = Array.from(validationSelect.options).find((option) => option.value === "");
    expect(noneOption).toBeDefined();
  });

  it("text_input al seleccionar regex muestra Regex pattern", () => {
    const { updateNodeData } = renderPanel(
      baseNode({ type: "text_input", data: {} }),
      { syncUpdates: true },
    );

    const validationSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(validationSelect, { target: { value: "regex" } });

    expect(updateNodeData).toHaveBeenCalledWith("node-1", {
      validation: { type: "regex" },
    });
    expect(screen.getByText("Regex pattern")).toBeInTheDocument();
  });

  it("text_input con tipo no regex no muestra Regex pattern", () => {
    const { updateNodeData } = renderPanel(
      baseNode({
        type: "text_input",
        data: { validation: { type: "regex", pattern: "^[A-Z]{3}$" } },
      }),
      { syncUpdates: true },
    );

    const validationSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(validationSelect, { target: { value: "email" } });

    expect(updateNodeData).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Regex pattern")).not.toBeInTheDocument();
  });

  it("text_input con validacion muestra Error message", () => {
    renderPanel(
      baseNode({
        type: "text_input",
        data: { validation: { type: "email" } },
      }),
    );

    expect(screen.getByText("Error message (optional)")).toBeInTheDocument();
  });

  it("text_input al seleccionar - none - envia validation undefined", () => {
    const { updateNodeData } = renderPanel(
      baseNode({
        type: "text_input",
        data: { validation: { type: "email", errorMessage: "bad" } },
      }),
    );

    const validationSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(validationSelect, { target: { value: "" } });

    expect(updateNodeData).toHaveBeenCalledWith("node-1", {
      validation: undefined,
    });
  });

  it("text_input al seleccionar un tipo envia validation con type correcto", () => {
    const { updateNodeData } = renderPanel(baseNode({ type: "text_input", data: {} }));

    const validationSelect = screen.getAllByRole("combobox")[1] as HTMLSelectElement;
    fireEvent.change(validationSelect, { target: { value: "number" } });

    expect(updateNodeData).toHaveBeenCalledWith("node-1", {
      validation: { type: "number" },
    });
  });

  it("text_input al editar Regex pattern envia pattern actualizado", () => {
    const { updateNodeData } = renderPanel(
      baseNode({
        type: "text_input",
        data: { validation: { type: "regex" } },
      }),
    );

    fireEvent.change(screen.getByPlaceholderText("^[A-Z]{3}$"), {
      target: { value: "^\\d+$" },
    });

    expect(updateNodeData).toHaveBeenCalledWith("node-1", {
      validation: {
        type: "regex",
        pattern: "^\\d+$",
      },
    });
  });

  it("text_input al editar Error message envia errorMessage actualizado", () => {
    const { updateNodeData } = renderPanel(
      baseNode({
        type: "text_input",
        data: { validation: { type: "email" } },
      }),
    );

    fireEvent.change(screen.getByPlaceholderText("Please enter a valid value"), {
      target: { value: "Email invalido" },
    });

    expect(updateNodeData).toHaveBeenCalledWith("node-1", {
      validation: {
        type: "email",
        errorMessage: "Email invalido",
      },
    });
  });

  it("invalid_input muestra texto explicativo y sin campos editables", () => {
    renderPanel(baseNode({ type: "invalid_input", data: {} }));

    expect(screen.getByText(/fires when a/i)).toBeInTheDocument();
    expect(screen.getByText(/handle of a Text Input node/i)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("end muestra mensaje de no configurable", () => {
    renderPanel(baseNode({ type: "end", data: {} }));
    expect(screen.getByText(/no configurable properties/i)).toBeInTheDocument();
  });
});


