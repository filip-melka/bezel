import { pauseHistory, resumeHistory, temporalStore, useProjectStore, type ProjectState } from './projectStore'
import { useUiStore } from './uiStore'

// Batches a run of edits (a slider drag, a typing session in a text field)
// into one undo entry (SPEC §10.4). The pre-batch state is pushed explicitly,
// tracking is paused for the duration, and the entry is dropped again if the
// batch ended up changing nothing.
let batchEntry: ProjectState | null = null
let depth = 0

export function beginBatch(): void {
  depth += 1
  if (depth > 1) return
  const pre = useProjectStore.getState()
  batchEntry = { project: pre.project }
  temporalStore.setState((s) => ({
    pastStates: [...s.pastStates, batchEntry!].slice(-100),
    futureStates: [],
  }))
  pauseHistory()
}

export function endBatch(): void {
  if (depth === 0) return
  depth -= 1
  if (depth > 0) return
  resumeHistory()
  const entry = batchEntry
  batchEntry = null
  if (!entry) return
  const past = temporalStore.getState().pastStates
  const top = past[past.length - 1]
  if (top === entry && useProjectStore.getState().project === entry.project) {
    temporalStore.setState({ pastStates: past.slice(0, -1) })
  }
}

// Pointer drags additionally set the UI "dragging" flag so previews render at
// preview scale and thumbnails wait. A drag ends on the element's pointer-up
// OR on a window-level pointer-up / cancel / blur, whichever comes first, so
// releasing outside the control can never leave the flag stuck.
let dragActive = false

function endDrag(): void {
  if (!dragActive) return
  dragActive = false
  window.removeEventListener('pointerup', endDrag, true)
  window.removeEventListener('pointercancel', endDrag, true)
  window.removeEventListener('blur', endDrag)
  useUiStore.getState().setDragging(false)
  endBatch()
}

function beginDrag(): void {
  if (dragActive) return
  dragActive = true
  beginBatch()
  useUiStore.getState().setDragging(true)
  window.addEventListener('pointerup', endDrag, true)
  window.addEventListener('pointercancel', endDrag, true)
  window.addEventListener('blur', endDrag)
}

// Clears any batch or drag left over from a previous editing session.
export function resetBatches(): void {
  dragActive = false
  window.removeEventListener('pointerup', endDrag, true)
  window.removeEventListener('pointercancel', endDrag, true)
  window.removeEventListener('blur', endDrag)
  depth = 0
  batchEntry = null
  resumeHistory()
  useUiStore.getState().setDragging(false)
}

export const dragHandlers = {
  onDragStart: beginDrag,
  onDragEnd: endDrag,
}

export const focusHandlers = {
  onFocus: () => beginBatch(),
  onBlur: () => endBatch(),
}
