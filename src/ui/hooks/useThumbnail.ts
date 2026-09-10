import { useEffect, useRef, useState } from 'react'
import type { SlideItem, Theme } from '../../model/types'
import { lookupAsset } from '../../persistence/assets'
import { renderItem, type RenderReport } from '../../render/renderItem'
import { canvasSizeFor } from '../../templates/registry'
import { useUiStore } from '../../store/uiStore'

// Renders a small thumbnail on commit (not during drags). `cssWidth` is the
// on-screen width in CSS px; the backing store follows devicePixelRatio.
export function useThumbnail(item: SlideItem, theme: Theme, cssWidth: number) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [report, setReport] = useState<RenderReport | null>(null)
  const dragging = useUiStore((u) => u.dragging)
  const assetsVersion = useUiStore((u) => u.assetsVersion)
  const logical = canvasSizeFor(item)
  const cssHeight = Math.round((cssWidth * logical.h) / logical.w)

  useEffect(() => {
    if (dragging) return
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const bw = Math.round(cssWidth * dpr)
    const bh = Math.round(cssHeight * dpr)
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw
      canvas.height = bh
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    setReport(renderItem(ctx, item, theme, lookupAsset, bw / logical.w, { preview: true }))
  }, [item, theme, cssWidth, cssHeight, dragging, assetsVersion, logical.w])

  return { ref, report, cssWidth, cssHeight }
}
