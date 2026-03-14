/// <reference types="@testing-library/jest-dom/vitest" />
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlowSettingsPanel } from "@/components/builder/FlowSettingsPanel";
import { useFlowStore } from "@/lib/store/flow-store";
import { useUIStore } from "@/lib/store/ui-store";

const mocks = vi.hoisted(() => ({
  saveFlowSettings: vi.fn(),
}));

vi.mock("@/app/actions/flows", () => ({
  saveFlowSettings: mocks.saveFlowSettings,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog-root">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

function setup(options?: {
  open?: boolean;
  flowId?: string;
  flowSettings?: Record<string, string>;
}) {
  const toggleFlowSettingsPanel = vi.fn();
  const updateFlowSettings = vi.fn();

  useUIStore.setState(
    {
      isFlowSettingsPanelOpen: options?.open ?? true,
      toggleFlowSettingsPanel,
    },
    false,
  );

  useFlowStore.setState(
    {
      flowSettings: options?.flowSettings ?? {},
      updateFlowSettings,
    },
    false,
  );

  const view = render(<FlowSettingsPanel flowId={options?.flowId ?? "flow-1"} />);

  return {
    ...view,
    toggleFlowSettingsPanel,
    updateFlowSettings,
  };
}

describe("FlowSettingsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState(useUIStore.getInitialState(), true);
    useFlowStore.setState(useFlowStore.getInitialState(), true);
  });

  it("no renderiza cuando isFlowSettingsPanelOpen es false", () => {
    setup({ open: false });

    expect(screen.queryByTestId("dialog-root")).not.toBeInTheDocument();
  });

  it("renderiza dialog cuando isFlowSettingsPanelOpen es true", () => {
    setup({ open: true });

    expect(screen.getByTestId("dialog-root")).toBeInTheDocument();
    expect(screen.getByText("Flow Settings")).toBeInTheDocument();
  });

  it("muestra campos esperados", () => {
    setup();

    expect(screen.getByText(/Schema/i)).toBeInTheDocument();
    expect(screen.getByText("Domain")).toBeInTheDocument();
    expect(screen.getByText("Admin API Key")).toBeInTheDocument();
    expect(screen.getByText("Chatwoot Bot Key")).toBeInTheDocument();
    expect(screen.getByText("WABA Key")).toBeInTheDocument();
    expect(screen.getByText("Phone ID")).toBeInTheDocument();
  });

  it("inicializa inputs con valores actuales de flowSettings", () => {
    setup({
      flowSettings: {
        schema: "chatwoot_wp",
        domain: "https://app.chatwoot.com",
        adminApiKey: "admin-key",
        chatwootBotKey: "bot-key",
        wabaKey: "waba-key",
        phoneId: "phone-123",
      },
    });

    expect(screen.getByDisplayValue("https://app.chatwoot.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("admin-key")).toBeInTheDocument();
    expect(screen.getByDisplayValue("bot-key")).toBeInTheDocument();
    expect(screen.getByDisplayValue("waba-key")).toBeInTheDocument();
    expect(screen.getByDisplayValue("phone-123")).toBeInTheDocument();

    const schemaSelect = screen.getByRole("combobox") as HTMLSelectElement;
    expect(schemaSelect.value).toBe("chatwoot_wp");
  });

  it("al reabrir refleja valores actuales del store", async () => {
    setup({
      flowSettings: {
        schema: "chatwoot_wp",
        domain: "https://old.example",
      },
    });

    fireEvent.change(screen.getByPlaceholderText("https://app.chatwoot.com"), {
      target: { value: "https://draft-local.example" },
    });

    act(() => {
      useUIStore.setState({ isFlowSettingsPanelOpen: false });
    });

    act(() => {
      useFlowStore.setState({
        flowSettings: {
          schema: "chatwoot_wp",
          domain: "https://fresh-from-store.example",
        },
      });
    });

    act(() => {
      useUIStore.setState({ isFlowSettingsPanelOpen: true });
    });

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("https://fresh-from-store.example"),
      ).toBeInTheDocument();
    });
  });

  it('Cancel llama toggleFlowSettingsPanel sin guardar', () => {
    const { toggleFlowSettingsPanel } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(toggleFlowSettingsPanel).toHaveBeenCalledTimes(1);
    expect(mocks.saveFlowSettings).not.toHaveBeenCalled();
  });

  it('Save llama saveFlowSettings con flowId y valores del form', async () => {
    mocks.saveFlowSettings.mockResolvedValue({ success: true });

    setup({
      flowId: "flow-save-1",
      flowSettings: {
        schema: "chatwoot_wp",
        domain: "https://initial.example",
        adminApiKey: "old-admin",
        chatwootBotKey: "old-bot",
        wabaKey: "old-waba",
        phoneId: "old-phone",
      },
    });

    fireEvent.change(screen.getByPlaceholderText("https://app.chatwoot.com"), {
      target: { value: "https://new.example" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin_api_key_..."), {
      target: { value: "admin-new" },
    });
    fireEvent.change(screen.getByPlaceholderText("api_access_token_..."), {
      target: { value: "bot-new" },
    });
    fireEvent.change(screen.getByPlaceholderText("WhatsApp Business API key"), {
      target: { value: "waba-new" },
    });
    fireEvent.change(screen.getByPlaceholderText("WhatsApp Phone Number ID"), {
      target: { value: "phone-new" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mocks.saveFlowSettings).toHaveBeenCalledWith("flow-save-1", {
        schema: "chatwoot_wp",
        domain: "https://new.example",
        adminApiKey: "admin-new",
        chatwootBotKey: "bot-new",
        wabaKey: "waba-new",
        phoneId: "phone-new",
      });
    });
  });

  it('mientras guarda, muestra "Saving..." y deshabilita el boton', async () => {
    let resolveSave: ((value: { success: boolean }) => void) | undefined;
    mocks.saveFlowSettings.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );

    setup();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const savingButton = screen.getByRole("button", { name: "Saving..." });
    expect(savingButton).toBeDisabled();

    resolveSave?.({ success: true });
    await waitFor(() => expect(mocks.saveFlowSettings).toHaveBeenCalledTimes(1));
  });

  it("tras guardar exitosamente, actualiza store y cierra dialog", async () => {
    mocks.saveFlowSettings.mockResolvedValue({ success: true });
    const { updateFlowSettings, toggleFlowSettingsPanel } = setup({
      flowSettings: {
        schema: "chatwoot_wp",
        domain: "https://old.example",
      },
    });

    fireEvent.change(screen.getByPlaceholderText("https://app.chatwoot.com"), {
      target: { value: "https://saved.example" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updateFlowSettings).toHaveBeenCalledWith({
        schema: "chatwoot_wp",
        domain: "https://saved.example",
      });
      expect(toggleFlowSettingsPanel).toHaveBeenCalledTimes(1);
    });
  });

  it("si saveFlowSettings retorna error, muestra mensaje y no cierra", async () => {
    mocks.saveFlowSettings.mockResolvedValue({ error: "DB exploded" });
    const { updateFlowSettings, toggleFlowSettingsPanel } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("DB exploded")).toBeInTheDocument();
    expect(updateFlowSettings).not.toHaveBeenCalled();
    expect(toggleFlowSettingsPanel).not.toHaveBeenCalled();
  });
});

