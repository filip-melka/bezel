import { clampNum, deviceFromWidth, layoutTextStack } from './common'
import type { TemplateDef } from './types'

// SPEC §6.1: headline at top, device anchored to the bottom edge.
export const textTop: TemplateDef = {
  id: 'textTop',
  name: 'Text top',
  description: 'Headline above, device anchored to the bottom edge.',
  slots: 1,
  hasText: true,
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
    const device = deviceFromWidth(1080 * scale, canvasW / 2, text.bottom + 140 + offsetY)
    return { device, headline: text.headline, subheadline: text.subheadline }
  },
}
