import { describe, expect, it } from 'vitest'
import { FRAME_ASPECT } from '../../src/render/bezel'
import { LINE_HEIGHT } from '../../src/render/fonts'
import { rotatedBounds } from '../../src/templates/common'
import { TEMPLATES } from '../../src/templates/registry'
import { layoutInput, newPair, newSlide } from '../helpers'

describe('textTop', () => {
  it('places the device 140 px below the text and centred', () => {
    const s = newSlide('textTop')
    s.headline = 'Hello'
    const out = TEMPLATES.textTop.layout(layoutInput(s))
    expect(out.headline?.y).toBe(200)
    expect(out.headline?.lines).toEqual(['Hello'])
    const textBottom = 200 + 96 * LINE_HEIGHT
    expect(out.device?.y).toBeCloseTo(textBottom + 140)
    expect(out.device?.w).toBe(1080)
    expect(out.device?.x).toBe(120)
    expect(out.device?.h).toBeCloseTo(1080 / FRAME_ASPECT)
    expect(out.subheadline).toBeNull()
  })
  it('moves the subheadline into the headline slot when the headline is empty', () => {
    const s = newSlide('textTop')
    s.subheadline = 'Only sub'
    const out = TEMPLATES.textTop.layout(layoutInput(s))
    expect(out.headline).toBeNull()
    expect(out.subheadline?.y).toBe(200)
    expect(out.subheadline?.style.size).toBe(56)
  })
  it('places the device as if a one-line headline existed when both fields are empty', () => {
    const empty = TEMPLATES.textTop.layout(layoutInput(newSlide('textTop')))
    const one = newSlide('textTop')
    one.headline = 'Hi'
    const withHead = TEMPLATES.textTop.layout(layoutInput(one))
    expect(empty.device?.y).toBeCloseTo(withHead.device!.y)
  })
  it('applies and clamps nudges', () => {
    const s = newSlide('textTop')
    s.headline = 'x'
    s.textNudge.offsetY = 1000
    s.device = { scale: 2, offsetY: 1000 }
    const out = TEMPLATES.textTop.layout(layoutInput(s))
    expect(out.headline?.y).toBe(320)
    expect(out.device?.w).toBeCloseTo(1080 * 1.15)
  })
  it('shrinks a long headline to at most three lines', () => {
    const s = newSlide('textTop')
    s.headline = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ')
    const out = TEMPLATES.textTop.layout(layoutInput(s))
    expect(out.headline?.lines.length).toBeLessThanOrEqual(3)
    expect(out.headline?.shrunk).toBe(true)
  })
})

describe('deviceOnly', () => {
  it('fits the device fully inside with 180 px padding', () => {
    const out = TEMPLATES.deviceOnly.layout(layoutInput(newSlide('deviceOnly')))
    expect(out.headline).toBeNull()
    expect(out.device?.h).toBe(2868 - 360)
    expect(out.device?.y).toBe(180)
    expect(out.device!.x + out.device!.w / 2).toBeCloseTo(660)
  })
})

describe('tilted', () => {
  it('rotates −12° and overhangs the right and bottom edges', () => {
    const out = TEMPLATES.tilted.layout(layoutInput(newSlide('tilted')))
    const d = out.device!
    expect(d.rotation).toBe(-12)
    const b = rotatedBounds(d.w, d.h, d.rotation)
    const cx = d.x + d.w / 2
    const cy = d.y + d.h / 2
    expect(cx + b.w / 2).toBeGreaterThan(1320)
    expect(cy + b.h / 2).toBeGreaterThan(2868)
  })
  it('keeps text in the top-left 900 px slot', () => {
    const s = newSlide('tilted')
    s.headline = 'Head'
    const out = TEMPLATES.tilted.layout(layoutInput(s))
    expect(out.headline?.x).toBe(120)
    expect(out.headline?.w).toBe(900)
  })
})

describe('panorama pair', () => {
  it('centres the device on the seam of a 2640 canvas', () => {
    const p = newPair('panoLeftText')
    const out = TEMPLATES.panoLeftText.layout(layoutInput(p))
    expect(out.device!.x + out.device!.w / 2).toBeCloseTo(1320)
    expect(out.device?.w).toBe(1500)
    expect(out.device?.y).toBe(720)
  })
  it('keeps text on its own side of the seam', () => {
    const l = newPair('panoLeftText')
    l.headline = 'L'
    const r = newPair('panoRightText')
    r.headline = 'R'
    const lo = TEMPLATES.panoLeftText.layout(layoutInput(l))
    const ro = TEMPLATES.panoRightText.layout(layoutInput(r))
    expect(lo.headline!.x + lo.headline!.w).toBeLessThanOrEqual(1320)
    expect(ro.headline!.x).toBeGreaterThanOrEqual(1320)
    expect(ro.headline!.x).toBe(1440)
  })
})

describe('rotatedBounds', () => {
  it('is the identity at 0° and swaps at 90°', () => {
    expect(rotatedBounds(10, 20, 0)).toEqual({ w: 10, h: 20 })
    const r = rotatedBounds(10, 20, 90)
    expect(r.w).toBeCloseTo(20)
    expect(r.h).toBeCloseTo(10)
  })
})

describe('textBottom', () => {
  it('anchors the text 200 px above the bottom and hangs the device above it', () => {
    const s = newSlide('textBottom')
    s.headline = 'Hello'
    const out = TEMPLATES.textBottom.layout(layoutInput(s))
    const lineH = 96 * LINE_HEIGHT
    expect(out.headline?.y).toBeCloseTo(2868 - 200 - lineH)
    const d = out.device!
    expect(d.y).toBe(-300)
    expect(d.y + d.h).toBeLessThanOrEqual(out.headline!.y - 140)
    expect(d.x + d.w / 2).toBeCloseTo(660)
  })
  it('lifts the device when a tall text block would collide with it', () => {
    const s = newSlide('textBottom')
    s.headline = Array.from({ length: 12 }, () => 'word').join(' ')
    s.subheadline = Array.from({ length: 12 }, () => 'word').join(' ')
    s.device.scale = 1.15
    const out = TEMPLATES.textBottom.layout(layoutInput(s))
    const d = out.device!
    const textTop = out.headline!.y
    expect(d.y).toBeLessThan(-300)
    expect(d.y + d.h).toBeCloseTo(textTop - 140)
  })
  it('stacks headline above subheadline in reading order', () => {
    const s = newSlide('textBottom')
    s.headline = 'A'
    s.subheadline = 'B'
    const out = TEMPLATES.textBottom.layout(layoutInput(s))
    expect(out.headline!.y).toBeLessThan(out.subheadline!.y)
    expect(out.subheadline!.y + out.subheadline!.lineHeight).toBeCloseTo(2868 - 200)
  })
})

describe('tilted panoramas', () => {
  it('rotate opposite ways and centre on the seam', () => {
    const l = TEMPLATES.panoTilted.layout(layoutInput(newPair('panoTilted')))
    const r = TEMPLATES.panoTiltedRight.layout(layoutInput(newPair('panoTiltedRight')))
    expect(l.device?.rotation).toBe(-12)
    expect(r.device?.rotation).toBe(12)
    for (const d of [l.device!, r.device!]) {
      expect(d.x + d.w / 2).toBeCloseTo(1320)
      const b = rotatedBounds(d.w, d.h, d.rotation)
      expect(d.y + d.h / 2 + b.h / 2).toBeGreaterThan(2868)
    }
  })
  it('keeps text on the named side', () => {
    const l = newPair('panoTilted')
    l.headline = 'L'
    const r = newPair('panoTiltedRight')
    r.headline = 'R'
    const lo = TEMPLATES.panoTilted.layout(layoutInput(l))
    const ro = TEMPLATES.panoTiltedRight.layout(layoutInput(r))
    expect(lo.headline!.x + lo.headline!.w).toBeLessThanOrEqual(1320)
    expect(ro.headline!.x).toBeGreaterThanOrEqual(1320)
  })
})
