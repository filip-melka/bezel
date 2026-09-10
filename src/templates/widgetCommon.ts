import { CANVAS_H, CANVAS_W } from '../model/types'
import { mapRect, screenMapping, screenshotMapping, type Box } from '../render/geometry'
import { clampNum, deviceFromWidth, layoutTextStack } from './common'
import type { PlaceholderKind } from '../render/placeholders'
import type { LayoutInput, LayoutOutput, TemplateDef, WidgetLayout } from './types'

const SIDE_MARGIN = 60
const GAP_BELOW_TEXT = 100

export type WidgetTemplateOptions = {
  deviceW: number
  placeholder: PlaceholderKind
  // Where iOS puts this widget on a 1320×2868 screen, given the crop's aspect.
  anchor: (aspect: number) => Box
}

// Shared layout for the Live Activity templates: headline on top, device
// below, and the widget cut-out redrawn enlarged around its own centre so it
// overshoots the bezel. The device drops just far enough that the enlarged
// widget clears the text. With a placeholder screen the cut-out is anchored
// at the standard iOS position instead of where it sits in the screenshot.
export function layoutWidgetTemplate(input: LayoutInput, def: TemplateDef, opts: WidgetTemplateOptions): LayoutOutput {
  const { item, canvasW, screenshotSize } = input
  const text = layoutTextStack(input, {
    x: 120,
    y: 200,
    w: canvasW - 240,
    headlineMaxLines: 3,
    subMaxLines: 3,
    gap: 32,
    limits: def.limits,
  })
  const scale = clampNum(item.device.scale, def.limits.scale)
  const offsetY = clampNum(item.device.offsetY, def.limits.deviceOffsetY)
  const deviceW = opts.deviceW * scale
  const crop = item.widget?.crop
  const usable = crop && crop.kind === def.widgetKind ? crop : null
  const placeholder = (item.widget?.screen ?? 'screenshot') === 'placeholder'

  // Source rect in canvas space for a provisional device at y = 0; only its
  // vertical position shifts with the final device placement.
  let rel: Box | null = null
  if (usable && (placeholder || screenshotSize)) {
    const provisional = { x: (canvasW - deviceW) / 2, y: 0, w: deviceW, h: 0 }
    if (placeholder) rel = mapRect(screenMapping(provisional), opts.anchor(usable.w / usable.h))
    else rel = mapRect(screenshotMapping(provisional, screenshotSize!.w, screenshotSize!.h), usable)
  }

  let ws = 1
  let widgetTopRel = 0
  const wy = clampNum(item.widget?.offsetY ?? 0, def.limits.widgetOffsetY ?? [0, 0])
  if (rel && usable) {
    const requested = clampNum(item.widget?.scale ?? def.widgetDefaultScale ?? 1, def.limits.widgetScale ?? [1, 1])
    ws = Math.min(requested, (canvasW - SIDE_MARGIN * 2) / rel.w)
    widgetTopRel = rel.y + rel.h / 2 + wy - (rel.h * ws) / 2
  }
  const deviceTop = text.bottom + GAP_BELOW_TEXT - Math.min(0, widgetTopRel) + offsetY
  const device = deviceFromWidth(deviceW, canvasW / 2, deviceTop)

  let widget: WidgetLayout | null = null
  if (rel && usable) {
    const r = { ...rel, y: rel.y + device.y }
    const w = r.w * ws
    const h = r.h * ws
    const cx = r.x + r.w / 2
    const cy = r.y + r.h / 2 + wy
    widget = { box: { x: cx - w / 2, y: cy - h / 2, w, h }, radius: usable.radius * (r.w / usable.w) * ws, crop: usable, ghost: null }
  }
  return {
    device,
    headline: text.headline,
    subheadline: text.subheadline,
    widget,
    screenDim: widget && !placeholder ? 0.35 : 0,
    screenPlaceholder: placeholder ? opts.placeholder : null,
    screenPlaceholderColor: placeholder ? (item.widget?.placeholderColor ?? null) : null,
  }
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
