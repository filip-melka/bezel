import { clampNum, deviceFromWidth, layoutPairText } from './common'
import type { TemplateDef, TemplateLimits } from './types'

export const PANO_LIMITS: TemplateLimits = {
  scale: [0.85, 1.1],
  deviceOffsetY: [-200, 300],
  textOffsetY: [-100, 200],
}

// Device placed this far below the lower text block, but never above this y.
const DEVICE_MIN_TOP = 720
const GAP_BELOW_TEXT = 100

// SPEC §6.2: two slides, a text slot on each, device straddling the seam at
// x = 1320. Either side may be left empty. The device drops below the taller
// text block so long copy on either side never runs into it.
export const panorama: TemplateDef = {
  id: 'panorama',
  name: 'Panorama',
  description: 'Two slides. Device across the seam, text on either side.',
  slots: 2,
  hasText: true,
  limits: PANO_LIMITS,
  layout(input) {
    const { item, canvasW } = input
    const half = canvasW / 2
    const text = layoutPairText(input, {
      leftX: 120,
      rightX: half + 120,
      y: 260,
      w: 1080,
      headlineMaxLines: 4,
      subMaxLines: 3,
      gap: 32,
      limits: PANO_LIMITS,
    })
    const scale = clampNum(item.device.scale, PANO_LIMITS.scale)
    const offsetY = clampNum(item.device.offsetY, PANO_LIMITS.deviceOffsetY)
    const top = Math.max(DEVICE_MIN_TOP, text.bottom + GAP_BELOW_TEXT) + offsetY
    const device = deviceFromWidth(1500 * scale, half, top)
    return {
      device,
      headline: text.left.headline,
      subheadline: text.left.subheadline,
      headlineRight: text.right.headline,
      subheadlineRight: text.right.subheadline,
    }
  },
}
