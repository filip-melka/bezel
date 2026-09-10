import { FRAME_ASPECT } from '../render/bezel'
import { clampNum, layoutTextStack, rotatedBounds } from './common'
import type { LayoutInput, LayoutOutput, TemplateDef, TemplateLimits } from './types'

export const PANO_TILT_LIMITS: TemplateLimits = {
  scale: [0.85, 1.1],
  deviceOffsetY: [-200, 300],
  textOffsetY: [-100, 200],
}

// Shared geometry for the tilted panoramas: a 1400 px-wide device rotated
// about the seam, overhanging the bottom, with text on one slide. The tilt
// direction keeps the device's low corner under the text side.
export function layoutPanoTilted(input: LayoutInput, side: 'left' | 'right'): LayoutOutput {
  const { item, canvasW, canvasH } = input
  const half = canvasW / 2
  const text = layoutTextStack(input, {
    x: side === 'left' ? 120 : half + 200,
    y: 260,
    w: 1000,
    headlineMaxLines: 3,
    subMaxLines: 2,
    gap: 32,
    limits: PANO_TILT_LIMITS,
  })
  const scale = clampNum(item.device.scale, PANO_TILT_LIMITS.scale)
  const offsetY = clampNum(item.device.offsetY, PANO_TILT_LIMITS.deviceOffsetY)
  const rotation = side === 'left' ? -12 : 12
  const w = 1400 * scale
  const h = w / FRAME_ASPECT
  const bounds = rotatedBounds(w, h, rotation)
  const cx = half
  const cy = canvasH + 1000 - bounds.h / 2 + offsetY
  const device = { x: cx - w / 2, y: cy - h / 2, w, h, rotation }
  return { device, headline: text.headline, subheadline: text.subheadline }
}

export const panoTilted: TemplateDef = {
  id: 'panoTilted',
  name: 'Tilted left',
  description: 'Two slides. Text on the left, device tilted across the seam.',
  slots: 2,
  hasText: true,
  limits: PANO_TILT_LIMITS,
  layout: (input) => layoutPanoTilted(input, 'left'),
}

export const panoTiltedRight: TemplateDef = {
  id: 'panoTiltedRight',
  name: 'Tilted right',
  description: 'Two slides. Device tilted across the seam, text on the right.',
  slots: 2,
  hasText: true,
  limits: PANO_TILT_LIMITS,
  layout: (input) => layoutPanoTilted(input, 'right'),
}
