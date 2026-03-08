import { beforeEach, describe, expect, it } from "vitest"
import { useVariablesStore, type FlowVariable } from "./variables-store"

function variable(id: string, name = id): FlowVariable {
  return {
    id,
    flowId: "flow-1",
    name,
    type: "string",
    defaultValue: null,
    isSystem: false,
  }
}

describe("useVariablesStore", () => {
  beforeEach(() => {
    useVariablesStore.setState(useVariablesStore.getInitialState(), true)
  })

  it("setVariables reemplaza el array completo", () => {
    useVariablesStore.setState({ variables: [variable("old")] })

    useVariablesStore.getState().setVariables([variable("new")])

    expect(useVariablesStore.getState().variables.map((v) => v.id)).toEqual(["new"])
  })

  it("addVariable agrega una variable al final", () => {
    useVariablesStore.setState({ variables: [variable("a")] })

    useVariablesStore.getState().addVariable(variable("b"))

    expect(useVariablesStore.getState().variables.map((v) => v.id)).toEqual(["a", "b"])
  })

  it("removeVariable elimina solo la variable por id", () => {
    useVariablesStore.setState({ variables: [variable("a"), variable("b"), variable("c")] })

    useVariablesStore.getState().removeVariable("b")

    expect(useVariablesStore.getState().variables.map((v) => v.id)).toEqual(["a", "c"])
  })

  it("removeVariable con id inexistente no modifica el array", () => {
    useVariablesStore.setState({ variables: [variable("a"), variable("b")] })

    useVariablesStore.getState().removeVariable("x")

    expect(useVariablesStore.getState().variables.map((v) => v.id)).toEqual(["a", "b"])
  })

  it("setLoading actualiza isLoading", () => {
    useVariablesStore.getState().setLoading(true)
    expect(useVariablesStore.getState().isLoading).toBe(true)

    useVariablesStore.getState().setLoading(false)
    expect(useVariablesStore.getState().isLoading).toBe(false)
  })
})