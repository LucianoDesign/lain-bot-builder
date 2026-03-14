/// <reference types="@testing-library/jest-dom/vitest" />
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toolbar } from "@/components/builder/Toolbar";
import { useFlowStore } from "@/lib/store/flow-store";
import { useUIStore } from "@/lib/store/ui-store";

const mocks = vi.hoisted(() => ({
  publishFlow: vi.fn(),
}));

vi.mock("@/app/actions/flows", () => ({
  publishFlow: mocks.publishFlow,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function setup(options?: { isPublished?: boolean; flowId?: string }) {
  const setIsPublished = vi.fn();
  const toggleFlowSettingsPanel = vi.fn();
  const toggleVariablesPanel = vi.fn();

  useFlowStore.setState(
    {
      saveStatus: "idle",
      history: [],
      future: [],
      isPublished: options?.isPublished ?? false,
      setIsPublished,
      undo: vi.fn(),
      redo: vi.fn(),
    },
    false,
  );

  useUIStore.setState(
    {
      toggleFlowSettingsPanel,
      toggleVariablesPanel,
    },
    false,
  );

  render(<Toolbar flowId={options?.flowId ?? "flow-1"} flowName="Test Flow" />);

  return { setIsPublished, toggleFlowSettingsPanel, toggleVariablesPanel };
}

describe("Toolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFlowStore.setState(useFlowStore.getInitialState(), true);
    useUIStore.setState(useUIStore.getInitialState(), true);
  });

  it('boton "Settings" llama toggleFlowSettingsPanel', () => {
    const { toggleFlowSettingsPanel } = setup();

    fireEvent.click(screen.getByRole("button", { name: /Settings/i }));

    expect(toggleFlowSettingsPanel).toHaveBeenCalledTimes(1);
  });

  it('boton Publish muestra "Publish" cuando isPublished es false', () => {
    setup({ isPublished: false });

    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });

  it('boton Publish muestra "Re-publish" cuando isPublished es true', () => {
    setup({ isPublished: true });

    expect(screen.getByRole("button", { name: "Re-publish" })).toBeInTheDocument();
  });

  it('badge muestra "Draft" cuando isPublished es false', () => {
    setup({ isPublished: false });

    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it('badge muestra "Published" cuando isPublished es true', () => {
    setup({ isPublished: true });

    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it('al hacer click en Publish llama publishFlow con flowId', async () => {
    mocks.publishFlow.mockResolvedValue({ success: true });
    setup({ flowId: "flow-publish-1" });

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(mocks.publishFlow).toHaveBeenCalledWith("flow-publish-1");
    });
  });

  it('mientras publica muestra "Publishing..." y deshabilita boton', async () => {
    let resolvePublish: ((value: { success: boolean }) => void) | undefined;
    mocks.publishFlow.mockReturnValue(
      new Promise((resolve) => {
        resolvePublish = resolve;
      }),
    );

    setup();

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    const publishingButton = screen.getByRole("button", { name: "Publishing..." });
    expect(publishingButton).toBeDisabled();

    resolvePublish?.({ success: true });
    await waitFor(() => expect(mocks.publishFlow).toHaveBeenCalledTimes(1));
  });

  it("tras publicar con exito llama setIsPublished(true)", async () => {
    mocks.publishFlow.mockResolvedValue({ success: true });
    const { setIsPublished } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(setIsPublished).toHaveBeenCalledWith(true);
    });
  });
});
