/// <reference types="@testing-library/jest-dom/vitest" />
import { fireEvent, render, screen } from "@testing-library/react";
import React, { type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { CanvasContextMenu } from "@/components/builder/CanvasContextMenu";

function setup(props?: Partial<ComponentProps<typeof CanvasContextMenu>>) {
  const handlers = {
    onPaste: vi.fn(),
    onTidyUp: vi.fn(),
    onSelectAll: vi.fn(),
    onClearSelection: vi.fn(),
    onClose: vi.fn(),
  };

  render(
    <CanvasContextMenu
      x={100}
      y={100}
      hasClipboard={false}
      {...handlers}
      {...props}
    />,
  );

  return handlers;
}

describe("CanvasContextMenu", () => {
  it('"Paste" aparece deshabilitado cuando hasClipboard es false', () => {
    setup({ hasClipboard: false });

    expect(screen.getByRole("button", { name: "Paste" })).toBeDisabled();
  });

  it('"Paste" esta habilitado cuando hasClipboard es true', () => {
    setup({ hasClipboard: true });

    expect(screen.getByRole("button", { name: "Paste" })).toBeEnabled();
  });

  it('click en "Paste" llama onPaste', () => {
    const handlers = setup({ hasClipboard: true });

    fireEvent.click(screen.getByRole("button", { name: "Paste" }));

    expect(handlers.onPaste).toHaveBeenCalledTimes(1);
  });

  it('click en "Tidy up workflow" llama onTidyUp', () => {
    const handlers = setup();

    fireEvent.click(screen.getByRole("button", { name: "Tidy up workflow" }));

    expect(handlers.onTidyUp).toHaveBeenCalledTimes(1);
  });

  it('click en "Select all" llama onSelectAll', () => {
    const handlers = setup();

    fireEvent.click(screen.getByRole("button", { name: "Select all" }));

    expect(handlers.onSelectAll).toHaveBeenCalledTimes(1);
  });

  it("click fuera del menu llama onClose", () => {
    const handlers = setup();

    fireEvent.mouseDown(document.body);

    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape llama onClose", () => {
    const handlers = setup();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });
});
