import { describe, expect, it } from 'vitest'
import { FRAME_W, SCREEN_X, SCREEN_Y } from '../../src/render/bezel'
import { mapRect, screenshotMapping } from '../../src/render/geometry'

describe('screenshotMapping', () => {
  it('maps a native screenshot 1:1 into the screen area at frame scale 1', () => {
    const device = { x: 100, y: 200, w: FRAME_W, h: 2984 }
    const m = screenshotMapping(device, 1320, 2868)
    expect(m.k).toBeCloseTo(1)
    expect(m.ox).toBeCloseTo(100 + SCREEN_X)
    expect(m.oy).toBeCloseTo(200 + SCREEN_Y)
    const r = mapRect(m, { x: 10, y: 20, w: 300, h: 100 })
    expect(r).toEqual({ x: 100 + SCREEN_X + 10, y: 200 + SCREEN_Y + 20, w: 300, h: 100 })
  })
  it('scales with device width and cover-fit', () => {
    const device = { x: 0, y: 0, w: FRAME_W / 2, h: 2984 / 2 }
    const m = screenshotMapping(device, 660, 1434) // half-res screenshot → cover 2
    expect(m.k).toBeCloseTo(1) // cover 2 × frame scale 0.5
    const r = mapRect(m, { x: 0, y: 0, w: 660, h: 1434 })
    expect(r.w).toBeCloseTo(660)
    expect(r.x).toBeCloseTo(SCREEN_X / 2)
  })
})
