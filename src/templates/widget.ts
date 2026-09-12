import { CANVAS_H, CANVAS_W, type SlideItem, type WidgetCrop, type WidgetKind } from '../model/types'
import { FRAME_ASPECT } from '../render/bezel'
import { mapRect, screenMapping, screenshotMapping, type Box } from '../render/geometry'
import type { PlaceholderKind } from '../render/placeholders'
import { clampNum } from './common'
import type { DeviceBox, LayoutInput, LayoutOutput, WidgetLayout } from './types'

// The Live Activity option: a cut-out of the screenshot drawn again on top of
// the device, enlarged around its own position so it overshoots the bezel. The
// overshoot is the emphasis. Every template can carry one, so the geometry here
// works from whatever device box a template produced rather than owning the
// layout itself.

const SIDE_MARGIN = 60

export const WIDGET_SCALE_LIMITS: [number, number] = [1, 2]
export const WIDGET_OFFSET_LIMITS: [number, number] = [-400, 400]
export const WIDGET_DEFAULT_SCALE = 1.35

export function widgetKindOf(item: SlideItem): WidgetKind | null {
  const mode = item.widget?.mode ?? 'none'
  return mode === 'none' ? null : mode
}

// The stored crop, but only when it matches the selected kind. A crop left over
// from the other kind is ignored until detection runs again.
export function usableCrop(item: SlideItem): WidgetCrop | null {
  const kind = widgetKindOf(item)
  const crop = item.widget?.crop
  return kind && crop && crop.kind === kind ? crop : null
}

export function placeholderFor(kind: WidgetKind): PlaceholderKind {
  return kind === 'island' ? 'home' : 'lock'
}

function usesPlaceholder(item: SlideItem): boolean {
  return widgetKindOf(item) !== null && (item.widget?.screen ?? 'screenshot') === 'placeholder'
}

// Source rect of the cut-out in the canvas space of an unrotated device box:
// from the screenshot where it actually sits, or from the standard iOS position
// on the screen when a placeholder is drawn behind it.
function sourceRect(input: LayoutInput, device: Box): Box | null {
  const { item, screenshotSize } = input
  const crop = usableCrop(item)
  if (!crop) return null
  if (usesPlaceholder(item)) return mapRect(screenMapping(device), anchorFor(crop.kind)(crop.w / crop.h))
  if (!screenshotSize) return null
  return mapRect(screenshotMapping(device, screenshotSize.w, screenshotSize.h), crop)
}

// Enlargement factor and vertical nudge, capped so the cut-out keeps a side
// margin on the canvas.
function sizing(input: LayoutInput, rel: Box): { ws: number; wy: number } {
  const { item, canvasW } = input
  const requested = clampNum(item.widget?.scale ?? WIDGET_DEFAULT_SCALE, WIDGET_SCALE_LIMITS)
  return {
    ws: Math.min(requested, (canvasW - SIDE_MARGIN * 2) / rel.w),
    wy: clampNum(item.widget?.offsetY ?? 0, WIDGET_OFFSET_LIMITS),
  }
}

// How far the enlarged cut-out would poke past the top and bottom edges of a
// device of this width. Both values are >= 0, and both are 0 when there is no
// widget. Templates that anchor the device against their text add these so the
// overshoot never runs into the copy.
export function widgetOvershoot(input: LayoutInput, deviceW: number): { top: number; bottom: number } {
  const none = { top: 0, bottom: 0 }
  const provisional = { x: (input.canvasW - deviceW) / 2, y: 0, w: deviceW, h: deviceW / FRAME_ASPECT }
  const rel = sourceRect(input, provisional)
  if (!rel) return none
  const { ws, wy } = sizing(input, rel)
  const cy = rel.y + rel.h / 2 + wy
  const half = (rel.h * ws) / 2
  return { top: Math.max(0, half - cy), bottom: Math.max(0, cy + half - provisional.h) }
}

// The cut-out and the screen treatment behind it for an already-placed device.
// A rotated device carries the cut-out with it: the rect is computed in the
// device's own unrotated frame, then rigidly rotated about the device centre.
export function widgetOverlay(
  input: LayoutInput,
  device: DeviceBox,
): Pick<LayoutOutput, 'widget' | 'screenDim' | 'screenPlaceholder' | 'screenPlaceholderColor'> {
  const { item } = input
  const kind = widgetKindOf(item)
  const placeholder = usesPlaceholder(item)
  const crop = usableCrop(item)
  const rel = sourceRect(input, device)

  let widget: WidgetLayout | null = null
  if (rel && crop) {
    const { ws, wy } = sizing(input, rel)
    const w = rel.w * ws
    const h = rel.h * ws
    const centre = rotateAbout(
      { x: rel.x + rel.w / 2, y: rel.y + rel.h / 2 + wy },
      { x: device.x + device.w / 2, y: device.y + device.h / 2 },
      device.rotation,
    )
    widget = {
      box: { x: centre.x - w / 2, y: centre.y - h / 2, w, h },
      radius: crop.radius * (rel.w / crop.w) * ws,
      rotation: device.rotation,
      crop,
      ghost: null,
    }
  }
  return {
    widget,
    screenDim: widget && !placeholder ? 0.35 : 0,
    screenPlaceholder: kind && placeholder ? placeholderFor(kind) : null,
    screenPlaceholderColor: kind && placeholder ? (item.widget?.placeholderColor ?? null) : null,
  }
}

function rotateAbout(p: { x: number; y: number }, o: { x: number; y: number }, deg: number): { x: number; y: number } {
  if (!deg) return p
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  const dx = p.x - o.x
  const dy = p.y - o.y
  return { x: o.x + dx * c - dy * s, y: o.y + dx * s + dy * c }
}

function anchorFor(kind: WidgetKind): (aspect: number) => Box {
  return kind === 'island' ? islandAnchor : lockCardAnchor
}

// Standard positions on the 1320×2868 screen (from iOS layout: 14 pt side
// margins for the card above the quick actions; the island 11 pt from the top).
export function lockCardAnchor(aspect: number): Box {
  const w = CANVAS_W * 0.928
  const h = w / aspect
  return { x: (CANVAS_W - w) / 2, y: CANVAS_H * 0.853 - h, w, h }
}

export function islandAnchor(aspect: number): Box {
  const w = CANVAS_W * 0.948
  const h = w / aspect
  return { x: (CANVAS_W - w) / 2, y: CANVAS_H * 0.012, w, h }
}
