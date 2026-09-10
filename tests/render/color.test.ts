import { describe, expect, it } from 'vitest'
import { hexToHsl, hexToRgb, hsl, luminance, needsDarkInk } from '../../src/render/color'

describe('colour helpers', () => {
  it('parses 3- and 6-digit hex', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255])
    expect(hexToRgb('#0a7aff')).toEqual([10, 122, 255])
  })
  it('converts to HSL', () => {
    const red = hexToHsl('#ff0000')
    expect(red.h).toBeCloseTo(0)
    expect(red.s).toBeCloseTo(100)
    expect(red.l).toBeCloseTo(50)
    const grey = hexToHsl('#808080')
    expect(grey.s).toBe(0)
    const plum = hexToHsl('#3a2a52')
    expect(plum.h).toBeGreaterThan(260)
    expect(plum.h).toBeLessThan(270)
  })
  it('wraps hue and clamps saturation and lightness', () => {
    expect(hsl(-30, 150, -5)).toBe('hsl(330.0 100.0% 0.0%)')
    expect(hsl(390, 50, 50)).toBe('hsl(30.0 50.0% 50.0%)')
  })
  it('picks dark ink only for light colours', () => {
    expect(luminance('#000000')).toBe(0)
    expect(luminance('#ffffff')).toBeCloseTo(1)
    expect(needsDarkInk('#3a2a52')).toBe(false)
    expect(needsDarkInk('#1c1c1e')).toBe(false)
    expect(needsDarkInk('#f2e8d5')).toBe(true)
    expect(needsDarkInk('#ffd60a')).toBe(true)
  })
})
