import type { WidgetCrop, WidgetKind } from '../model/types'

// Pure pixel heuristics for locating a Live Activity in an iPhone screenshot.
// Both work on RGBA image data and return a crop in the same pixel space.

export type Pixels = { width: number; height: number; data: Uint8ClampedArray }

function px(img: Pixels, x: number, y: number): [number, number, number] {
  const i = (y * img.width + x) * 4
  return [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!]
}

function dist(a: [number, number, number], b: [number, number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])
}

const NEAR_BLACK = 40

// Expanded Dynamic Island: a near-black rounded rectangle attached to the pill
// at the top centre. Flood-fills near-black pixels from the pill and returns
// the bounding box.
export function detectIsland(img: Pixels): WidgetCrop | null {
  const { width: w, height: h } = img
  const startX = Math.floor(w / 2)
  const startY = Math.max(1, Math.round(h * 0.035))
  const isBlack = (x: number, y: number) => {
    const [r, g, b] = px(img, x, y)
    return r < NEAR_BLACK && g < NEAR_BLACK && b < NEAR_BLACK
  }
  // Find a black seed near the expected pill centre.
  let sx = -1
  let sy = -1
  outer: for (let dy = 0; dy < Math.round(h * 0.03); dy += 2) {
    for (const y of [startY + dy, startY - dy]) {
      if (y < 0 || y >= h) continue
      for (let dx = 0; dx < Math.round(w * 0.1); dx += 2) {
        for (const x of [startX + dx, startX - dx]) {
          if (x >= 0 && x < w && isBlack(x, y)) {
            sx = x
            sy = y
            break outer
          }
        }
      }
    }
  }
  if (sx < 0) return null

  const visited = new Uint8Array(w * h)
  // Leftmost black x per row, used to measure the corner radius afterwards.
  const rowMinX = new Int32Array(h).fill(-1)
  const stack: number[] = [sy * w + sx]
  visited[sy * w + sx] = 1
  let minX = sx
  let maxX = sx
  let minY = sy
  let maxY = sy
  let count = 0
  while (stack.length) {
    const idx = stack.pop()!
    const x = idx % w
    const y = (idx - x) / w
    count++
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    if (rowMinX[y]! < 0 || x < rowMinX[y]!) rowMinX[y] = x
    const nbrs = [idx - 1, idx + 1, idx - w, idx + w]
    for (const n of nbrs) {
      if (n < 0 || n >= w * h || visited[n]) continue
      const nx = n % w
      if (Math.abs(nx - x) > 1) continue // wrapped a row edge
      const ny = (n - nx) / w
      if (!isBlack(nx, ny)) continue
      visited[n] = 1
      stack.push(n)
    }
  }
  const bw = maxX - minX + 1
  const bh = maxY - minY + 1
  // Sanity: wide, near the top, plausible height, mostly filled.
  if (bw < w * 0.5 || bh < h * 0.04 || bh > h * 0.4 || minY > h * 0.1) return null
  if (count < bw * bh * 0.6) return null
  return { kind: 'island', x: minX, y: minY, w: bw, h: bh, radius: measureRadius(rowMinX, minX, minY, maxY, bh) }
}

// Corner radius of a rounded rectangle from its per-row left edge: the first
// row where the fill reaches the bounding box's left edge is one radius below
// the top. Falls back to a proportion of the height if the edge is never met.
function measureRadius(rowMinX: Int32Array, minX: number, minY: number, maxY: number, bh: number): number {
  for (let y = minY; y <= maxY; y++) {
    if (rowMinX[y]! >= 0 && rowMinX[y]! <= minX + 1) {
      const r = y - minY
      if (r >= 4) return Math.min(r, Math.floor(bh / 2))
      break
    }
  }
  return Math.round(bh * 0.3)
}

// Lock-screen Live Activity card: full width with fixed side margins, a flat
// fill, sitting in the lower part of the screen. Finds rows where a column
// just inside the card is flat and differs from the wallpaper in the margin,
// then refines the left/right edges on the card's middle row.
export function detectLockActivity(img: Pixels): WidgetCrop | null {
  const { width: w, height: h } = img
  const margin = Math.round((w * 14) / 393)
  const xMargin = Math.max(0, Math.round(margin / 2))
  const xIn = margin + Math.round(w * 0.03)
  const xIn2 = xIn + Math.round(w * 0.03)
  const xIn3 = xIn + Math.round(w * 0.08)
  const FLAT = 24
  const DIFF = 40

  const isCardRow = (y: number) => {
    const a = px(img, xIn, y)
    const b = px(img, xIn2, y)
    const c = px(img, xIn3, y)
    const m = px(img, xMargin, y)
    return dist(a, b) < FLAT && dist(a, c) < FLAT && dist(a, m) > DIFF
  }

  const yStart = Math.round(h * 0.35)
  const yEnd = Math.round(h * 0.97)
  let best: { y0: number; y1: number } | null = null
  let runStart = -1
  const minH = h * 0.05
  const maxH = h * 0.25
  const flush = (y: number) => {
    if (runStart < 0) return
    const len = y - runStart
    if (len >= minH && len <= maxH && (!best || len > best.y1 - best.y0)) best = { y0: runStart, y1: y }
    runStart = -1
  }
  for (let y = yStart; y < yEnd; y++) {
    const ok = isCardRow(y)
    if (ok && runStart < 0) runStart = y
    else if (!ok && runStart >= 0) {
      // Allow small gaps (text rows inside the card) by peeking ahead.
      let gap = 0
      while (y + gap < yEnd && !isCardRow(y + gap) && gap < h * 0.06) gap++
      if (y + gap < yEnd && gap < h * 0.06) {
        y += gap - 1
        continue
      }
      flush(y)
    }
  }
  flush(yEnd)
  if (!best) return null
  const { y0, y1 } = best as { y0: number; y1: number }

  // Refine horizontal edges on a row near the top of the card (text-free).
  const yMid = Math.round(y0 + (y1 - y0) * 0.12)
  const card = px(img, xIn, yMid)
  let left = xIn
  while (left > 0 && dist(px(img, left - 1, yMid), card) < FLAT) left--
  let right = xIn
  while (right < w - 1 && dist(px(img, right + 1, yMid), card) < FLAT) right++
  const bw = right - left + 1
  if (bw < w * 0.7) return null

  // Vertical edges: walk out from the band in several columns clear of the
  // rounded corners and take the outermost result, so text or icons in one
  // column cannot stop the walk early.
  let top = y0
  let bottom = y1 - 1
  for (let i = 1; i <= 7; i++) {
    const x = Math.round(left + (bw * i) / 8)
    let t = y0
    while (t > 0 && dist(px(img, x, t - 1), card) < FLAT) t--
    let b = y1 - 1
    while (b < h - 1 && dist(px(img, x, b + 1), card) < FLAT) b++
    if (t < top) top = t
    if (b > bottom) bottom = b
  }
  const bh = bottom - top + 1
  return { kind: 'lockActivity', x: left, y: top, w: bw, h: bh, radius: Math.round(w * 0.06) }
}

export function detectWidget(img: Pixels, kind: WidgetKind): WidgetCrop | null {
  return kind === 'island' ? detectIsland(img) : detectLockActivity(img)
}
