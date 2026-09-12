import { clampNum, deviceFromHeight } from './common'
import type { TemplateDef } from './types'

// SPEC §6.1: device fully visible, centred, no text.
export const deviceOnly: TemplateDef = {
  id: 'deviceOnly',
  name: 'Device only',
  description: 'The framed screenshot, centred and fully visible.',
  slots: 1,
  hasText: false,
  hasTilt: false,
  limits: {
    scale: [0.7, 1.0],
    deviceOffsetY: [-120, 120],
    textOffsetY: [0, 0],
  },
  layout(input) {
    const { item, canvasW, canvasH } = input
    const scale = clampNum(item.device.scale, deviceOnly.limits.scale)
    const offsetY = clampNum(item.device.offsetY, deviceOnly.limits.deviceOffsetY)
    const device = deviceFromHeight((canvasH - 360) * scale, canvasW / 2, canvasH / 2 + offsetY)
    return { device, headline: null, subheadline: null }
  },
}
