import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { Button } from '../controls/Button'
import { exportSelected, startExportAll } from './exportFlow'
import s from './editor.module.css'

export function ExportMenu() {
  const [open, setOpen] = useState(false)
  const progress = useUiStore((u) => u.exportProgress)
  const doneAt = useUiStore((u) => u.exportDoneAt)
  const selectedId = useUiStore((u) => u.selectedId)
  const count = useProjectStore((p) => p.project?.items.length ?? 0)
  const [showDone, setShowDone] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!doneAt) return
    setShowDone(true)
    const t = setTimeout(() => setShowDone(false), 1200)
    return () => clearTimeout(t)
  }, [doneAt])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (progress) {
    const pct = progress.total ? (progress.done / progress.total) * 100 : 0
    return (
      <div className={s.progress} role="status" aria-live="polite">
        <span>
          Rendering {Math.min(progress.done + 1, progress.total)} of {progress.total}
        </span>
        <div className={s.progressBar} aria-hidden>
          <div className={s.progressFill} style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className={s.exportWrap} ref={root}>
      <Button variant="primary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} disabled={count === 0}>
        {showDone ? '✓ Exported' : 'Export ▾'}
      </Button>
      {open ? (
        <div className={s.menu} role="menu">
          <button
            type="button"
            role="menuitem"
            className={s.menuItem}
            disabled={!selectedId}
            onClick={() => {
              setOpen(false)
              void exportSelected()
            }}
          >
            Download this slide
          </button>
          <button
            type="button"
            role="menuitem"
            className={s.menuItem}
            onClick={() => {
              setOpen(false)
              startExportAll()
            }}
          >
            Download all as ZIP
          </button>
        </div>
      ) : null}
    </div>
  )
}
