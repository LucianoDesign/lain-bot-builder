"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useUIStore } from "@/lib/store/ui-store"
import { useFlowStore } from "@/lib/store/flow-store"
import { saveFlowSettings } from "@/app/actions/flows"
import type { FlowSettings } from "@/lib/types"

const SCHEMA_OPTIONS = [
  { value: "chatwoot_wp", label: "Chatwoot + WhatsApp" },
]

// Inner form — remounts on each dialog open, so useState picks up latest flowSettings
function SettingsForm({
  flowId,
  initialValues,
  onSaved,
  onCancel,
}: {
  flowId: string
  initialValues: FlowSettings
  onSaved: (values: FlowSettings) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<FlowSettings>(initialValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function field(key: keyof FlowSettings) {
    return {
      value: (form[key] as string) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await saveFlowSettings(flowId, form)
    setSaving(false)
    if ("error" in result) {
      setError(String(result.error))
    } else {
      onSaved(form)
    }
  }

  return (
    <>
      <div className="space-y-4 py-1">
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Schema / Integration</Label>
          <select
            value={form.schema ?? "chatwoot_wp"}
            onChange={(e) => setForm((f) => ({ ...f, schema: e.target.value }))}
            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            {SCHEMA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Domain</Label>
          <Input
            {...field("domain")}
            placeholder="https://app.chatwoot.com"
            className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
          />
        </div>

        <Separator className="bg-zinc-800" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          Credentials
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Admin API Key</Label>
            <Input
              {...field("adminApiKey")}
              placeholder="admin_api_key_..."
              className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Chatwoot Bot Key</Label>
            <Input
              {...field("chatwootBotKey")}
              placeholder="api_access_token_..."
              className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">WABA Key</Label>
            <Input
              {...field("wabaKey")}
              placeholder="WhatsApp Business API key"
              className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Phone ID</Label>
            <Input
              {...field("phoneId")}
              placeholder="WhatsApp Phone Number ID"
              className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <Separator className="bg-zinc-800" />
      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-xs text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-100 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </>
  )
}

export function FlowSettingsPanel({ flowId }: { flowId: string }) {
  const { isFlowSettingsPanelOpen, toggleFlowSettingsPanel } = useUIStore()
  const { flowSettings, updateFlowSettings } = useFlowStore()

  function handleSaved(values: FlowSettings) {
    updateFlowSettings(values)
    toggleFlowSettingsPanel()
  }

  return (
    <Dialog open={isFlowSettingsPanelOpen} onOpenChange={toggleFlowSettingsPanel}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-zinc-200">
            Flow Settings
          </DialogTitle>
        </DialogHeader>
        <Separator className="bg-zinc-800" />
        {/* key forces remount so SettingsForm always starts with fresh state */}
        <SettingsForm
          key={String(isFlowSettingsPanelOpen)}
          flowId={flowId}
          initialValues={flowSettings}
          onSaved={handleSaved}
          onCancel={toggleFlowSettingsPanel}
        />
      </DialogContent>
    </Dialog>
  )
}
