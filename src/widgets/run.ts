import { lookupAsset } from '../persistence/assets'
import type { ScreenshotImage } from '../render/renderItem'
import { setWidget } from '../store/actions'
import { getProject } from '../store/projectStore'
import { toast } from '../store/uiStore'
import { widgetKindOf } from '../templates/widget'
import { detectWidget, type Pixels } from './detect'

// Reads the pixels of a decoded screenshot for the detector.
export function readPixels(img: ScreenshotImage): Pixels {
  const w = img.width
  const h = img.height
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null
  if (!ctx) throw new Error('canvas unavailable')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, w, h)
  return { width: w, height: h, data: data.data }
}

// Runs detection for the item's selected Live Activity kind and stores the
// result. Returns true when a widget was found. A miss is recorded so the
// inspector can say so.
export async function detectWidgetForItem(itemId: string, quiet = false): Promise<boolean> {
  const item = getProject()?.items.find((it) => it.id === itemId)
  if (!item || !item.screenshot) return false
  const kind = widgetKindOf(item)
  if (!kind) return false
  const img = lookupAsset(item.screenshot.assetId)
  if (!img) return false
  // Yield so the UI can paint before a few hundred ms of pixel work.
  await new Promise((r) => setTimeout(r, 0))
  let crop = null
  try {
    crop = detectWidget(readPixels(img), kind)
  } catch (e) {
    console.error('widget detection failed', e)
  }
  setWidget(itemId, { crop, notFound: !crop })
  if (!crop && !quiet) {
    toast(kind === 'island' ? "Couldn't find an expanded Dynamic Island. Adjust it manually." : "Couldn't find a Live Activity card. Adjust it manually.")
  }
  return !!crop
}
