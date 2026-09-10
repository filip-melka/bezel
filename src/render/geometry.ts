import { FRAME_W, SCREEN_H, SCREEN_W, SCREEN_X, SCREEN_Y } from './bezel'

export type Box = { x: number; y: number; w: number; h: number }

// Maps stored-screenshot pixels to canvas coordinates for an unrotated device
// box, using the same cover-fit the renderer applies inside the screen area.
// canvasX = ox + imageX × k, canvasY = oy + imageY × k.
export function screenshotMapping(device: Box, imgW: number, imgH: number): { k: number; ox: number; oy: number } {
  const s = device.w / FRAME_W
  const cover = Math.max(SCREEN_W / imgW, SCREEN_H / imgH)
  const dx = SCREEN_X + (SCREEN_W - imgW * cover) / 2
  const dy = SCREEN_Y + (SCREEN_H - imgH * cover) / 2
  return { k: cover * s, ox: device.x + dx * s, oy: device.y + dy * s }
}

export function mapRect(m: { k: number; ox: number; oy: number }, r: Box): Box {
  return { x: m.ox + r.x * m.k, y: m.oy + r.y * m.k, w: r.w * m.k, h: r.h * m.k }
}

// Maps screen-area pixels (0..SCREEN_W × 0..SCREEN_H, the logical 1320×2868
// screen) to canvas coordinates for an unrotated device box.
export function screenMapping(device: Box): { k: number; ox: number; oy: number } {
  const s = device.w / FRAME_W
  return { k: s, ox: device.x + SCREEN_X * s, oy: device.y + SCREEN_Y * s }
}
