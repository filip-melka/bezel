import { FRAME_ASPECT } from '../render/bezel'
import { clampNum, layoutTextStack, rotatedBounds } from './common'
import type { TemplateDef } from './types'

export const TILT_DEGREES = -12

// SPEC §6.1: device rotated −12°, anchored so its rotated bounds run past the
// right and bottom edges. Text sits in the free top-left region.
export const tilted: TemplateDef = {
  id: 'tilted',
  name: 'Tilted',
  description: 'Device tilted into the corner, text top-left.',
  slots: 1,
  hasText: true,
  limits: {
    scale: [0.9, 1.2],
    deviceOffsetY: [-150, 250],
    textOffsetY: [-80, 120],
  },
  layout(input) {
    const { item, canvasW, canvasH } = input
    const text = layoutTextStack(input, {
      x: 120,
      y: 200,
      w: 900,
      headlineMaxLines: 3,
      subMaxLines: 2,
      gap: 28,
      limits: tilted.limits,
    })
    const scale = clampNum(item.device.scale, tilted.limits.scale)
    const offsetY = clampNum(item.device.offsetY, tilted.limits.deviceOffsetY)
    const w = 1180 * scale
    const h = w / FRAME_ASPECT
    const bounds = rotatedBounds(w, h, TILT_DEGREES)
    // Rotated bounding box overhangs the canvas by a fixed amount on the right
    // and bottom so the device reads as entering the frame from the corner.
    const cx = canvasW + 60 - bounds.w / 2
    const cy = canvasH + 480 - bounds.h / 2 + offsetY
    const device = { x: cx - w / 2, y: cy - h / 2, w, h, rotation: TILT_DEGREES }
    return { device, headline: text.headline, subheadline: text.subheadline }
  },
}
