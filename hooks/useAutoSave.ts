"use client"

import { useEffect, useRef } from "react"
import { useFlowStore } from "@/lib/store/flow-store"

const DEBOUNCE_MS = 1500

export function useAutoSave(flowId: string) {
  const { nodes, edges, isDirty, setSaveStatus, markClean } = useFlowStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip initial load
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!isDirty) return

    if (timerRef.current) clearTimeout(timerRef.current)

    setSaveStatus("saving")

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flows/${flowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        })

        if (!res.ok) throw new Error("Save failed")

        markClean()
        setSaveStatus("saved")

        // Reset to idle after 2s
        setTimeout(() => setSaveStatus("idle"), 2000)
      } catch {
        setSaveStatus("error")
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [nodes, edges, isDirty]) // eslint-disable-line react-hooks/exhaustive-deps
}
