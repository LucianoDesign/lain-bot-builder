"use client"

import { useEffect } from "react"
import { useFlowStore } from "@/lib/store/flow-store"
import { dbNodesToRF, dbEdgesToRF, type DbFlowNode, type DbFlowEdge } from "@/lib/types"

interface UseFlowProps {
  dbNodes: DbFlowNode[]
  dbEdges: DbFlowEdge[]
}

export function useFlow({ dbNodes, dbEdges }: UseFlowProps) {
  const { setNodes, setEdges } = useFlowStore()

  useEffect(() => {
    setNodes(dbNodesToRF(dbNodes))
    setEdges(dbEdgesToRF(dbEdges))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
