import type { Project } from '../model/types'
import { useProjectStore } from '../store/projectStore'
import { writeProject } from './db'

const DEBOUNCE_MS = 500

let timer: ReturnType<typeof setTimeout> | undefined
let chain: Promise<void> = Promise.resolve()
let pendingProject: Project | null = null
let lastSaved: Project | null = null

function enqueue(project: Project): void {
  chain = chain
    .then(() => writeProject(project))
    .then(() => {
      lastSaved = project
    })
    .catch((e) => {
      console.error('autosave failed', e)
    })
}

function schedule(project: Project): void {
  pendingProject = project
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = undefined
    if (pendingProject && pendingProject !== lastSaved) enqueue(pendingProject)
    pendingProject = null
  }, DEBOUNCE_MS)
}

// Subscribes to project changes. Writes are debounced 500 ms and serialized
// so a slow write never races a newer one (SPEC §10.2).
export function startAutosave(): () => void {
  const unsub = useProjectStore.subscribe((state, prev) => {
    if (state.project && state.project !== prev.project) schedule(state.project)
  })
  return () => {
    unsub()
    void flushAutosave()
  }
}

// Writes any pending project immediately and waits for the queue to drain.
export function flushAutosave(): Promise<void> {
  if (timer) {
    clearTimeout(timer)
    timer = undefined
  }
  if (pendingProject && pendingProject !== lastSaved) enqueue(pendingProject)
  pendingProject = null
  return chain
}

export function markSaved(project: Project): void {
  lastSaved = project
}
