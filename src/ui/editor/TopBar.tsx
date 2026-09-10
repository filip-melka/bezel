import { useEffect, useState } from 'react'
import { navigateToProjects } from '../../app/router'
import { renameProject } from '../../store/actions'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { Button } from '../controls/Button'
import { ExportMenu } from './ExportMenu'
import s from './editor.module.css'

export function TopBar() {
  const name = useProjectStore((p) => p.project?.name ?? '')
  const memoryOnly = useUiStore((u) => u.memoryOnly)
  const saveFlashAt = useUiStore((u) => u.saveFlashAt)
  const setStorePreview = useUiStore((u) => u.setStorePreview)
  const [flash, setFlash] = useState(false)
  const [draft, setDraft] = useState(name)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) setDraft(name)
  }, [name, editing])

  useEffect(() => {
    if (!saveFlashAt) return
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 800)
    return () => clearTimeout(t)
  }, [saveFlashAt])

  const commit = () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== name) renameProject(trimmed)
    else setDraft(name)
  }

  return (
    <header className={s.topbar}>
      <div className={s.topbarLeft}>
        <Button variant="plain" onClick={navigateToProjects}>
          ‹ Projects
        </Button>
        {memoryOnly ? (
          <span className="t-caption" role="status">
            Autosave is unavailable in this browser mode
          </span>
        ) : null}
      </div>
      <div className={s.topbarCenter}>
        <input
          className={s.nameInput}
          aria-label="Project name"
          value={draft}
          onFocus={() => setEditing(true)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur()
          }}
        />
        <span className={[s.autosaved, flash ? s.flash : ''].join(' ')} aria-live="polite">
          {memoryOnly ? 'Not saved' : 'Autosaved'}
        </span>
      </div>
      <div className={s.topbarRight}>
        <Button onClick={() => setStorePreview(true)}>Preview</Button>
        <ExportMenu />
      </div>
    </header>
  )
}
