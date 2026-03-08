import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"
import { NodeContextMenu } from "./NodeContextMenu"

function setup() {
  const handlers = {
    onCopy: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
  }

  render(<NodeContextMenu x={100} y={100} {...handlers} />)

  return handlers
}

describe("NodeContextMenu", () => {
  it('click en "Copy" llama onCopy', () => {
    const handlers = setup()

    fireEvent.click(screen.getByRole("button", { name: "Copy" }))

    expect(handlers.onCopy).toHaveBeenCalledTimes(1)
  })

  it('click en "Delete" llama onDelete y se renderiza en estilo danger', () => {
    const handlers = setup()
    const deleteButton = screen.getByRole("button", { name: "Delete" })

    fireEvent.click(deleteButton)

    expect(handlers.onDelete).toHaveBeenCalledTimes(1)
    expect(deleteButton.className).toContain("text-red-400")
  })

  it("click fuera del menu llama onClose", () => {
    const handlers = setup()

    fireEvent.mouseDown(document.body)

    expect(handlers.onClose).toHaveBeenCalledTimes(1)
  })

  it("Escape llama onClose", () => {
    const handlers = setup()

    fireEvent.keyDown(document, { key: "Escape" })

    expect(handlers.onClose).toHaveBeenCalledTimes(1)
  })
})
