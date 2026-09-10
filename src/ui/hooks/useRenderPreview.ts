import { useEffect, useRef, useState, type RefObject } from 'react'
import type { SlideItem, Theme } from '../../model/types'
import { lookupAsset } from '../../persistence/assets'
import { renderItem, type RenderReport } from '../../render/renderItem'
import { canvasSizeFor } from '../../templates/registry'
import { useUiStore } from '../../store/uiStore'

const DEBOUNCE_MS = 40

type Size = { w: number; h: number }

// Size of the visible preview canvas in CSS px: fit to height with a 32 px
// margin minus the 40 px caption, never above 1:1 (DESIGN §10).
export function fitPreview(logical: Size, container: Size): { w: number; h: number; scale: number } {
  const availW = Math.max(1, container.w - 64)
  const availH = Math.max(1, container.h - 64 - 40)
  const scale = Math.min(availW / logical.w, availH / logical.h, 1)
  return { w: Math.floor(logical.w * scale), h: Math.floor(logical.h * scale), scale }
}

type Offscreen = OffscreenCanvas | HTMLCanvasElement

function makeOffscreen(w: number, h: number): Offscreen {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

// Full-res render on an offscreen canvas, debounced, then scaled onto the
// visible canvas. During drags, renders at preview scale directly (SPEC §7.2).
export function useRenderPreview(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  item: SlideItem | null,
  theme: Theme | null,
  container: Size,
): RenderReport | null {
  const [report, setReport] = useState<RenderReport | null>(null)
  const offscreen = useRef<Offscreen | null>(null)
  const dragging = useUiStore((u) => u.dragging)
  const assetsVersion = useUiStore((u) => u.assetsVersion)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !item || !theme) return
    const logical = canvasSizeFor(item)
    const fit = fitPreview(logical, container)
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const bw = Math.max(1, Math.round(fit.w * dpr))
    const bh = Math.max(1, Math.round(fit.h * dpr))
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw
      canvas.height = bh
    }
    canvas.style.width = `${fit.w}px`
    canvas.style.height = `${fit.h}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (dragging) {
      // Fast path: draw at preview scale straight onto the visible canvas.
      if (timer.current) clearTimeout(timer.current)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      renderItem(ctx, item, theme, lookupAsset, bw / logical.w, { preview: true })
      return
    }

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      let off = offscreen.current
      if (!off || off.width !== logical.w || off.height !== logical.h) {
        off = makeOffscreen(logical.w, logical.h)
        offscreen.current = off
      }
      const octx = off.getContext('2d') as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null
      if (!octx) return
      octx.setTransform(1, 0, 0, 1, 0, 0)
      const r = renderItem(octx, item, theme, lookupAsset, 1, { preview: true })
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(off, 0, 0, bw, bh)
      setReport(r)
    }, DEBOUNCE_MS)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [canvasRef, item, theme, container.w, container.h, dragging, assetsVersion])

  return report
}
