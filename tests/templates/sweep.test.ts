import { describe, expect, it } from 'vitest'
import { ALL_TEMPLATE_IDS, TEMPLATES } from '../../src/templates/registry'
import { rotatedBounds } from '../../src/templates/common'
import type { WidgetMode } from '../../src/model/types'
import { layoutOf, newPair, newSlide } from '../helpers'

const shot = { w: 1179, h: 2556 }
const crops = {
  lockActivity: { kind: 'lockActivity' as const, x: 42, y: 1880, w: 1095, h: 300, radius: 70 },
  island: { kind: 'island' as const, x: 40, y: 33, w: 1099, h: 367, radius: 73 },
}

describe('sweep: every layout × option combination', () => {
  it('produces a device with the cut-out on it, never NaN', () => {
    let checked = 0
    for (const id of ALL_TEMPLATE_IDS) {
      const def = TEMPLATES[id]
      for (const tilt of ['left', 'right'] as const) {
        for (const mode of ['none', 'lockActivity', 'island'] as WidgetMode[]) {
          for (const screen of ['screenshot', 'placeholder'] as const) {
            for (const wscale of [1, 1.35, 2]) {
              for (const woff of [-400, 0, 400]) {
                const item = def.slots === 2 ? newPair(id as 'panorama') : newSlide(id as 'textTop')
                item.tilt = tilt
                item.headline = 'Ship it faster'
                item.subheadline = 'Every screenshot, framed'
                if (mode !== 'none') {
                  item.widget = { mode, crop: crops[mode], screen, scale: wscale, offsetY: woff, notFound: false }
                }
                const out = layoutOf(item, shot)
                const d = out.device!
                for (const v of [d.x, d.y, d.w, d.h, d.rotation]) expect(Number.isFinite(v)).toBe(true)
                if (mode === 'none') {
                  expect(out.widget ?? null).toBeNull()
                  continue
                }
                const w = out.widget!
                for (const v of [w.box.x, w.box.y, w.box.w, w.box.h, w.radius, w.rotation]) {
                  expect(Number.isFinite(v)).toBe(true)
                }
                expect(w.rotation).toBe(d.rotation)
                expect(w.radius).toBeGreaterThan(0)
                // Keeps the 60 px side margin on the canvas.
                const canvasW = def.slots === 2 ? 2640 : 1320
                expect(w.box.w).toBeLessThanOrEqual(canvasW - 120 + 0.001)
                // At rest the centre lies within the device's rotated bounds:
                // it is on the screen. The offset slider may take it off, which
                // is what it is for.
                if (woff === 0) {
                  const b = rotatedBounds(d.w, d.h, d.rotation)
                  expect(Math.abs(w.box.x + w.box.w / 2 - (d.x + d.w / 2))).toBeLessThanOrEqual(b.w / 2)
                  expect(Math.abs(w.box.y + w.box.h / 2 - (d.y + d.h / 2))).toBeLessThanOrEqual(b.h / 2)
                }
                checked += 1
              }
            }
          }
        }
      }
    }
    expect(checked).toBe(6 * 2 * 2 * 2 * 3 * 3)
  })

  it('never lets the cut-out reach the text on the templates that leave room', () => {
    for (const id of ['textTop', 'panorama'] as const) {
      for (const mode of ['lockActivity', 'island'] as const) {
        for (const wscale of [1, 1.35, 2]) {
          const item = id === 'panorama' ? newPair(id) : newSlide(id)
          item.headline = 'Ship it faster'
          item.widget = { mode, crop: crops[mode], screen: 'screenshot', scale: wscale, offsetY: 0, notFound: false }
          const out = layoutOf(item, shot)
          const head = out.headline!
          const textBottom = head.y + head.lines.length * head.lineHeight
          expect(out.widget!.box.y).toBeGreaterThan(textBottom)
        }
      }
    }
  })
})
