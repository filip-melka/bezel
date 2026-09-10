import { useEffect, useRef, useState } from 'react'
import { slotsUsed } from '../../model/clamp'
import type { Project } from '../../model/types'
import { readAsset } from '../../persistence/db'
import { renderItem, type ScreenshotImage } from '../../render/renderItem'
import { canvasSizeFor } from '../../templates/registry'
import { useUiStore } from '../../store/uiStore'
import { Button } from '../controls/Button'
import s from './projects.module.css'

type Props = {
  project: Project
  onOpen: () => void
  onRename: (name: string) => void
  onDuplicate: () => void
  onDelete: () => void
}

const THUMB_W = 84

// Renders the first slide with its own (short-lived) asset lookup, since the
// project is not open and nothing is in the shared cache.
function Thumb({ project }: { project: Project }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const assetsVersion = useUiStore((u) => u.assetsVersion)
  const first = project.items[0]
  const logical = first ? canvasSizeFor(first) : { w: 1320, h: 2868 }
  const cssW = first?.kind === 'pair' ? THUMB_W * 2 : THUMB_W
  const cssH = Math.round((cssW * logical.h) / logical.w)

  useEffect(() => {
    let cancelled = false
    let bitmap: ImageBitmap | undefined
    ;(async () => {
      const canvas = ref.current
      if (!canvas || !first) return
      const lookup = new Map<string, ScreenshotImage>()
      if (first.screenshot) {
        const rec = await readAsset(first.screenshot.assetId)
        if (rec) {
          try {
            bitmap = await createImageBitmap(rec.blob)
            lookup.set(first.screenshot.assetId, bitmap)
          } catch {
            /* render without it */
          }
        }
      }
      if (cancelled) return
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      renderItem(ctx, first, project.theme, (id) => lookup.get(id), canvas.width / logical.w, { preview: true })
    })()
    return () => {
      cancelled = true
      bitmap?.close()
    }
  }, [project, first, cssW, cssH, logical.w, assetsVersion])

  if (!first) return <div style={{ width: cssW, height: cssH, background: 'var(--fill-control)', borderRadius: 4 }} />
  return <canvas ref={ref} style={{ width: cssW, height: cssH }} aria-hidden />
}

export function ProjectCard({ project, onOpen, onRename, onDuplicate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(project.name)
  useEffect(() => setDraft(project.name), [project.name])
  const used = slotsUsed(project.items)
  const date = new Date(project.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  const commit = () => {
    setEditing(false)
    const t = draft.trim()
    if (t && t !== project.name) onRename(t)
    else setDraft(project.name)
  }

  return (
    <div className={s.card}>
      <div className={s.cardThumb} onClick={onOpen} role="button" tabIndex={0} aria-label={`Open ${project.name}`} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
        <Thumb project={project} />
      </div>
      <div className={s.cardMeta}>
        {editing ? (
          <input
            className={s.cardNameInput}
            aria-label="Project name"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(project.name)
                setEditing(false)
              }
            }}
          />
        ) : (
          <button type="button" className={s.cardName} onClick={onOpen} title={project.name}>
            {project.name}
          </button>
        )}
        <span className="t-caption">
          {used} {used === 1 ? 'slot' : 'slots'} · {date}
        </span>
      </div>
      <div className={s.cardActions}>
        <Button size="sm" variant="plain" onClick={() => setEditing(true)}>
          Rename
        </Button>
        <Button size="sm" variant="plain" onClick={onDuplicate}>
          Duplicate
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  )
}
