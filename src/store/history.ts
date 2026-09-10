import { pauseHistory, resumeHistory, temporalStore, useProjectStore, type ProjectState } from './projectStore'
import { useUiStore } from './uiStore'

// Batches a run of edits (a slider drag, a typing session in a text field)
// into one undo entry (SPEC §10.4). The pre-batch state is pushed explicitly,
// tracking is paused for the duration, and the entry is dropped again if the
// batch ended up changing nothing.
let batchEntry: ProjectState | null = null
let depth = 0

export function beginBatch(opts: { dragging?: boolean } = {}): void {
  depth += 1
  if (depth > 1) return
  const pre = useProjectStore.getState()
  batchEntry = { project: pre.project }
  temporalStore.setState((s) => ({
    pastStates: [...s.pastStates, batchEntry!].slice(-100),
    futureStates: [],
  }))
  pauseHistory()
  if (opts.dragging) useUiStore.getState().setDragging(true)
}

export function endBatch(): void {
  if (depth === 0) return
  depth -= 1
  if (depth > 0) return
  resumeHistory()
  useUiStore.getState().setDragging(false)
  const entry = batchEntry
  batchEntry = null
  if (!entry) return
  const past = temporalStore.getState().pastStates
  const top = past[past.length - 1]
  if (top === entry && useProjectStore.getState().project === entry.project) {
    temporalStore.setState({ pastStates: past.slice(0, -1) })
  }
}

export const dragHandlers = {
  onDragStart: () => beginBatch({ dragging: true }),
  onDragEnd: () => endBatch(),
}

export const focusHandlers = {
  onFocus: () => beginBatch(),
  onBlur: () => endBatch(),
}
