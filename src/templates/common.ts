import { FRAME_ASPECT } from '../render/bezel'
import { LINE_HEIGHT } from '../render/fonts'
import type { DeviceBox, LayoutInput, TemplateLimits, TextBlock } from './types'

export function clampNum(v: number, [lo, hi]: [number, number]): number {
  if (Number.isNaN(v)) return lo
  return Math.min(hi, Math.max(lo, v))
}

export type TextStackOptions = {
  x: number
  y: number
  w: number
  headlineMaxLines: number
  subMaxLines: number
  gap: number
  limits: TemplateLimits
}

export type TextStack = {
  headline: TextBlock | null
  subheadline: TextBlock | null
  // Bottom edge of the text, used to place the device below it. When both
  // fields are empty this is where a one-line headline would have ended, so
  // device placement stays consistent across the set (SPEC §11).
  bottom: number
}

// Lays out headline then subheadline. An empty headline lets the subheadline
// move up into the headline position (SPEC §11).
export function layoutTextStack(input: LayoutInput, o: TextStackOptions): TextStack {
  const { item, resolvedTheme, measureText } = input
  const y0 = o.y + clampNum(item.textNudge.offsetY, o.limits.textOffsetY)
  const head = item.headline.trim()
  const sub = item.subheadline.trim()
  let cursor = y0
  let headline: TextBlock | null = null
  let subheadline: TextBlock | null = null

  if (head) {
    const fit = measureText(head, resolvedTheme.headline, o.w, o.headlineMaxLines)
    headline = { x: o.x, y: cursor, w: o.w, lines: fit.lines, style: fit.style, lineHeight: fit.lineHeight, shrunk: fit.shrunk }
    cursor += fit.height
  }
  if (sub) {
    if (headline) cursor += o.gap
    const fit = measureText(sub, resolvedTheme.subheadline, o.w, o.subMaxLines)
    subheadline = { x: o.x, y: cursor, w: o.w, lines: fit.lines, style: fit.style, lineHeight: fit.lineHeight, shrunk: fit.shrunk }
    cursor += fit.height
  }
  if (!headline && !subheadline) cursor = y0 + resolvedTheme.headline.size * LINE_HEIGHT
  return { headline, subheadline, bottom: cursor }
}

export function deviceFromWidth(w: number, centerX: number, top: number, rotation = 0): DeviceBox {
  const h = w / FRAME_ASPECT
  return { x: centerX - w / 2, y: top, w, h, rotation }
}

export function deviceFromHeight(h: number, centerX: number, centerY: number, rotation = 0): DeviceBox {
  const w = h * FRAME_ASPECT
  return { x: centerX - w / 2, y: centerY - h / 2, w, h, rotation }
}

// Axis-aligned bounding box size of a w×h box rotated by `deg`.
export function rotatedBounds(w: number, h: number, deg: number): { w: number; h: number } {
  const r = (deg * Math.PI) / 180
  const c = Math.abs(Math.cos(r))
  const s = Math.abs(Math.sin(r))
  return { w: w * c + h * s, h: w * s + h * c }
}
