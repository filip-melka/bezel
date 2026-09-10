import { clampNum, deviceFromWidth, layoutTextStack } from './common'
import { PANO_LIMITS } from './panoLeftText'
import type { TemplateDef } from './types'

// SPEC §6.2: mirror of panoLeftText, text on the right slide.
export const panoRightText: TemplateDef = {
  id: 'panoRightText',
  name: 'Text right',
  description: 'Two slides. Device across the seam, text on the right.',
  slots: 2,
  hasText: true,
  limits: PANO_LIMITS,
  layout(input) {
    const { item, canvasW } = input
    const half = canvasW / 2
    const text = layoutTextStack(input, {
      x: half + 120,
      y: 260,
      w: 1080,
      headlineMaxLines: 4,
      subMaxLines: 3,
      gap: 32,
      limits: PANO_LIMITS,
    })
    const scale = clampNum(item.device.scale, PANO_LIMITS.scale)
    const offsetY = clampNum(item.device.offsetY, PANO_LIMITS.deviceOffsetY)
    const device = deviceFromWidth(1500 * scale, half, 720 + offsetY)
    return { device, headline: text.headline, subheadline: text.subheadline }
  },
}
