import { create } from "zustand"
import { WorkspaceObject } from "@/types"

const MAX_HISTORY = 60

interface LayoutStore {
  // UI state
  snapToGrid: boolean
  gridSize: number
  showGrid: boolean
  showMinimap: boolean
  showAICopilot: boolean
  showLeftPanel: boolean

  // Undo / redo history
  history: WorkspaceObject[][]
  historyIndex: number

  // Actions
  pushHistory: (objects: WorkspaceObject[]) => void
  undo: () => WorkspaceObject[] | null
  redo: () => WorkspaceObject[] | null
  canUndo: () => boolean
  canRedo: () => boolean

  toggleSnapToGrid: () => void
  setGridSize: (size: number) => void
  toggleGrid: () => void
  toggleMinimap: () => void
  toggleAICopilot: () => void
  toggleLeftPanel: () => void
  resetHistory: (objects: WorkspaceObject[]) => void
}

export const useLayoutStore = create<LayoutStore>((set, get) => ({
  snapToGrid: true,
  gridSize: 20,
  showGrid: true,
  showMinimap: true,
  showAICopilot: false,
  showLeftPanel: true,
  history: [],
  historyIndex: -1,

  pushHistory: (objects) => {
    const { history, historyIndex } = get()
    const trimmed = history.slice(0, historyIndex + 1)
    const next = [...trimmed, objects.map((o) => ({ ...o }))]
    if (next.length > MAX_HISTORY) next.shift()
    set({ history: next, historyIndex: next.length - 1 })
  },

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return null
    const idx = historyIndex - 1
    set({ historyIndex: idx })
    return history[idx]
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return null
    const idx = historyIndex + 1
    set({ historyIndex: idx })
    return history[idx]
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  setGridSize: (size) => set({ gridSize: size }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  toggleAICopilot: () => set((s) => ({ showAICopilot: !s.showAICopilot })),
  toggleLeftPanel: () => set((s) => ({ showLeftPanel: !s.showLeftPanel })),
  resetHistory: (objects) =>
    set({ history: [objects.map((o) => ({ ...o }))], historyIndex: 0 }),
}))
