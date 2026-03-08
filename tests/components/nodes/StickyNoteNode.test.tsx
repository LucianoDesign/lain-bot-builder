/// <reference types="@testing-library/jest-dom/vitest" />
import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { StickyNoteNode } from "@/components/nodes/StickyNoteNode"
import { useFlowStore } from "@/lib/store/flow-store"
import { useUIStore } from "@/lib/store/ui-store"

const mocks = vi.hoisted(() => ({
  deleteElements: vi.fn(),
}))

const baseNodeProps = {
  id: "sticky-1" as const,
  type: "sticky_note" as const,
  dragging: false,
  zIndex: 0,
  selectable: true,
  deletable: true,
  draggable: true,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
}

vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({ deleteElements: mocks.deleteElements }),
  NodeResizer: ({
    onResizeEnd,
  }: {
    onResizeEnd?: (_: unknown, p: { width: number; height: number }) => void
  }) => (
    <button data-testid="node-resizer" onClick={() => onResizeEnd?.({}, { width: 320, height: 180 })}>
      resize
    </button>
  ),
}))

function setup(props?: Partial<{ id: string; data: Record<string, unknown>; selected: boolean }>) {
  const pushSnapshot = vi.fn()

  useFlowStore.setState(useFlowStore.getInitialState(), true)
  useUIStore.setState(useUIStore.getInitialState(), true)

  useFlowStore.setState({
    nodes: [
      {
        id: "sticky-1",
        type: "sticky_note",
        position: { x: 0, y: 0 },
        data: { text: "", color: "yellow" },
      } as never,
    ],
    pushSnapshot,
  })

  const result = render(
    <StickyNoteNode
      {...baseNodeProps}
      data={{ text: "", color: "yellow", ...(props?.data ?? {}) }}
      selected={props?.selected ?? false}
    />,
  )

  return { ...result, pushSnapshot }
}

describe("StickyNoteNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra hint "Double-click to edit" cuando esta vacia', () => {
    setup()

    expect(screen.getByText("Double-click to edit")).toBeInTheDocument()
  })

  it("single click no activa modo edicion", () => {
    setup()

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
    fireEvent.click(textarea)

    expect(textarea.readOnly).toBe(true)
  })

  it("doble click activa modo edicion", () => {
    setup()

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
    fireEvent.doubleClick(textarea)

    expect(textarea.readOnly).toBe(false)
  })

  it("doble click activa focus en textarea", () => {
    vi.useFakeTimers()
    setup()

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
    fireEvent.doubleClick(textarea)
    vi.runAllTimers()

    expect(document.activeElement).toBe(textarea)
    vi.useRealTimers()
  })

  it("onBlur guarda texto solo si cambio y llama pushSnapshot", () => {
    const { pushSnapshot } = setup({ data: { text: "old", color: "yellow" } })

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
    fireEvent.doubleClick(textarea)
    fireEvent.change(textarea, { target: { value: "new" } })
    fireEvent.blur(textarea)

    expect(pushSnapshot).toHaveBeenCalledTimes(1)
    const state = useFlowStore.getState()
    expect((state.nodes[0]?.data as { text?: string }).text).toBe("new")
  })

  it("onBlur no llama pushSnapshot si texto no cambio", () => {
    const { pushSnapshot } = setup({ data: { text: "same", color: "yellow" } })

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
    fireEvent.doubleClick(textarea)
    fireEvent.change(textarea, { target: { value: "same" } })
    fireEvent.blur(textarea)

    expect(pushSnapshot).not.toHaveBeenCalled()
  })

  it("sincroniza localText cuando data.text cambia externamente", () => {
    const { rerender } = setup({ data: { text: "one", color: "yellow" } })

    rerender(
      <StickyNoteNode
        {...baseNodeProps}
        data={{ text: "two", color: "yellow" }}
        selected={false}
      />,
    )

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
    expect(textarea.value).toBe("two")
  })

  it("onResizeEnd guarda width y height en node.data y node.style", () => {
    const { pushSnapshot } = setup({ selected: true })

    fireEvent.click(screen.getByTestId("node-resizer"))

    expect(pushSnapshot).toHaveBeenCalledTimes(1)
    const stateNode = useFlowStore.getState().nodes[0] as {
      style?: { width?: number; height?: number }
      data?: { width?: number; height?: number }
    }
    expect(stateNode.style).toEqual({ width: 320, height: 180 })
    expect(stateNode.data?.width).toBe(320)
    expect(stateNode.data?.height).toBe(180)
  })

  it("boton de eliminar aparece solo cuando selected=true", () => {
    const { rerender } = setup({ selected: false })

    expect(screen.queryByTitle("Delete note")).not.toBeInTheDocument()

    rerender(
      <StickyNoteNode
        {...baseNodeProps}
        data={{ text: "", color: "yellow" }}
        selected
      />,
    )

    expect(screen.getByTitle("Delete note")).toBeInTheDocument()
  })
})
