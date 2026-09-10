import { describe, expect, it } from 'vitest'
import { backgroundToCss, linearGradientEndpoints, sortedStops } from '../../src/render/background'

describe('linearGradientEndpoints', () => {
  it('angle 0 runs bottom to top through the centre', () => {
    const { start, end } = linearGradientEndpoints(0, 100, 200)
    expect(start).toEqual({ x: 50, y: 200 })
    expect(end).toEqual({ x: 50, y: 0 })
  })
  it('angle 90 runs left to right', () => {
    const { start, end } = linearGradientEndpoints(90, 100, 200)
    expect(start.x).toBeCloseTo(0)
    expect(end.x).toBeCloseTo(100)
    expect(start.y).toBeCloseTo(100)
    expect(end.y).toBeCloseTo(100)
  })
  it('angle 180 runs top to bottom', () => {
    const { start, end } = linearGradientEndpoints(180, 100, 200)
    expect(start.y).toBeCloseTo(0)
    expect(end.y).toBeCloseTo(200)
  })
  it('diagonal gradient line reaches the corners', () => {
    // For a square, 45° should go from bottom-left corner to top-right corner.
    const { start, end } = linearGradientEndpoints(45, 100, 100)
    expect(start.x).toBeCloseTo(0)
    expect(start.y).toBeCloseTo(100)
    expect(end.x).toBeCloseTo(100)
    expect(end.y).toBeCloseTo(0)
  })
})

describe('sortedStops / backgroundToCss', () => {
  it('sorts and clamps stops', () => {
    const s = sortedStops({ kind: 'linear', angle: 0, stops: [{ offset: 1.5, color: 'b' }, { offset: -1, color: 'a' }] })
    expect(s).toEqual([{ offset: 0, color: 'a' }, { offset: 1, color: 'b' }])
  })
  it('renders CSS for each kind', () => {
    expect(backgroundToCss({ kind: 'solid', color: '#123456' })).toBe('#123456')
    expect(backgroundToCss({ kind: 'linear', angle: 30, stops: [{ offset: 0, color: '#000' }, { offset: 1, color: '#fff' }] })).toBe(
      'linear-gradient(30deg, #000 0%, #fff 100%)',
    )
    expect(backgroundToCss({ kind: 'radial', stops: [{ offset: 0, color: '#000' }, { offset: 1, color: '#fff' }] })).toBe(
      'radial-gradient(circle at center, #000 0%, #fff 100%)',
    )
  })
})
