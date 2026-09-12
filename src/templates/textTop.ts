import { clampNum, deviceFromWidth, layoutTextStack } from './common'
import type { TemplateDef } from './types'
import { widgetOvershoot } from './widget'

// SPEC §6.1: headline at top, device anchored to the bottom edge.
export const textTop: TemplateDef = {
  id: 'textTop',
  name: 'Text top',
  description: 'Headline above, device anchored to the bottom edge.',
  slots: 1,
  hasText: true,
  hasTilt: false,
  limits: {
    scale: [0.85, 1.15],
    deviceOffsetY: [-200, 300],
    textOffsetY: [-80, 120],
  },
  layout(input) {
    const { item, canvasW } = input
    const text = layoutTextStack(input, {
      x: 120,
      y: 200,
      w: canvasW - 240,
      headlineMaxLines: 3,
      subMaxLines: 3,
      gap: 32,
      limits: textTop.limits,
    })
    const scale = clampNum(item.device.scale, textTop.limits.scale)
    const offsetY = clampNum(item.device.offsetY, textTop.limits.deviceOffsetY)
    const w = 1080 * scale
    // A lifted Live Activity that overshoots the top of the device pushes the
    // device down, so the cut-out keeps the same gap below the text.
    const clear = widgetOvershoot(input, w).top
    const device = deviceFromWidth(w, canvasW / 2, text.bottom + 140 + clear + offsetY)
    return { device, headline: text.headline, subheadline: text.subheadline }
  },
}
