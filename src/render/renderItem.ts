import { resolveTheme } from '../model/defaults'
import type { SlideItem, Theme } from '../model/types'
import { canvasSizeFor, templateFor } from '../templates/registry'
import type { DeviceBox, TextBlock, WidgetLayout } from '../templates/types'
import { fillBackground } from './background'
import {
  FRAME_H,
  FRAME_W,
  SCREEN_H,
  SCREEN_W,
  SCREEN_X,
  SCREEN_Y,
  getBezelImage,
  traceBodyPath,
  traceScreenPath,
} from './bezel'
import { FONT_FAMILY, fontString } from './fonts'
import { drawHomePlaceholder, drawLockPlaceholder } from './placeholders'
import { fitText } from './text'

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
export type ScreenshotImage = ImageBitmap | HTMLImageElement | HTMLCanvasElement
export type AssetLookup = (assetId: string) => ScreenshotImage | undefined

export type RenderReport = {
  textShrunk: boolean
  screenshotAspectMismatch: boolean
  missingScreenshot: boolean
}

export type RenderOptions = {
  // Preview-only affordances (placeholder label). Never set for export.
  preview?: boolean
}

const SCREEN_ASPECT = SCREEN_W / SCREEN_H
export const ASPECT_TOLERANCE = 0.01

export function aspectMismatch(w: number, h: number): boolean {
  const a = w / h
  return Math.abs(a - SCREEN_ASPECT) / SCREEN_ASPECT > ASPECT_TOLERANCE
}

// The one render function (SPEC §7). Draws `item` at logical 1320×2868 (or
// 2640×2868 for a pair) scaled by `scale` into `ctx`.
export function renderItem(
  ctx: Ctx2D,
  item: SlideItem,
  theme: Theme,
  assets: AssetLookup,
  scale: number,
  opts: RenderOptions = {},
): RenderReport {
  const report: RenderReport = { textShrunk: false, screenshotAspectMismatch: false, missingScreenshot: false }
  const resolvedTheme = resolveTheme(theme, item.overrides)
  const { w: canvasW, h: canvasH } = canvasSizeFor(item)
  const template = templateFor(item)
  const screenshot = item.screenshot ? assets(item.screenshot.assetId) : undefined
  const screenshotSize = item.screenshot ? { w: item.screenshot.width, h: item.screenshot.height } : null

  ctx.save()
  ctx.scale(scale, scale)

  fillBackground(ctx, resolvedTheme.background, canvasW, canvasH)

  const layout = template.layout({
    canvasW,
    canvasH,
    item,
    resolvedTheme,
    screenshotSize,
    measureText: (text, style, maxWidth, maxLines) =>
      fitText(text, style, maxWidth, maxLines, (s, font) => {
        ctx.font = font
        return ctx.measureText(s).width
      }),
  })

  if (layout.device) {
    drawDevice(ctx, layout.device, screenshot, resolvedTheme, scale, opts.preview === true, layout.screenDim ?? 0, layout.screenPlaceholder ?? null, layout.screenPlaceholderColor ?? null)
    if (!screenshot) report.missingScreenshot = true
    else if (aspectMismatch(screenshot.width, screenshot.height)) report.screenshotAspectMismatch = true
  }

  if (layout.widget && screenshot) drawWidget(ctx, layout.widget, screenshot, scale)

  for (const block of [layout.headline, layout.subheadline, layout.headlineRight, layout.subheadlineRight]) {
    if (!block) continue
    drawTextBlock(ctx, block)
    if (block.shrunk) report.textShrunk = true
  }

  ctx.restore()
  return report
}

function drawDevice(
  ctx: Ctx2D,
  box: DeviceBox,
  screenshot: ScreenshotImage | undefined,
  theme: Theme,
  scale: number,
  preview: boolean,
  screenDim: number,
  placeholder: 'lock' | 'home' | null,
  placeholderColor: string | null,
): void {
  ctx.save()
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  ctx.translate(cx, cy)
  if (box.rotation) ctx.rotate((box.rotation * Math.PI) / 180)
  ctx.translate(-box.w / 2, -box.h / 2)
  const s = box.w / FRAME_W
  ctx.scale(s, s)
  // From here on, coordinates are frame-space (FRAME_W × FRAME_H).

  if (theme.bezel.shadow) {
    ctx.save()
    // Shadow blur and offset ignore the current transform, so they are
    // expressed in device pixels: logical px × render scale.
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 60 * scale
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 30 * scale
    ctx.fillStyle = '#000'
    traceBodyPath(ctx)
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  traceScreenPath(ctx)
  ctx.clip()
  if (placeholder) {
    if (placeholder === 'lock') drawLockPlaceholder(ctx, placeholderColor)
    else drawHomePlaceholder(ctx, placeholderColor)
  } else if (screenshot) {
    // Alpha composites over black (SPEC §11).
    ctx.fillStyle = '#000'
    ctx.fillRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H)
    const iw = screenshot.width
    const ih = screenshot.height
    const cover = Math.max(SCREEN_W / iw, SCREEN_H / ih)
    const dw = iw * cover
    const dh = ih * cover
    const dx = SCREEN_X + (SCREEN_W - dw) / 2
    const dy = SCREEN_Y + (SCREEN_H - dh) / 2
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(screenshot, dx, dy, dw, dh)
    if (screenDim > 0) {
      ctx.fillStyle = `rgba(0,0,0,${screenDim})`
      ctx.fillRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H)
    }
  } else {
    ctx.fillStyle = preview ? '#1f1f1f' : '#000'
    ctx.fillRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H)
    if (preview) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = `500 56px ${FONT_FAMILY}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Drop screenshot', SCREEN_X + SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2)
    }
  }
  ctx.restore()

  const frame = getBezelImage(theme.bezel.finish)
  if (frame) {
    ctx.drawImage(frame, 0, 0, FRAME_W, FRAME_H)
  } else {
    // Bezel image not loaded yet: draw a plain outline so the layout still reads.
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 44
    traceBodyPath(ctx)
    ctx.stroke()
  }
  ctx.restore()
}

function drawTextBlock(ctx: Ctx2D, block: TextBlock): void {
  ctx.save()
  ctx.font = fontString(block.style)
  ctx.fillStyle = block.style.color
  ctx.textAlign = block.style.align
  ctx.textBaseline = 'middle'
  const x = block.style.align === 'left' ? block.x : block.style.align === 'right' ? block.x + block.w : block.x + block.w / 2
  block.lines.forEach((line, i) => {
    ctx.fillText(line, x, block.y + i * block.lineHeight + block.lineHeight / 2)
  })
  ctx.restore()
}

// Draws a Live Activity cut-out (a rounded crop of the screenshot) with a
// drop shadow, plus an optional dashed ghost outline at its original spot.
function drawWidget(ctx: Ctx2D, widget: WidgetLayout, screenshot: ScreenshotImage, scale: number): void {
  const { box, radius, crop, ghost } = widget
  if (ghost) {
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 4
    ctx.setLineDash([20, 14])
    ctx.beginPath()
    ctx.roundRect(ghost.x, ghost.y, ghost.w, ghost.h, ghost.radius)
    ctx.stroke()
    ctx.restore()
  }
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 50 * scale
  ctx.shadowOffsetY = 24 * scale
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.roundRect(box.x, box.y, box.w, box.h, radius)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(box.x, box.y, box.w, box.h, radius)
  ctx.clip()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(screenshot, crop.x, crop.y, crop.w, crop.h, box.x, box.y, box.w, box.h)
  ctx.restore()
}
