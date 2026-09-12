import { SCREEN_H, SCREEN_W, SCREEN_X, SCREEN_Y } from './bezel'
import { hexToHsl, hsl, needsDarkInk } from './color'
import { PLACEHOLDER_FONT } from '../assets/fonts/fonts'
import type { Ctx2D } from './renderItem'

// Drawn stand-ins for the screen behind a Live Activity cut-out, in frame
// coordinates (the caller has already clipped to the screen). Neutral enough
// that the widget, not the wallpaper, is what the viewer reads.
//
// Each takes an optional base colour. Without one, the hand-tuned default
// palette is used. With one, the gradient is derived from it with small hue and
// lightness shifts (lighter and cooler at the top, slightly warmer below) so a
// saturated colour stays recognisably itself, and foreground "ink" switches to
// dark when the colour is light.

export type PlaceholderKind = 'lock' | 'home'

// The base colour each default palette is built around; shown in the picker.
export const DEFAULT_PLACEHOLDER_COLOR: Record<PlaceholderKind, string> = {
  lock: '#3a2f63',
  home: '#3a2a52',
}

type Ink = (a: number) => string
type Palette = { stops: [string, string, string]; glow: string; ink: Ink }

const white: Ink = (a) => `rgba(255,255,255,${a})`
const black: Ink = (a) => `rgba(0,0,0,${a * 0.9})`

function lockPalette(base: string | null): Palette {
  if (!base) return { stops: ['#1d2b4f', '#3a2f63', '#171a2e'], glow: 'rgba(0,0,0,0)', ink: white }
  const { h, s, l } = hexToHsl(base)
  return {
    stops: [hsl(h - 10, s, l - 9), hsl(h, s, l), hsl(h - 6, s * 0.9, l - 15)],
    glow: 'rgba(0,0,0,0)',
    ink: needsDarkInk(base) ? black : white,
  }
}

function homePalette(base: string | null): Palette {
  if (!base) return { stops: ['#3e4a68', '#3a2a52', '#5c2a4a'], glow: 'rgba(120,140,180,0.22)', ink: white }
  const { h, s, l } = hexToHsl(base)
  return {
    stops: [hsl(h - 14, s * 0.85, l + 9), hsl(h, s, l), hsl(h + 18, s, l - 3)],
    glow: 'rgba(255,255,255,0.12)',
    ink: needsDarkInk(base) ? black : white,
  }
}

function roundRect(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

function homeIndicator(ctx: Ctx2D, ink: Ink) {
  roundRect(ctx, SCREEN_X + (SCREEN_W - 406) / 2, SCREEN_Y + SCREEN_H - 50, 406, 16, 8, ink(0.9))
}

// Lock screen: dusk gradient, date and time, quick-action buttons.
export function drawLockPlaceholder(ctx: Ctx2D, base: string | null = null): void {
  const p = lockPalette(base)
  const g = ctx.createLinearGradient(0, SCREEN_Y, 0, SCREEN_Y + SCREEN_H)
  g.addColorStop(0, p.stops[0])
  g.addColorStop(0.55, p.stops[1])
  g.addColorStop(1, p.stops[2])
  ctx.fillStyle = g
  ctx.fillRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = p.ink(0.92)
  ctx.font = `600 54px ${PLACEHOLDER_FONT}`
  ctx.fillText('Monday 6 October', SCREEN_X + SCREEN_W / 2, SCREEN_Y + 330)
  ctx.font = `700 250px ${PLACEHOLDER_FONT}`
  ctx.fillText('9:41', SCREEN_X + SCREEN_W / 2, SCREEN_Y + 520)

  const by = SCREEN_Y + SCREEN_H - 250
  for (const dx of [-390, 390]) {
    ctx.fillStyle = p.ink(0.16)
    ctx.beginPath()
    ctx.arc(SCREEN_X + SCREEN_W / 2 + dx, by, 80, 0, Math.PI * 2)
    ctx.fill()
  }
  homeIndicator(ctx, p.ink)
}

// Draws `shape` blurred by `blur` logical px. The shape itself is drawn far
// outside the screen clip and only its shadow, offset back into place, lands
// on screen. Shadow blur and offset ignore the transform, so both are converted
// to device pixels from the current matrix. Works in every browser, unlike
// ctx.filter, and renders identically in preview and export.
function blurred(ctx: Ctx2D, color: string, blur: number, shape: (dx: number) => void) {
  const OFF = 6000
  const m = ctx.getTransform()
  const k = Math.hypot(m.a, m.b)
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = blur * k
  ctx.shadowOffsetX = m.a * OFF
  ctx.shadowOffsetY = m.b * OFF
  ctx.fillStyle = '#000'
  ctx.beginPath()
  shape(-OFF)
  ctx.fill()
  ctx.restore()
}

// Home screen, "recessive": a deep wallpaper with the icon grid, page dots and
// dock pushed out of focus, and a sharp status bar. The screen is only proof
// there is a phone; the island is the subject.
export function drawHomePlaceholder(ctx: Ctx2D, base: string | null = null): void {
  const p = homePalette(base)
  const X = SCREEN_X
  const Y = SCREEN_Y
  const g = ctx.createLinearGradient(X, Y, X + SCREEN_W * 0.35, Y + SCREEN_H)
  g.addColorStop(0, p.stops[0])
  g.addColorStop(0.45, p.stops[1])
  g.addColorStop(1, p.stops[2])
  ctx.fillStyle = g
  ctx.fillRect(X, Y, SCREEN_W, SCREEN_H)
  const gx = X + SCREEN_W * 0.2
  const gy = Y + SCREEN_H * 0.05
  const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, SCREEN_W)
  glow.addColorStop(0, p.glow)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(X, Y, SCREEN_W, SCREEN_H)

  const BLUR = 20
  const icon = 186
  const cols = [173, 497, 821, 1145]
  const rows = [353, 677, 1001, 1328, 1655]
  const labelW = [106, 80, 120, 86, 100, 110, 72, 96]
  let n = 0
  for (const cy of rows) {
    for (const cx of cols) {
      const lw = labelW[n++ % labelW.length]!
      blurred(ctx, p.ink(0.15), BLUR, (dx) => ctx.roundRect(X + cx - icon / 2 + dx, Y + cy - icon / 2, icon, icon, 46))
      blurred(ctx, p.ink(0.16), BLUR * 0.6, (dx) => ctx.roundRect(X + cx - lw / 2 + dx, Y + cy + icon / 2 + 34, lw, 18, 9))
    }
  }

  // Page dots, first one current.
  ;[603, 660, 717].forEach((cx, i) => {
    ctx.fillStyle = p.ink(i === 0 ? 0.55 : 0.25)
    ctx.beginPath()
    ctx.arc(X + cx, Y + 2369, 11, 0, Math.PI * 2)
    ctx.fill()
  })

  // Dock and its icons.
  blurred(ctx, p.ink(0.09), BLUR * 0.8, (dx) => ctx.roundRect(X + 64 + dx, Y + 2449, SCREEN_W - 128, 320, 106))
  for (const cx of [215, 510, 805, 1100]) {
    blurred(ctx, p.ink(0.2), BLUR, (dx) => ctx.roundRect(X + cx - 100 + dx, Y + 2608 - 100, 200, 200, 50))
  }

  homeIndicator(ctx, p.ink)
  drawStatusBar(ctx, p.ink)
}

// Sharp status bar: time on the left; signal, Wi-Fi and battery on the right.
function drawStatusBar(ctx: Ctx2D, ink: Ink): void {
  const X = SCREEN_X
  const Y = SCREEN_Y
  const cy = Y + 80
  const solid = ink(1)
  ctx.fillStyle = solid
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `600 54px ${PLACEHOLDER_FONT}`
  ctx.fillText('9:41', X + 104, cy + 2)

  // Signal: four bars rising left to right.
  for (let i = 0; i < 4; i++) {
    const h = 14 + i * 8
    ctx.beginPath()
    ctx.roundRect(X + 999 + i * 14, cy + 19 - h, 10, h, 3)
    ctx.fill()
  }
  // Wi-Fi: two arcs and a dot.
  const wx = X + 1097
  const wy = cy + 18
  ctx.lineCap = 'round'
  ctx.strokeStyle = solid
  ctx.lineWidth = 8
  for (const r of [34, 22]) {
    ctx.beginPath()
    ctx.arc(wx, wy, r, Math.PI * 1.25, Math.PI * 1.75)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(wx, wy - 4, 6, 0, Math.PI * 2)
  ctx.fill()
  // Battery: outline, fill, and cap.
  const bx = X + 1146
  const by = cy - 14
  ctx.lineWidth = 3
  ctx.strokeStyle = ink(0.5)
  ctx.beginPath()
  ctx.roundRect(bx, by, 64, 30, 9)
  ctx.stroke()
  ctx.fillStyle = solid
  ctx.beginPath()
  ctx.roundRect(bx + 5, by + 5, 40, 20, 5)
  ctx.fill()
  ctx.fillStyle = ink(0.5)
  ctx.beginPath()
  ctx.roundRect(bx + 67, by + 10, 5, 10, 2)
  ctx.fill()
}
