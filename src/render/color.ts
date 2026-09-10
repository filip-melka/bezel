// Small colour helpers for deriving placeholder palettes from one base colour.

export type HSL = { h: number; s: number; l: number } // h 0..360, s and l 0..100

export function hexToRgb(hex: string): [number, number, number] {
  let t = hex.trim().replace(/^#/, '')
  if (t.length === 3) t = [...t].map((c) => c + c).join('')
  const n = Number.parseInt(t.slice(0, 6), 16)
  if (!Number.isFinite(n)) return [0, 0, 0]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function hexToHsl(hex: string): HSL {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (max === g) h = ((b - r) / d + 2) * 60
    else h = ((r - g) / d + 4) * 60
  }
  return { h, s: s * 100, l: l * 100 }
}

export function hsl(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = Math.min(100, Math.max(0, s))
  const ll = Math.min(100, Math.max(0, l))
  return `hsl(${hh.toFixed(1)} ${ss.toFixed(1)}% ${ll.toFixed(1)}%)`
}

// WCAG relative luminance, 0 (black) .. 1 (white).
export function luminance(hex: string): number {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// True when foreground elements on this colour should be dark rather than white.
export function needsDarkInk(hex: string): boolean {
  return luminance(hex) > 0.4
}
