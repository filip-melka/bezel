import { FRAME_ASPECT } from '../render/bezel'
import { clampNum, layoutTextStack, rotatedBounds, tiltOf } from './common'
import type { TemplateDef } from './types'

export const TILT_DEGREES = 12

const TEXT_W = 900
const SIDE_PAD = 120

// SPEC §6.1: device rotated 12°, anchored so its rotated bounds run past the
// bottom edge and the side it leans towards. Text sits in the free top corner
// on the opposite side. The two directions are exact mirrors.
export const tilted: TemplateDef = {
  id: 'tilted',
  name: 'Tilted',
  description: 'Device tilted into a corner, text in the opposite one.',
  slots: 1,
  hasText: true,
  hasTilt: true,
  limits: {
    scale: [0.9, 1.2],
    deviceOffsetY: [-150, 250],
    textOffsetY: [-80, 120],
  },
  layout(input) {
    const { item, canvasW, canvasH } = input
    const right = tiltOf(item) === 'right'
    const text = layoutTextStack(input, {
      x: right ? canvasW - SIDE_PAD - TEXT_W : SIDE_PAD,
      y: 200,
      w: TEXT_W,
      headlineMaxLines: 3,
      subMaxLines: 2,
      gap: 28,
      limits: tilted.limits,
    })
    const scale = clampNum(item.device.scale, tilted.limits.scale)
    const offsetY = clampNum(item.device.offsetY, tilted.limits.deviceOffsetY)
    const rotation = right ? TILT_DEGREES : -TILT_DEGREES
    const w = 1180 * scale
    const h = w / FRAME_ASPECT
    const bounds = rotatedBounds(w, h, rotation)
    // Rotated bounding box overhangs the canvas by a fixed amount on the bottom
    // and on the leaning side, so the device reads as entering from that corner.
    const cx = right ? bounds.w / 2 - 60 : canvasW + 60 - bounds.w / 2
    const cy = canvasH + 480 - bounds.h / 2 + offsetY
    const device = { x: cx - w / 2, y: cy - h / 2, w, h, rotation }
    return { device, headline: text.headline, subheadline: text.subheadline }
  },
}
