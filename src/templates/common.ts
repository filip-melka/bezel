import { FRAME_ASPECT } from '../render/bezel'
import { LINE_HEIGHT } from '../render/fonts'
import type { SlideItem, TextStyle, TiltDirection } from '../model/types'
import type { DeviceBox, LayoutInput, TemplateLimits, TextBlock } from './types'

// Lean of a tilted template. Items saved before the direction was an option
// carry no value and read as 'left', the only direction those templates had.
export function tiltOf(item: SlideItem): TiltDirection {
  return item.tilt === 'right' ? 'right' : 'left'
}

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
  // Text to lay out; defaults to the item's own headline and subheadline.
  texts?: { headline: string; subheadline: string }
  // Styles to use; default to the resolved theme's headline and subheadline.
  styles?: { headline: TextStyle; subheadline: TextStyle }
  // Vertical offset to apply; defaults to the item's own text nudge.
  nudgeY?: number
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
  const y0 = o.y + clampNum(o.nudgeY ?? item.textNudge.offsetY, o.limits.textOffsetY)
  const head = (o.texts?.headline ?? item.headline).trim()
  const sub = (o.texts?.subheadline ?? item.subheadline).trim()
  let cursor = y0
  let headline: TextBlock | null = null
  let subheadline: TextBlock | null = null

  if (head) {
    const fit = measureText(head, o.styles?.headline ?? resolvedTheme.headline, o.w, o.headlineMaxLines)
    headline = { x: o.x, y: cursor, w: o.w, lines: fit.lines, style: fit.style, lineHeight: fit.lineHeight, shrunk: fit.shrunk }
    cursor += fit.height
  }
  if (sub) {
    if (headline) cursor += o.gap
    const fit = measureText(sub, o.styles?.subheadline ?? resolvedTheme.subheadline, o.w, o.subMaxLines)
    subheadline = { x: o.x, y: cursor, w: o.w, lines: fit.lines, style: fit.style, lineHeight: fit.lineHeight, shrunk: fit.shrunk }
    cursor += fit.height
  }
  if (!headline && !subheadline) cursor = y0 + (o.styles?.headline ?? resolvedTheme.headline).size * LINE_HEIGHT
  return { headline, subheadline, bottom: cursor }
}

export type PairTextOptions = {
  leftX: number
  rightX: number
  y: number
  w: number
  headlineMaxLines: number
  subMaxLines: number
  gap: number
  limits: TemplateLimits
}

// Lays out a pair's two text slots, one per slide, each with its own vertical
// offset. The right slot uses its own style override when set, otherwise the
// left style.
// `bottom` is the lower of the two, for placing the device below.
export function layoutPairText(input: LayoutInput, o: PairTextOptions): { left: TextStack; right: TextStack; bottom: number } {
  const { item } = input
  const base = { y: o.y, w: o.w, headlineMaxLines: o.headlineMaxLines, subMaxLines: o.subMaxLines, gap: o.gap, limits: o.limits }
  const left = layoutTextStack(input, { ...base, x: o.leftX, texts: { headline: item.headline, subheadline: item.subheadline } })
  const { resolvedTheme } = input
  const rightOverrides = item.overrides
  const right = layoutTextStack(input, {
    ...base,
    x: o.rightX,
    nudgeY: item.kind === 'pair' ? item.textNudgeRight.offsetY : 0,
    styles: {
      headline: { ...resolvedTheme.headline, ...rightOverrides.headlineRight },
      subheadline: { ...resolvedTheme.subheadline, ...rightOverrides.subheadlineRight },
    },
    texts: item.kind === 'pair' ? { headline: item.headlineRight ?? '', subheadline: item.subheadlineRight ?? '' } : { headline: '', subheadline: '' },
  })
  return { left, right, bottom: Math.max(left.bottom, right.bottom) }
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
