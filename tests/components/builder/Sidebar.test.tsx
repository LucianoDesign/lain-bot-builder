/// <reference types="@testing-library/jest-dom/vitest" />
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/builder/Sidebar";

describe("Sidebar", () => {
  it('muestra el nodo "Start" como item arrastrable', () => {
    render(<Sidebar />);

    const startLabel = screen.getByText("Start");
    const startItem = startLabel.closest("div[draggable='true']");

    expect(startLabel).toBeInTheDocument();
    expect(startItem).toBeInTheDocument();
  });

  it('muestra seccion "Events" con nodo "Invalid Input"', () => {
    render(<Sidebar />);

    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Invalid Input")).toBeInTheDocument();
  });

  it('drag de "invalid_input" setea dataTransfer correcto', () => {
    render(<Sidebar />);

    const setData = vi.fn();
    const dataTransfer = {
      setData,
      effectAllowed: "",
    };

    const item = screen
      .getByText("Invalid Input")
      .closest("div[draggable='true']") as HTMLDivElement;

    fireEvent.dragStart(item, { dataTransfer });

    expect(setData).toHaveBeenCalledWith("application/reactflow", "invalid_input");
    expect(dataTransfer.effectAllowed).toBe("move");
  });

  it('drag de "start" setea dataTransfer correcto', () => {
    render(<Sidebar />);

    const setData = vi.fn();
    const dataTransfer = {
      setData,
      effectAllowed: "",
    };

    const item = screen
      .getByText("Start")
      .closest("div[draggable='true']") as HTMLDivElement;

    fireEvent.dragStart(item, { dataTransfer });

    expect(setData).toHaveBeenCalledWith("application/reactflow", "start");
    expect(dataTransfer.effectAllowed).toBe("move");
  });
});
