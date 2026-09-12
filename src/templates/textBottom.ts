import { FRAME_ASPECT } from '../render/bezel'
import { clampNum, layoutTextStack } from './common'
import type { TemplateDef } from './types'
import { widgetOvershoot } from './widget'

// Inverse of textTop: the device hangs from the top edge (top cropped) and the
// text sits below it, anchored 200 px above the bottom of the canvas.
export const textBottom: TemplateDef = {
  id: 'textBottom',
  name: 'Text bottom',
  description: 'Device hanging from the top edge, headline below.',
  slots: 1,
  hasText: true,
  hasTilt: false,
  limits: {
    scale: [0.85, 1.15],
    deviceOffsetY: [-300, 200],
    textOffsetY: [-120, 80],
  },
  layout(input) {
    const { item, canvasW, canvasH } = input
    const nudge = clampNum(item.textNudge.offsetY, textBottom.limits.textOffsetY)
    // Lay out from 0 to measure, then shift the block so its bottom lands at
    // canvasH − 200 (+ nudge). layoutTextStack already applied the nudge.
    const stack = layoutTextStack(input, {
      x: 120,
      y: 0,
      w: canvasW - 240,
      headlineMaxLines: 3,
      subMaxLines: 3,
      gap: 32,
      limits: textBottom.limits,
    })
    const textHeight = stack.bottom - nudge
    const textTop = canvasH - 200 - textHeight + nudge
    const shift = textTop - nudge
    const headline = stack.headline ? { ...stack.headline, y: stack.headline.y + shift } : null
    const subheadline = stack.subheadline ? { ...stack.subheadline, y: stack.subheadline.y + shift } : null

    const scale = clampNum(item.device.scale, textBottom.limits.scale)
    const offsetY = clampNum(item.device.offsetY, textBottom.limits.deviceOffsetY)
    const w = 1080 * scale
    const h = w / FRAME_ASPECT
    // Hang 300 px past the top edge; move up further only if the device would
    // otherwise come within 140 px of the text. A lifted Live Activity that
    // overshoots the bottom of the device counts towards that clearance.
    const clear = widgetOvershoot(input, w).bottom
    const y = Math.min(-300, textTop - 140 - h - clear) + offsetY
    const device = { x: (canvasW - w) / 2, y, w, h, rotation: 0 }
    return { device, headline, subheadline }
  },
}
