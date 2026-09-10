import { describe, expect, it } from 'vitest'
import { FRAME_ASPECT } from '../../src/render/bezel'
import { LINE_HEIGHT } from '../../src/render/fonts'
import { rotatedBounds } from '../../src/templates/common'
import { mapRect, screenMapping, screenshotMapping } from '../../src/render/geometry'
import { lockCardAnchor } from '../../src/templates/widgetCommon'
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
    const out = TEMPLATES.panorama.layout(layoutInput(newPair('panorama')))
    expect(out.device!.x + out.device!.w / 2).toBeCloseTo(1320)
    expect(out.device?.w).toBe(1500)
    expect(out.device?.y).toBe(720)
  })
  it('lays out text on both slides, each on its own side of the seam', () => {
    const p = newPair('panorama')
    p.headline = 'Left'
    p.headlineRight = 'Right'
    const out = TEMPLATES.panorama.layout(layoutInput(p))
    expect(out.headline!.x).toBe(120)
    expect(out.headline!.x + out.headline!.w).toBeLessThanOrEqual(1320)
    expect(out.headlineRight!.x).toBe(1440)
    expect(out.headlineRight!.lines).toEqual(['Right'])
    expect(out.headline!.y).toBe(out.headlineRight!.y)
  })
  it('leaves a side empty when its fields are empty', () => {
    const p = newPair('panorama')
    p.subheadlineRight = 'Only the right'
    const out = TEMPLATES.panorama.layout(layoutInput(p))
    expect(out.headline).toBeNull()
    expect(out.subheadline).toBeNull()
    expect(out.headlineRight).toBeNull()
    expect(out.subheadlineRight!.y).toBe(260)
  })
  it('keeps the device at 720 when the text fits above it', () => {
    const p = newPair('panorama')
    p.headlineRight = Array.from({ length: 40 }, () => 'word').join(' ')
    expect(TEMPLATES.panorama.layout(layoutInput(p)).device!.y).toBe(720)
  })
  it('drops the device below the taller text block when it would collide', () => {
    const p = newPair('panorama')
    p.headline = 'Short'
    p.headlineRight = Array.from({ length: 40 }, () => 'word').join(' ')
    p.subheadlineRight = Array.from({ length: 40 }, () => 'word').join(' ')
    p.textNudge.offsetY = 200
    const out = TEMPLATES.panorama.layout(layoutInput(p))
    const sub = out.subheadlineRight!
    const textBottom = sub.y + sub.lines.length * sub.lineHeight
    expect(out.device!.y).toBeCloseTo(textBottom + 100)
    expect(out.device!.y).toBeGreaterThan(720)
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
  it('take text on both slides in mirrored slots', () => {
    for (const id of ['panoTilted', 'panoTiltedRight'] as const) {
      const p = newPair(id)
      p.headline = 'L'
      p.headlineRight = 'R'
      const out = TEMPLATES[id].layout(layoutInput(p))
      expect(out.headline!.x).toBe(120)
      expect(1320 - (out.headline!.x + out.headline!.w)).toBe(200)
      expect(out.headlineRight!.x - 1320).toBe(200)
      expect(2640 - (out.headlineRight!.x + out.headlineRight!.w)).toBe(120)
    }
  })
})

describe('widget templates', () => {
  const crop = { kind: 'lockActivity' as const, x: 42, y: 1880, w: 1095, h: 300, radius: 70 }
  it('lockActivity enlarges the card around its own centre', () => {
    const s = newSlide('lockActivity')
    s.widget = { crop, scale: null, offsetY: 0, notFound: false }
    const out = TEMPLATES.lockActivity.layout(layoutInput(s, { w: 1179, h: 2556 }))
    const w = out.widget!
    const d = out.device!
    // Mapped crop centre is inside the device's screen area; box is 1.35× it.
    const m = screenshotMapping(d, 1179, 2556)
    const r = mapRect(m, crop)
    expect(w.box.w).toBeCloseTo(r.w * 1.35)
    expect(w.box.x + w.box.w / 2).toBeCloseTo(r.x + r.w / 2)
    expect(w.box.y + w.box.h / 2).toBeCloseTo(r.y + r.h / 2)
    expect(w.ghost).toBeNull()
    expect(out.screenDim).toBeGreaterThan(0)
  })
  it('lockActivity ignores a crop of the wrong kind and needs a screenshot', () => {
    const s = newSlide('lockActivity')
    s.widget = { crop: { ...crop, kind: 'island' }, scale: null, offsetY: 0, notFound: false }
    expect(TEMPLATES.lockActivity.layout(layoutInput(s, { w: 1179, h: 2556 })).widget).toBeNull()
    s.widget.crop = crop
    expect(TEMPLATES.lockActivity.layout(layoutInput(s, null)).widget).toBeNull()
  })
  it('island enlarges in place like the lock card, capped to the canvas width', () => {
    const s = newSlide('island')
    const ic = { kind: 'island' as const, x: 40, y: 33, w: 1099, h: 367, radius: 73 }
    s.widget = { crop: ic, scale: 2, offsetY: 0, notFound: false }
    const out = TEMPLATES.island.layout(layoutInput(s, { w: 1179, h: 2556 }))
    const w = out.widget!
    const d = out.device!
    const r = mapRect(screenshotMapping(d, 1179, 2556), ic)
    expect(w.box.x + w.box.w / 2).toBeCloseTo(r.x + r.w / 2)
    expect(w.box.y + w.box.h / 2).toBeCloseTo(r.y + r.h / 2)
    expect(w.box.w).toBeCloseTo(1320 - 120)
    expect(w.ghost).toBeNull()
    // The enlarged island clears the headline area by the template gap.
    expect(w.box.y).toBeGreaterThanOrEqual(200 + 96 * 1.15 + 100 - 1)
  })
  it('placeholder screen anchors the cut-out at the standard iOS position', () => {
    const s = newSlide('lockActivity')
    s.widget = { crop, screen: 'placeholder', scale: 1, offsetY: 0, notFound: false }
    const out = TEMPLATES.lockActivity.layout(layoutInput(s, { w: 1179, h: 2556 }))
    expect(out.screenPlaceholder).toBe('lock')
    expect(out.screenDim).toBe(0)
    const d = out.device!
    const m = screenMapping(d)
    const expected = mapRect(m, lockCardAnchor(crop.w / crop.h))
    expect(out.widget!.box.x).toBeCloseTo(expected.x)
    expect(out.widget!.box.y).toBeCloseTo(expected.y)
    expect(out.widget!.box.w).toBeCloseTo(expected.w)
    // Works without a screenshot size too, since the anchor does not need one.
    expect(TEMPLATES.lockActivity.layout(layoutInput(s, null)).widget).not.toBeNull()
  })
})

describe('placeholder colour', () => {
  const crop = { kind: 'lockActivity' as const, x: 42, y: 1880, w: 1095, h: 300, radius: 70 }
  it('passes the custom colour through only when the placeholder is on', () => {
    const s = newSlide('lockActivity')
    s.widget = { crop, screen: 'placeholder', placeholderColor: '#0b6e4f', scale: null, offsetY: 0, notFound: false }
    expect(TEMPLATES.lockActivity.layout(layoutInput(s, null)).screenPlaceholderColor).toBe('#0b6e4f')
    s.widget.screen = 'screenshot'
    expect(TEMPLATES.lockActivity.layout(layoutInput(s, { w: 1179, h: 2556 })).screenPlaceholderColor).toBeNull()
  })
  it('defaults to null so the designed palette is used', () => {
    const s = newSlide('island')
    s.widget = { crop: null, screen: 'placeholder', scale: null, offsetY: 0, notFound: false }
    expect(TEMPLATES.island.layout(layoutInput(s, null)).screenPlaceholderColor).toBeNull()
  })
})

describe('per-side text styles on pairs', () => {
  const left = { size: 120, weight: 700 as const, color: '#ff0000', align: 'left' as const }
  it('right slide follows the left style until it has its own', () => {
    const p = newPair('panorama')
    p.headline = 'L'
    p.headlineRight = 'R'
    p.overrides = { headline: left }
    const out = TEMPLATES.panorama.layout(layoutInput(p))
    expect(out.headline!.style.align).toBe('left')
    expect(out.headlineRight!.style).toEqual(left)
  })
  it('right slide override applies to the right only', () => {
    const p = newPair('panoTilted')
    p.headline = 'L'
    p.headlineRight = 'R'
    p.overrides = { headline: left, headlineRight: { ...left, align: 'right' } }
    const out = TEMPLATES.panoTilted.layout(layoutInput(p))
    expect(out.headline!.style.align).toBe('left')
    expect(out.headlineRight!.style.align).toBe('right')
    expect(out.headlineRight!.style.size).toBe(120)
  })
  it('subheadline sides are independent of headline sides', () => {
    const p = newPair('panorama')
    p.subheadline = 'l'
    p.subheadlineRight = 'r'
    p.overrides = { subheadlineRight: { size: 40, weight: 400, color: '#000000', align: 'right' } }
    const out = TEMPLATES.panorama.layout(layoutInput(p))
    expect(out.subheadline!.style.align).toBe('center')
    expect(out.subheadlineRight!.style.align).toBe('right')
  })
})

describe('per-side text position on pairs', () => {
  it('offsets each slide by its own nudge', () => {
    for (const id of ['panorama', 'panoTilted', 'panoTiltedRight'] as const) {
      const p = newPair(id)
      p.headline = 'L'
      p.headlineRight = 'R'
      p.textNudge.offsetY = 40
      p.textNudgeRight.offsetY = -60
      const out = TEMPLATES[id].layout(layoutInput(p))
      expect(out.headline!.y).toBe(260 + 40)
      expect(out.headlineRight!.y).toBe(260 - 60)
    }
  })
  it('clamps the right nudge to the template limits', () => {
    const p = newPair('panorama')
    p.headlineRight = 'R'
    p.textNudgeRight.offsetY = 9999
    expect(TEMPLATES.panorama.layout(layoutInput(p)).headlineRight!.y).toBe(260 + 200)
  })
})
