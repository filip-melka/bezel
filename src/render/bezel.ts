import { FINISHES } from '../assets/bezel/finishes'
import type { BezelFinish } from '../model/types'

// Frame geometry in logical pixels (SPEC §8). The screen area is exactly
// 1320 × 2868 so a native screenshot is never upscaled at device scale 1.
// The bezel is a uniform 44 px on all sides; buttons sit in the 14 px margins.
export const FRAME_W = 1436
export const FRAME_H = 2984
export const SCREEN_X = 58
export const SCREEN_Y = 58
export const SCREEN_W = 1320
export const SCREEN_H = 2868
export const SCREEN_R = 176
export const BODY_X = 14
export const BODY_Y = 14
export const BODY_W = 1408
export const BODY_H = 2956
export const BODY_R = 220
export const FRAME_ASPECT = FRAME_W / FRAME_H

// SVG path for a rounded rectangle, clockwise.
function rr(x: number, y: number, w: number, h: number, r: number): string {
  return [
    `M${x + r},${y}`,
    `H${x + w - r}`,
    `A${r},${r} 0 0 1 ${x + w},${y + r}`,
    `V${y + h - r}`,
    `A${r},${r} 0 0 1 ${x + w - r},${y + h}`,
    `H${x + r}`,
    `A${r},${r} 0 0 1 ${x},${y + h - r}`,
    `V${y + r}`,
    `A${r},${r} 0 0 1 ${x + r},${y}`,
    'Z',
  ].join(' ')
}

// Hand-authored vector approximation of a current flagship iPhone. No filters,
// no rasters, so Canvas drawImage renders it faithfully. The screen is a hole.
export function bezelSvg(finish: BezelFinish): string {
  const c = FINISHES[finish]
  const screen = rr(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H, SCREEN_R)
  const body = rr(BODY_X, BODY_Y, BODY_W, BODY_H, BODY_R)
  const ring = rr(SCREEN_X - 8, SCREEN_Y - 8, SCREEN_W + 16, SCREEN_H + 16, SCREEN_R + 8)
  const edge = rr(BODY_X + 3, BODY_Y + 3, BODY_W - 6, BODY_H - 6, BODY_R - 3)
  const highlight = rr(BODY_X + 9, BODY_Y + 9, BODY_W - 18, BODY_H - 18, BODY_R - 9)
  const islandW = 370
  const islandH = 110
  const islandX = SCREEN_X + (SCREEN_W - islandW) / 2
  const islandY = SCREEN_Y + 44
  const btn = (x: number, y: number, h: number) => rr(x, y, 12, h, 5)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME_W}" height="${FRAME_H}" viewBox="0 0 ${FRAME_W} ${FRAME_H}">
  <g id="buttons" fill="${c.edge}">
    <path d="${btn(2, 560, 96)}"/>
    <path d="${btn(2, 760, 210)}"/>
    <path d="${btn(2, 1020, 210)}"/>
    <path d="${btn(FRAME_W - 14, 900, 340)}"/>
    <path d="${btn(FRAME_W - 14, 1700, 150)}"/>
  </g>
  <path id="frame-body" fill-rule="evenodd" fill="${c.body}" d="${body} ${screen}"/>
  <path id="edge" fill="none" stroke="${c.edge}" stroke-width="6" d="${edge}"/>
  <path id="highlight" fill="none" stroke="${c.highlight}" stroke-width="2" stroke-opacity="0.55" d="${highlight}"/>
  <path id="screen-ring" fill-rule="evenodd" fill="#000000" d="${ring} ${screen}"/>
  <rect id="dynamic-island" x="${islandX}" y="${islandY}" width="${islandW}" height="${islandH}" rx="${islandH / 2}" fill="#000000"/>
</svg>`
}

const cache = new Map<BezelFinish, HTMLImageElement>()
const pending = new Map<BezelFinish, Promise<HTMLImageElement>>()

export function getBezelImage(finish: BezelFinish): HTMLImageElement | undefined {
  return cache.get(finish)
}

export function loadBezelImage(finish: BezelFinish): Promise<HTMLImageElement> {
  const cached = cache.get(finish)
  if (cached) return Promise.resolve(cached)
  const inflight = pending.get(finish)
  if (inflight) return inflight
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const blob = new Blob([bezelSvg(finish)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      cache.set(finish, img)
      pending.delete(finish)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      pending.delete(finish)
      reject(new Error(`Failed to load bezel image for finish ${finish}`))
    }
    img.src = url
  })
  pending.set(finish, p)
  return p
}

export function loadAllBezels(): Promise<HTMLImageElement[]> {
  return Promise.all((Object.keys(FINISHES) as BezelFinish[]).map(loadBezelImage))
}

// Adds the screen rounded-rect to the current path, in frame coordinates.
export function traceScreenPath(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
  ctx.beginPath()
  ctx.roundRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H, SCREEN_R)
}

export function traceBodyPath(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
  ctx.beginPath()
  ctx.roundRect(BODY_X, BODY_Y, BODY_W, BODY_H, BODY_R)
}
