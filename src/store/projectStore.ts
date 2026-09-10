import { create } from 'zustand'
import { temporal } from 'zundo'
import type { Project } from '../model/types'

export type ProjectState = {
  project: Project | null
}

// Only the project is tracked by the temporal (undo) middleware. UI state
// lives in uiStore and is never undoable (SPEC §10.4).
export const useProjectStore = create<ProjectState>()(
  temporal((): ProjectState => ({ project: null }), {
    limit: 100,
    partialize: (s) => ({ project: s.project }),
    equality: (a, b) => a.project === b.project,
  }),
)

export const temporalStore = useProjectStore.temporal

export function undo(): void {
  temporalStore.getState().undo()
}

export function redo(): void {
  temporalStore.getState().redo()
}

export function pauseHistory(): void {
  temporalStore.getState().pause()
}

export function resumeHistory(): void {
  temporalStore.getState().resume()
}

export function clearHistory(): void {
  temporalStore.getState().clear()
}

export function getProject(): Project | null {
  return useProjectStore.getState().project
}
