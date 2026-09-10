import type { Background } from '../model/types'

export type Point = { x: number; y: number }

// Endpoints of a CSS-style linear gradient: angle 0 = bottom→top, 90 = left→right.
// The line passes through the centre and is long enough that the first and last
// stops touch the corners, matching the CSS "gradient line" definition.
export function linearGradientEndpoints(angle: number, w: number, h: number): { start: Point; end: Point } {
  const rad = (angle * Math.PI) / 180
  const dx = Math.sin(rad)
  const dy = -Math.cos(rad)
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2
  const cx = w / 2
  const cy = h / 2
  return {
    start: { x: cx - dx * half, y: cy - dy * half },
    end: { x: cx + dx * half, y: cy + dy * half },
  }
}

export function sortedStops(bg: Extract<Background, { kind: 'linear' | 'radial' }>) {
  return [...bg.stops]
    .map((s) => ({ offset: Math.min(1, Math.max(0, s.offset)), color: s.color }))
    .sort((a, b) => a.offset - b.offset)
}

export function fillBackground(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  bg: Background,
  w: number,
  h: number,
): void {
  if (bg.kind === 'solid') {
    ctx.fillStyle = bg.color
  } else if (bg.kind === 'linear') {
    const { start, end } = linearGradientEndpoints(bg.angle, w, h)
    const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
    for (const s of sortedStops(bg)) grad.addColorStop(s.offset, s.color)
    ctx.fillStyle = grad
  } else {
    const r = Math.hypot(w, h) / 2
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r)
    for (const s of sortedStops(bg)) grad.addColorStop(s.offset, s.color)
    ctx.fillStyle = grad
  }
  ctx.fillRect(0, 0, w, h)
}

// CSS equivalent, used for swatches and thumbnails of backgrounds in the chrome.
export function backgroundToCss(bg: Background): string {
  if (bg.kind === 'solid') return bg.color
  const stops = sortedStops(bg)
    .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
    .join(', ')
  if (bg.kind === 'linear') return `linear-gradient(${bg.angle}deg, ${stops})`
  return `radial-gradient(circle at center, ${stops})`
}
