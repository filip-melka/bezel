import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { WidgetCrop } from '../../model/types'
import { lookupAsset } from '../../persistence/assets'
import { setWidget } from '../../store/actions'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { templateFor } from '../../templates/registry'
import { detectWidgetForItem } from '../../widgets/run'
import { Button } from '../controls/Button'
import { Sheet } from '../controls/Sheet'
import s from './editor.module.css'

const VIEW_H = 560
const HANDLE = 14
const MIN_SIZE = 40

type Drag = { mode: 'move' | 'nw' | 'ne' | 'sw' | 'se'; startX: number; startY: number; start: WidgetCrop }

function clampCrop(c: WidgetCrop, iw: number, ih: number): WidgetCrop {
  const w = Math.max(MIN_SIZE, Math.min(iw, c.w))
  const h = Math.max(MIN_SIZE, Math.min(ih, c.h))
  const x = Math.min(Math.max(0, c.x), iw - w)
  const y = Math.min(Math.max(0, c.y), ih - h)
  return { ...c, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }
}

// Manual adjustment of the widget crop: drag to move, corner handles to
// resize, a radius field, and a re-run of the detector.
export function WidgetAdjustSheet() {
  const open = useUiStore((u) => u.sheet === 'widget')
  const close = useUiStore((u) => u.closeSheet)
  const selectedId = useUiStore((u) => u.selectedId)
  const assetsVersion = useUiStore((u) => u.assetsVersion)
  const item = useProjectStore((p) => p.project?.items.find((it) => it.id === selectedId) ?? null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [crop, setCrop] = useState<WidgetCrop | null>(null)
  const [view, setView] = useState({ w: 0, h: 0, k: 1 })
  // The Sheet mounts its children a frame after `open` flips, so the canvas
  // draw effect needs a second pass once the element exists.
  const [mountTick, setMountTick] = useState(0)
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => setMountTick((t) => t + 1))
    return () => cancelAnimationFrame(id)
  }, [open])
  const drag = useRef<Drag | null>(null)
  const kind = item ? templateFor(item).widgetKind : undefined
  const img = item?.screenshot ? lookupAsset(item.screenshot.assetId) : undefined

  // Seed local crop from the item when the sheet opens.
  useEffect(() => {
    if (!open || !item || !kind) return
    const existing = item.widget?.crop
    if (existing && existing.kind === kind) setCrop(existing)
    else if (item.screenshot) {
      const iw = item.screenshot.width
      const ih = item.screenshot.height
      setCrop(
        kind === 'island'
          ? { kind, x: Math.round(iw * 0.035), y: Math.round(ih * 0.012), w: Math.round(iw * 0.93), h: Math.round(ih * 0.14), radius: Math.round(iw * 0.06) }
          : { kind, x: Math.round(iw * 0.036), y: Math.round(ih * 0.72), w: Math.round(iw * 0.928), h: Math.round(ih * 0.12), radius: Math.round(iw * 0.06) },
      )
    }
  }, [open, item, kind])

  // Draw the screenshot scaled to fit.
  useEffect(() => {
    const c = canvasRef.current
    if (!open || !c || !img) return
    const k = Math.min(VIEW_H / img.height, 640 / img.width)
    const w = Math.round(img.width * k)
    const h = Math.round(img.height * k)
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    c.style.width = `${w}px`
    c.style.height = `${h}px`
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.drawImage(img, 0, 0, w, h)
    setView({ w, h, k })
  }, [open, img, assetsVersion, mountTick])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, mode: Drag['mode']) => {
      if (!crop) return
      e.preventDefault()
      e.stopPropagation()
      ;(e.currentTarget.closest('[data-adjust-root]') as HTMLElement | null)?.setPointerCapture(e.pointerId)
      drag.current = { mode, startX: e.clientX, startY: e.clientY, start: crop }
    },
    [crop],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = drag.current
      if (!d || !img) return
      const dx = (e.clientX - d.startX) / view.k
      const dy = (e.clientY - d.startY) / view.k
      const st = d.start
      let next: WidgetCrop
      switch (d.mode) {
        case 'move':
          next = { ...st, x: st.x + dx, y: st.y + dy }
          break
        case 'nw':
          next = { ...st, x: st.x + dx, y: st.y + dy, w: st.w - dx, h: st.h - dy }
          break
        case 'ne':
          next = { ...st, y: st.y + dy, w: st.w + dx, h: st.h - dy }
          break
        case 'sw':
          next = { ...st, x: st.x + dx, w: st.w - dx, h: st.h + dy }
          break
        default:
          next = { ...st, w: st.w + dx, h: st.h + dy }
      }
      setCrop(clampCrop(next, img.width, img.height))
    },
    [img, view.k],
  )

  const endDrag = useCallback(() => {
    drag.current = null
  }, [])

  const apply = () => {
    if (!item || !crop) return
    setWidget(item.id, { crop, notFound: false })
    close()
  }

  const redetect = async () => {
    if (!item) return
    const found = await detectWidgetForItem(item.id)
    if (found) {
      const fresh = useProjectStore.getState().project?.items.find((it) => it.id === item.id)?.widget?.crop
      if (fresh) setCrop(fresh)
    }
  }

  if (!item || !kind) return null
  const title = kind === 'island' ? 'Adjust the Dynamic Island crop' : 'Adjust the Live Activity crop'
  const box = crop ? { left: crop.x * view.k, top: crop.y * view.k, width: crop.w * view.k, height: crop.h * view.k } : null

  return (
    <Sheet open={open} onClose={close} title={title} width={720}>
      {!img ? (
        <p className={s.hint}>Add a screenshot first.</p>
      ) : (
        <div className={s.adjustWrap}>
          <div
            className={s.adjustRoot}
            data-adjust-root
            style={{ width: view.w, height: view.h }}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <canvas ref={canvasRef} className={s.adjustCanvas} aria-label="Screenshot" />
            {box ? (
              <div
                className={s.adjustBox}
                style={{ ...box, borderRadius: Math.max(2, (crop!.radius * view.k) | 0) }}
                onPointerDown={(e) => onPointerDown(e, 'move')}
                role="img"
                aria-label="Widget crop area, drag to move"
              >
                {(['nw', 'ne', 'sw', 'se'] as const).map((h) => (
                  <div
                    key={h}
                    className={[s.adjustHandle, s[`handle_${h}`]].join(' ')}
                    style={{ width: HANDLE, height: HANDLE }}
                    onPointerDown={(e) => onPointerDown(e, h)}
                    aria-label={`Resize ${h}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
          <div className={s.adjustSide}>
            <p className={s.hint} style={{ padding: 0 }}>
              Drag the box to move it, drag a corner to resize. Values are in screenshot pixels.
            </p>
            {crop ? (
              <div className={s.adjustFields}>
                {(['x', 'y', 'w', 'h', 'radius'] as const).map((f) => (
                  <label key={f} className={s.adjustField}>
                    <span>{f === 'radius' ? 'Corner radius' : f.toUpperCase()}</span>
                    <input
                      type="number"
                      className={s.stopOffset}
                      value={crop[f]}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0
                        const next = { ...crop, [f]: f === 'radius' ? Math.max(0, v) : v }
                        setCrop(f === 'radius' ? next : clampCrop(next, img.width, img.height))
                      }}
                    />
                  </label>
                ))}
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
              <Button onClick={() => void redetect()}>Detect again</Button>
              <span style={{ flex: 1 }} />
              <Button onClick={close}>Cancel</Button>
              <Button variant="primary" onClick={apply} disabled={!crop}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  )
}
