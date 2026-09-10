import { useEffect, useMemo, useState } from 'react'
import { navigateToProjects } from '../../app/router'
import { MigrationError, migrateProject } from '../../model/migrate'
import { loadProjectAssets, releaseAllAssets } from '../../persistence/assets'
import { markSaved, startAutosave } from '../../persistence/autosave'
import { readProject } from '../../persistence/db'
import { duplicateItem, loadProject, removeItem } from '../../store/actions'
import { redo, undo, useProjectStore } from '../../store/projectStore'
import { toast, useUiStore } from '../../store/uiStore'
import { useShortcuts, type ShortcutHandlers } from '../hooks/useShortcuts'
import { AddSheet } from './AddSheet'
import { ExportConfirmSheet } from './ExportConfirmSheet'
import { Filmstrip } from './Filmstrip'
import { Inspector } from './Inspector'
import { Stage } from './Stage'
import { StorePreview } from './StorePreview'
import { WidgetAdjustSheet } from './WidgetAdjustSheet'
import { TopBar } from './TopBar'
import { startExportAll } from './exportFlow'
import s from './editor.module.css'

export function Editor({ id }: { id: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'newer'>('loading')
  const items = useProjectStore((p) => p.project?.items)
  const selectedId = useUiStore((u) => u.selectedId)
  const select = useUiStore((u) => u.select)

  useEffect(() => {
    let cancelled = false
    let stopAutosave: (() => void) | undefined
    ;(async () => {
      const raw = await readProject(id)
      if (cancelled) return
      if (!raw) {
        setStatus('missing')
        return
      }
      let project
      try {
        project = migrateProject(raw)
      } catch (e) {
        setStatus(e instanceof MigrationError && e.code === 'newer' ? 'newer' : 'missing')
        return
      }
      loadProject(project)
      markSaved(project)
      stopAutosave = startAutosave()
      setStatus('ready')
      const missing = await loadProjectAssets(project)
      if (cancelled) return
      useUiStore.getState().bumpAssets()
      if (missing.length) toast(`${missing.length} screenshot${missing.length > 1 ? 's' : ''} could not be found in browser storage.`)
    })()
    return () => {
      cancelled = true
      stopAutosave?.()
      releaseAllAssets()
      loadProject(null)
      useUiStore.getState().setPreviewReport(null)
    }
  }, [id])

  const handlers = useMemo<ShortcutHandlers>(
    () => ({
      undo,
      redo,
      selectPrev: () => {
        const list = useProjectStore.getState().project?.items ?? []
        const i = list.findIndex((it) => it.id === useUiStore.getState().selectedId)
        const prev = list[Math.max(0, i - 1)]
        if (prev) select(prev.id)
      },
      selectNext: () => {
        const list = useProjectStore.getState().project?.items ?? []
        const i = list.findIndex((it) => it.id === useUiStore.getState().selectedId)
        const next = list[Math.min(list.length - 1, i + 1)]
        if (next) select(next.id)
      },
      duplicate: () => {
        const sel = useUiStore.getState().selectedId
        if (sel) duplicateItem(sel)
      },
      remove: () => {
        const sel = useUiStore.getState().selectedId
        if (sel) removeItem(sel)
      },
      exportAll: startExportAll,
      save: () => useUiStore.getState().flashSave(),
    }),
    [select],
  )
  useShortcuts(handlers, status === 'ready')

  // Keep the selection valid as items come and go.
  useEffect(() => {
    if (!items) return
    if (selectedId && items.some((it) => it.id === selectedId)) return
    select(items[0]?.id ?? null)
  }, [items, selectedId, select])

  if (status === 'loading') return <div className={s.notice} />
  if (status === 'missing' || status === 'newer') {
    return (
      <div className={s.notice}>
        <div className="t-title">{status === 'newer' ? 'This project was made with a newer version of Bezel.' : 'Project not found.'}</div>
        <button type="button" className="t-control" style={{ color: 'var(--tint)' }} onClick={navigateToProjects}>
          ‹ Back to projects
        </button>
      </div>
    )
  }

  return (
    <div className={s.root}>
      <TopBar />
      <div className={s.main}>
        <Filmstrip />
        <Stage />
        <Inspector />
      </div>
      <AddSheet />
      <ExportConfirmSheet />
      <StorePreview />
      <WidgetAdjustSheet />
    </div>
  )
}
