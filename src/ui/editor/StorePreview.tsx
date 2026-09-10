import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { exportNumbers, pad2 } from '../../model/clamp'
import type { Project, SlideItem, Theme } from '../../model/types'
import { lookupAsset } from '../../persistence/assets'
import { renderItem } from '../../render/renderItem'
import { canvasSizeFor } from '../../templates/registry'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { Button } from '../controls/Button'
import { LogoTile } from '../controls/Logo'
import s from './editor.module.css'

const SLOT_W = 250

// Renders one item into one canvas per exported slot, at the preview width.
function renderSlots(item: SlideItem, theme: Theme, cssW: number, dpr: number): HTMLCanvasElement[] {
  const logical = canvasSizeFor(item)
  const slotW = Math.round(cssW * dpr)
  const slotH = Math.round((slotW * logical.h) / 1320)
  const full = document.createElement('canvas')
  full.width = item.kind === 'pair' ? slotW * 2 : slotW
  full.height = slotH
  const ctx = full.getContext('2d')
  if (!ctx) return []
  renderItem(ctx, item, theme, lookupAsset, full.width / logical.w)
  if (item.kind === 'slide') return [full]
  return [0, 1].map((side) => {
    const half = document.createElement('canvas')
    half.width = slotW
    half.height = slotH
    half.getContext('2d')?.drawImage(full, side * slotW, 0, slotW, slotH, 0, 0, slotW, slotH)
    return half
  })
}

function CanvasView({ source, cssW, label }: { source: HTMLCanvasElement; cssW: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    c.width = source.width
    c.height = source.height
    c.getContext('2d')?.drawImage(source, 0, 0)
  }, [source])
  const cssH = Math.round((cssW * source.height) / source.width)
  return <canvas ref={ref} className={s.storeSlot} style={{ width: cssW, height: cssH }} aria-label={label} />
}

function useSlots(project: Project | null, assetsVersion: number) {
  return useMemo(() => {
    if (!project) return []
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const numbers = exportNumbers(project.items)
    const out: Array<{ key: string; canvas: HTMLCanvasElement; label: string }> = []
    for (const item of project.items) {
      const start = numbers.get(item.id)?.start ?? 1
      renderSlots(item, project.theme, SLOT_W, dpr).forEach((canvas, i) => {
        out.push({ key: `${item.id}-${i}`, canvas, label: `Screenshot ${pad2(start + i)}` })
      })
    }
    return out
    // assetsVersion is a deliberate re-render trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, assetsVersion])
}

// Full-screen mock of an App Store product page so the set can be judged as
// shoppers will see it: rounded screenshots side by side with small gaps.
export function StorePreview() {
  const open = useUiStore((u) => u.storePreview)
  const close = useUiStore((u) => u.setStorePreview)
  const assetsVersion = useUiStore((u) => u.assetsVersion)
  const project = useProjectStore((p) => p.project)
  const slots = useSlots(open ? project : null, assetsVersion)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close(false)
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, close])

  if (!open || !project) return null
  return createPortal(
    <div className={s.store} role="dialog" aria-modal="true" aria-label="App Store preview">
      <div className={s.storeBar}>
        <span className="t-title">App Store preview</span>
        <span className="t-caption">How the set reads on the product page. Panoramas span two adjacent screenshots.</span>
        <Button onClick={() => close(false)} autoFocus>
          Done
        </Button>
      </div>
      <div className={s.storePage}>
        <div className={s.storeHeader}>
          <div className={s.storeIcon} aria-hidden>
            <LogoTile size={118} />
          </div>
          <div className={s.storeTitle}>
            <div className={s.storeName}>{project.name}</div>
            <div className={s.storeSub}>Your app subtitle</div>
            <div className={s.storeGet}>GET</div>
          </div>
        </div>
        <div className={s.storeSection}>Preview</div>
        <div className={s.storeStrip}>
          {slots.map((slot) => (
            <CanvasView key={slot.key} source={slot.canvas} cssW={SLOT_W} label={slot.label} />
          ))}
          {slots.length === 0 ? <span className="t-caption">No slides to preview.</span> : null}
        </div>
        <div className={s.storeFooter}>iPhone · {slots.length} of 10 screenshots</div>
      </div>
    </div>,
    document.body,
  )
}
