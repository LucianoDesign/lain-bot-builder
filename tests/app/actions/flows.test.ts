import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  headers: vi.fn(),
  getSession: vi.fn(),
  flowCreate: vi.fn(),
  flowFindFirst: vi.fn(),
  flowUpdate: vi.fn(),
  transaction: vi.fn(),
  createFlowSafeParse: vi.fn(),
  updateFlowSafeParse: vi.fn(),
  toFlowNodeRows: vi.fn(),
  toFlowEdgeRows: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mocked.headers,
}));

vi.mock("@/app/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocked.getSession,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    flow: {
      create: mocked.flowCreate,
      findFirst: mocked.flowFindFirst,
      update: mocked.flowUpdate,
    },
    $transaction: mocked.transaction,
  },
}));

vi.mock("@/lib/flows/contracts", () => ({
  createFlowSchema: {
    safeParse: mocked.createFlowSafeParse,
  },
  updateFlowSchema: {
    safeParse: mocked.updateFlowSafeParse,
  },
  toFlowNodeRows: mocked.toFlowNodeRows,
  toFlowEdgeRows: mocked.toFlowEdgeRows,
}));

import { createFlow, publishFlow, saveFlowSettings } from "@/app/actions/flows";

describe("app/actions/flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocked.headers.mockResolvedValue(new Headers());
    mocked.getSession.mockResolvedValue({ user: { id: "user-1" } });

    mocked.createFlowSafeParse.mockImplementation((input: { name?: string; description?: string }) => ({
      success: true,
      data: {
        name: input.name,
        description: input.description,
      },
    }));

    mocked.updateFlowSafeParse.mockReturnValue({
      success: true,
      data: {},
    });
  });

  describe("saveFlowSettings", () => {
    it('retorna { error: "Unauthorized" } si no hay sesion', async () => {
      mocked.getSession.mockResolvedValue(null);

      const result = await saveFlowSettings("flow-1", { schema: "chatwoot_wp" });

      expect(result).toEqual({ error: "Unauthorized" });
    });

    it('retorna { error: "Not found" } si el flow no pertenece al usuario', async () => {
      mocked.flowFindFirst.mockResolvedValue(null);

      const result = await saveFlowSettings("flow-1", { schema: "chatwoot_wp" });

      expect(mocked.flowFindFirst).toHaveBeenCalledWith({
        where: { id: "flow-1", userId: "user-1" },
      });
      expect(result).toEqual({ error: "Not found" });
    });

    it("actualiza settings en DB y retorna success", async () => {
      mocked.flowFindFirst.mockResolvedValue({ id: "flow-1" });
      mocked.flowUpdate.mockResolvedValue({ id: "flow-1" });

      const settings = {
        schema: "chatwoot_wp",
        domain: "https://app.chatwoot.com",
        adminApiKey: "admin-key",
      };

      const result = await saveFlowSettings("flow-1", settings);

      expect(mocked.flowUpdate).toHaveBeenCalledWith({
        where: { id: "flow-1" },
        data: { settings },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("publishFlow", () => {
    it('retorna { error: "Unauthorized" } si no hay sesion', async () => {
      mocked.getSession.mockResolvedValue(null);

      const result = await publishFlow("flow-1");

      expect(result).toEqual({ error: "Unauthorized" });
    });

    it('retorna { error: "Not found" } si el flow no pertenece al usuario', async () => {
      mocked.flowFindFirst.mockResolvedValue(null);

      const result = await publishFlow("flow-1");

      expect(mocked.flowFindFirst).toHaveBeenCalledWith({
        where: { id: "flow-1", userId: "user-1" },
        include: { nodes: true, edges: true, variables: true },
      });
      expect(result).toEqual({ error: "Not found" });
    });

    it("guarda snapshot con nodes/edges/variables, marca publicado y retorna success", async () => {
      const nodes = [{ id: "n1" }];
      const edges = [{ id: "e1" }];
      const variables = [{ id: "v1" }];

      mocked.flowFindFirst.mockResolvedValue({
        id: "flow-1",
        nodes,
        edges,
        variables,
      });
      mocked.flowUpdate.mockResolvedValue({ id: "flow-1" });

      const result = await publishFlow("flow-1");

      expect(mocked.flowUpdate).toHaveBeenCalledWith({
        where: { id: "flow-1" },
        data: {
          isPublished: true,
          publishedSnapshot: {
            nodes,
            edges,
            variables,
          },
        },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("createFlow", () => {
    it("al crear un flow crea automaticamente un nodo start con posicion 300,100 y data vacia", async () => {
      mocked.flowCreate.mockResolvedValue({ id: "flow-1", name: "My Flow" });

      await createFlow("My Flow", "Desc");

      expect(mocked.flowCreate).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          name: "My Flow",
          description: "Desc",
          nodes: {
            create: {
              type: "start",
              positionX: 300,
              positionY: 100,
              data: {},
            },
          },
        },
      });
    });
  });
});
