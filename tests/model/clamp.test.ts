import { describe, expect, it } from 'vitest'
import { canAdd, clampItemToTemplate, exportNumbers, rangeLabel, slotsFree, slotsUsed } from '../../src/model/clamp'
import { newPair, newSlide } from '../helpers'

describe('slot budget', () => {
  it('counts pairs as two slots', () => {
    const items = [newSlide(), newPair(), newSlide()]
    expect(slotsUsed(items)).toBe(4)
    expect(slotsFree(items)).toBe(6)
  })
  it('refuses additions past the cap', () => {
    const nine = Array.from({ length: 9 }, () => newSlide())
    expect(canAdd(nine, 1)).toBe(true)
    expect(canAdd(nine, 2)).toBe(false)
    expect(canAdd([...nine, newSlide()], 1)).toBe(false)
  })
})

describe('exportNumbers', () => {
  it('numbers items in order with pairs spanning two', () => {
    const a = newSlide()
    const p = newPair()
    const b = newSlide()
    const n = exportNumbers([a, p, b])
    expect(n.get(a.id)).toEqual({ start: 1, end: 1 })
    expect(n.get(p.id)).toEqual({ start: 2, end: 3 })
    expect(n.get(b.id)).toEqual({ start: 4, end: 4 })
    expect(rangeLabel(n.get(p.id)!)).toBe('02–03')
    expect(rangeLabel(n.get(b.id)!)).toBe('04')
  })
})

describe('clampItemToTemplate', () => {
  it('clamps out-of-range values to the template limits', () => {
    const s = newSlide('textTop')
    s.device = { scale: 5, offsetY: -9999 }
    s.textNudge = { offsetY: 9999 }
    const c = clampItemToTemplate(s)
    expect(c.device).toEqual({ scale: 1.15, offsetY: -200 })
    expect(c.textNudge.offsetY).toBe(120)
  })
  it('returns the same object when nothing changes', () => {
    const s = newSlide('tilted')
    expect(clampItemToTemplate(s)).toBe(s)
  })
  it('treats NaN as the lower bound', () => {
    const s = newSlide('deviceOnly')
    s.device = { scale: Number.NaN, offsetY: 0 }
    expect(clampItemToTemplate(s).device.scale).toBe(0.7)
  })
})

describe('clampItemToTemplate on pairs', () => {
  it('clamps both text offsets independently', () => {
    const p = newPair('panorama')
    p.textNudge = { offsetY: -9999 }
    p.textNudgeRight = { offsetY: 9999 }
    const c = clampItemToTemplate(p)
    expect(c.textNudge.offsetY).toBe(-100)
    expect(c.textNudgeRight.offsetY).toBe(200)
  })
})
