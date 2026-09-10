import { clampNum, deviceFromWidth, layoutTextStack } from './common'
import type { TemplateDef } from './types'

export const PANO_LIMITS = {
  scale: [0.85, 1.1] as [number, number],
  deviceOffsetY: [-200, 300] as [number, number],
  textOffsetY: [-100, 200] as [number, number],
}

// SPEC §6.2: text on the left slide, device straddling the seam at x = 1320.
export const panoLeftText: TemplateDef = {
  id: 'panoLeftText',
  name: 'Text left',
  description: 'Two slides. Text on the left, device across the seam.',
  slots: 2,
  hasText: true,
  limits: PANO_LIMITS,
  layout(input) {
    const { item, canvasW } = input
    const text = layoutTextStack(input, {
      x: 120,
      y: 260,
      w: 1080,
      headlineMaxLines: 4,
      subMaxLines: 3,
      gap: 32,
      limits: PANO_LIMITS,
    })
    const scale = clampNum(item.device.scale, PANO_LIMITS.scale)
    const offsetY = clampNum(item.device.offsetY, PANO_LIMITS.deviceOffsetY)
    const device = deviceFromWidth(1500 * scale, canvasW / 2, 720 + offsetY)
    return { device, headline: text.headline, subheadline: text.subheadline }
  },
}
