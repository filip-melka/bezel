import type { SlideItem, Theme } from '../model/types'
import { renderItem, type AssetLookup } from '../render/renderItem'
import { canvasSizeFor } from '../templates/registry'

export class ExportError extends Error {}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new ExportError('Export failed, try a smaller set'))
    }, 'image/png')
  })
}

// Renders one item at full resolution. A pair yields two 1320×2868 PNGs, the
// left and right halves of one 2640-wide render (SPEC §4).
export async function renderItemToPngs(item: SlideItem, theme: Theme, assets: AssetLookup): Promise<Blob[]> {
  const { w, h } = canvasSizeFor(item)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ExportError('Export failed, canvas unavailable')
  renderItem(ctx, item, theme, assets, 1)

  if (item.kind === 'slide') return [await toBlob(canvas)]

  const halves: Blob[] = []
  for (const side of [0, 1]) {
    const half = document.createElement('canvas')
    half.width = 1320
    half.height = h
    const hctx = half.getContext('2d')
    if (!hctx) throw new ExportError('Export failed, canvas unavailable')
    hctx.drawImage(canvas, side * 1320, 0, 1320, h, 0, 0, 1320, h)
    halves.push(await toBlob(half))
  }
  return halves
}
