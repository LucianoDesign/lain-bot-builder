import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { DELETE } from "./route"

const mocks = vi.hoisted(() => {
  return {
    getSession: vi.fn(),
    headers: vi.fn(),
    variableFindFirst: vi.fn(),
    variableDelete: vi.fn(),
  }
})

vi.mock("@/app/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}))

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    variable: {
      findFirst: mocks.variableFindFirst,
      delete: mocks.variableDelete,
    },
  },
}))

function params(flowId = "flow-1", variableId = "var-1") {
  return { params: Promise.resolve({ flowId, variableId }) } as never
}

describe("/api/flows/[flowId]/variables/[variableId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.headers.mockResolvedValue(new Headers())
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } })
    mocks.variableFindFirst.mockResolvedValue({ id: "var-1" })
  })

  it("DELETE retorna 401 sin sesion", async () => {
    mocks.getSession.mockResolvedValueOnce(null)

    const res = await DELETE(new NextRequest("http://localhost/api/flows/flow-1/variables/var-1"), params())

    expect(res.status).toBe(401)
  })

  it("DELETE retorna 404 si variable no existe o no pertenece", async () => {
    mocks.variableFindFirst.mockResolvedValueOnce(null)

    const res = await DELETE(new NextRequest("http://localhost/api/flows/flow-1/variables/var-1"), params())

    expect(res.status).toBe(404)
  })

  it("DELETE elimina variable y retorna success true", async () => {
    mocks.variableDelete.mockResolvedValueOnce({ id: "var-1" })

    const res = await DELETE(new NextRequest("http://localhost/api/flows/flow-1/variables/var-1"), params())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(mocks.variableDelete).toHaveBeenCalledWith({ where: { id: "var-1" } })
  })
})