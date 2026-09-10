import { useEffect } from 'react'

export type ShortcutHandlers = {
  undo: () => void
  redo: () => void
  selectPrev: () => void
  selectNext: () => void
  duplicate: () => void
  remove: () => void
  exportAll: () => void
  save: () => void
}

export function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

// SPEC §9.7 keyboard shortcuts.
export function useShortcuts(h: ShortcutHandlers, enabled = true): void {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const inText = isTextField(e.target)
      const key = e.key.toLowerCase()
      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) h.redo()
        else h.undo()
        return
      }
      if (mod && key === 'y') {
        e.preventDefault()
        h.redo()
        return
      }
      if (mod && key === 'd') {
        e.preventDefault()
        h.duplicate()
        return
      }
      if (mod && key === 'e') {
        e.preventDefault()
        h.exportAll()
        return
      }
      if (mod && key === 's') {
        e.preventDefault()
        h.save()
        return
      }
      if (inText || mod) return
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        h.selectPrev()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        h.selectNext()
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        h.remove()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [h, enabled])
}
