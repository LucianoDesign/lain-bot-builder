import { create } from "zustand"

export interface FlowVariable {
  id: string
  flowId: string
  name: string
  type: "string" | "number" | "boolean" | "array" | "object"
  defaultValue: string | null
  isSystem: boolean
}

interface VariablesStore {
  variables: FlowVariable[]
  isLoading: boolean
  setVariables: (vars: FlowVariable[]) => void
  addVariable: (v: FlowVariable) => void
  removeVariable: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useVariablesStore = create<VariablesStore>((set) => ({
  variables: [],
  isLoading: false,
  setVariables: (variables) => set({ variables }),
  addVariable: (v) => set((state) => ({ variables: [...state.variables, v] })),
  removeVariable: (id) =>
    set((state) => ({ variables: state.variables.filter((v) => v.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
}))
