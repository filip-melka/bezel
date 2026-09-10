import { describe, expect, it } from 'vitest'
import { detectIsland, detectLockActivity, type Pixels } from '../../src/widgets/detect'

type RGB = [number, number, number]

function image(w: number, h: number, bg: (x: number, y: number) => RGB): Pixels {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, g, b] = bg(x, y)
      const i = (y * w + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  return { width: w, height: h, data }
}

function paintRoundRect(img: Pixels, x0: number, y0: number, w: number, h: number, r: number, color: RGB) {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      // corner test
      const cx = x < x0 + r ? x0 + r : x >= x0 + w - r ? x0 + w - r - 1 : x
      const cy = y < y0 + r ? y0 + r : y >= y0 + h - r ? y0 + h - r - 1 : y
      if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue
      const i = (y * img.width + x) * 4
      img.data[i] = color[0]
      img.data[i + 1] = color[1]
      img.data[i + 2] = color[2]
    }
}

// Smooth wallpaper-ish gradient with some variation so it is not flat.
const wallpaper = (x: number, y: number): RGB => [120 + ((x * 0.1) % 60), 140 + ((y * 0.07) % 50), 200 - ((x + y) % 40)]

describe('detectIsland', () => {
  it('finds the expanded island attached to the pill', () => {
    const w = 1179
    const h = 2556
    const img = image(w, h, wallpaper)
    // Pill at top centre, expanded box below it.
    paintRoundRect(img, 420, 33, 340, 110, 55, [0, 0, 0])
    paintRoundRect(img, 40, 40, 1099, 360, 70, [5, 5, 5])
    // Some white content inside the island
    paintRoundRect(img, 110, 90, 90, 90, 45, [255, 255, 255])
    const c = detectIsland(img)!
    expect(c).not.toBeNull()
    expect(c.kind).toBe('island')
    expect(c.x).toBeCloseTo(40, -1)
    expect(c.y).toBe(33)
    expect(c.w).toBeCloseTo(1099, -1)
    expect(c.y + c.h).toBeCloseTo(400, -1)
    // Radius is measured from the fill, not guessed: the box was painted with r = 70.
    expect(c.radius).toBeGreaterThanOrEqual(64)
    expect(c.radius).toBeLessThanOrEqual(76)
  })
  it('returns null when there is no island', () => {
    const img = image(600, 1300, wallpaper)
    expect(detectIsland(img)).toBeNull()
  })
})

describe('detectLockActivity', () => {
  it('finds a white card near the bottom of the lock screen', () => {
    const w = 1179
    const h = 2556
    const img = image(w, h, wallpaper)
    // Card with margins of 14pt (42 px), height 300, near the bottom.
    paintRoundRect(img, 42, 1880, w - 84, 300, 60, [255, 255, 255])
    // Text-like dark strokes inside the card
    for (let y = 1960; y < 1990; y++) for (let x = 200; x < 700; x++) {
      const i = (y * w + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 20
    }
    // Quick-action circles below, which must not be mistaken for the card
    paintRoundRect(img, 150, 2300, 150, 150, 75, [90, 110, 150])
    const c = detectLockActivity(img)!
    expect(c).not.toBeNull()
    expect(c.kind).toBe('lockActivity')
    expect(c.x).toBeCloseTo(42, -1)
    expect(c.x + c.w).toBeCloseTo(w - 42, -1)
    expect(c.y).toBeCloseTo(1880, -1)
    expect(c.y + c.h).toBeCloseTo(2180, -1)
  })
  it('finds a dark card too', () => {
    const w = 1179
    const h = 2556
    const img = image(w, h, wallpaper)
    paintRoundRect(img, 42, 1700, w - 84, 260, 60, [30, 30, 34])
    const c = detectLockActivity(img)!
    expect(c).not.toBeNull()
    expect(c.y).toBeCloseTo(1700, -1)
    expect(c.h).toBeCloseTo(260, -1)
  })
  it('returns null on a plain wallpaper', () => {
    expect(detectLockActivity(image(1179, 2556, wallpaper))).toBeNull()
  })
})
