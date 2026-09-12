import { FRAME_ASPECT } from '../render/bezel'
import { clampNum, layoutPairText, rotatedBounds, tiltOf } from './common'
import type { LayoutInput, LayoutOutput, TemplateDef, TemplateLimits } from './types'

export const PANO_TILT_LIMITS: TemplateLimits = {
  scale: [0.85, 1.1],
  deviceOffsetY: [-200, 300],
  textOffsetY: [-100, 200],
}

// A 1400 px-wide device rotated about the seam and overhanging the bottom, with
// a text slot on each slide. The slots are mirror images: 120 px from the outer
// edge, 200 px from the seam. Only the device's lean changes with the direction.
function layoutPanoTilted(input: LayoutInput): LayoutOutput {
  const { item, canvasW, canvasH } = input
  const half = canvasW / 2
  const text = layoutPairText(input, {
    leftX: 120,
    rightX: half + 200,
    y: 260,
    w: 1000,
    headlineMaxLines: 3,
    subMaxLines: 2,
    gap: 32,
    limits: PANO_TILT_LIMITS,
  })
  const scale = clampNum(item.device.scale, PANO_TILT_LIMITS.scale)
  const offsetY = clampNum(item.device.offsetY, PANO_TILT_LIMITS.deviceOffsetY)
  const rotation = tiltOf(item) === 'right' ? 12 : -12
  const w = 1400 * scale
  const h = w / FRAME_ASPECT
  const bounds = rotatedBounds(w, h, rotation)
  const cx = half
  const cy = canvasH + 1000 - bounds.h / 2 + offsetY
  const device = { x: cx - w / 2, y: cy - h / 2, w, h, rotation }
  return {
    device,
    headline: text.left.headline,
    subheadline: text.left.subheadline,
    headlineRight: text.right.headline,
    subheadlineRight: text.right.subheadline,
  }
}

export const panoTilted: TemplateDef = {
  id: 'panoTilted',
  name: 'Tilted panorama',
  description: 'Two slides. Device tilted across the seam, text on either side.',
  slots: 2,
  hasText: true,
  hasTilt: true,
  limits: PANO_TILT_LIMITS,
  layout: layoutPanoTilted,
}
