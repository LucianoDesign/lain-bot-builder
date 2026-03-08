import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { GET, POST } from "./route"

const mocks = vi.hoisted(() => {
  return {
    getSession: vi.fn(),
    headers: vi.fn(),
    flowFindFirst: vi.fn(),
    variableFindMany: vi.fn(),
    variableCreate: vi.fn(),
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
    flow: {
      findFirst: mocks.flowFindFirst,
    },
    variable: {
      findMany: mocks.variableFindMany,
      create: mocks.variableCreate,
    },
  },
}))

function params(flowId = "flow-1") {
  return { params: Promise.resolve({ flowId }) } as never
}

describe("/api/flows/[flowId]/variables", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.headers.mockResolvedValue(new Headers())
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } })
    mocks.flowFindFirst.mockResolvedValue({ id: "flow-1", userId: "user-1" })
  })

  it("GET retorna 401 si no hay sesion", async () => {
    mocks.getSession.mockResolvedValueOnce(null)

    const res = await GET(new NextRequest("http://localhost/api/flows/flow-1/variables"), params())

    expect(res.status).toBe(401)
  })

  it("GET retorna 404 si flow no pertenece al usuario", async () => {
    mocks.flowFindFirst.mockResolvedValueOnce(null)

    const res = await GET(new NextRequest("http://localhost/api/flows/flow-1/variables"), params())

    expect(res.status).toBe(404)
  })

  it("GET retorna lista de variables orden asc", async () => {
    const variables = [
      { id: "v1", createdAt: new Date("2026-01-01") },
      { id: "v2", createdAt: new Date("2026-01-02") },
    ]
    mocks.variableFindMany.mockResolvedValueOnce(variables)

    const res = await GET(new NextRequest("http://localhost/api/flows/flow-1/variables"), params())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: "v1", createdAt: "2026-01-01T00:00:00.000Z" }, { id: "v2", createdAt: "2026-01-02T00:00:00.000Z" }])
    expect(mocks.variableFindMany).toHaveBeenCalledWith({
      where: { flowId: "flow-1" },
      orderBy: { createdAt: "asc" },
    })
  })

  it("POST crea variable valida y retorna 201", async () => {
    mocks.variableCreate.mockResolvedValueOnce({ id: "v1", name: "myVar", type: "number" })

    const req = new NextRequest("http://localhost/api/flows/flow-1/variables", {
      method: "POST",
      body: JSON.stringify({ name: "myVar", type: "number" }),
      headers: { "Content-Type": "application/json" },
    })

    const res = await POST(req, params())

    expect(res.status).toBe(201)
    expect(mocks.variableCreate).toHaveBeenCalledWith({
      data: {
        flowId: "flow-1",
        name: "myVar",
        type: "number",
        defaultValue: null,
      },
    })
  })

  it("POST retorna 400 si nombre esta vacio", async () => {
    const req = new NextRequest("http://localhost/api/flows/flow-1/variables", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
      headers: { "Content-Type": "application/json" },
    })

    const res = await POST(req, params())

    expect(res.status).toBe(400)
  })

  it("POST retorna 400 con caracteres invalidos", async () => {
    const req = new NextRequest("http://localhost/api/flows/flow-1/variables", {
      method: "POST",
      body: JSON.stringify({ name: "bad-name" }),
      headers: { "Content-Type": "application/json" },
    })

    const res = await POST(req, params())

    expect(res.status).toBe(400)
  })

  it("POST retorna 409 si nombre ya existe", async () => {
    mocks.variableCreate.mockRejectedValueOnce(new Error("Unique constraint failed"))

    const req = new NextRequest("http://localhost/api/flows/flow-1/variables", {
      method: "POST",
      body: JSON.stringify({ name: "myVar" }),
      headers: { "Content-Type": "application/json" },
    })

    const res = await POST(req, params())

    expect(res.status).toBe(409)
  })

  it("POST usa type string por defecto", async () => {
    mocks.variableCreate.mockResolvedValueOnce({ id: "v1" })

    const req = new NextRequest("http://localhost/api/flows/flow-1/variables", {
      method: "POST",
      body: JSON.stringify({ name: "myVar" }),
      headers: { "Content-Type": "application/json" },
    })

    await POST(req, params())

    expect(mocks.variableCreate).toHaveBeenCalledWith({
      data: {
        flowId: "flow-1",
        name: "myVar",
        type: "string",
        defaultValue: null,
      },
    })
  })
})
