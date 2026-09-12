import { describe, expect, it } from 'vitest'
import { fitText, wrapLines } from '../../src/render/text'
import { fakeMeasure } from '../helpers'
import type { TextStyle } from '../../src/model/types'

const style: TextStyle = { size: 100, weight: 700, color: '#fff', align: 'center' }
const width = (s: string) => fakeMeasure(s, '700 100px x') // 50 px per char

describe('wrapLines', () => {
  it('keeps short text on one line', () => {
    expect(wrapLines('hello world', 1000, width)).toEqual(['hello world'])
  })
  it('wraps greedily at word boundaries', () => {
    // 'aaaa bbbb cccc' → each word 200 px, space 50. maxWidth 500 fits 'aaaa bbbb' (450).
    expect(wrapLines('aaaa bbbb cccc', 500, width)).toEqual(['aaaa bbbb', 'cccc'])
  })
  it('honours hard newlines', () => {
    expect(wrapLines('one\ntwo', 10000, width)).toEqual(['one', 'two'])
    expect(wrapLines('a\r\n\r\nb', 10000, width)).toEqual(['a', '', 'b'])
  })
  it('breaks a single over-wide word by character', () => {
    // 10 chars = 500 px; maxWidth 200 fits 4 chars per line.
    expect(wrapLines('abcdefghij', 200, width)).toEqual(['abcd', 'efgh', 'ij'])
  })
  it('collapses runs of whitespace', () => {
    expect(wrapLines('  a   b  ', 10000, width)).toEqual(['a b'])
  })
})

describe('fitText', () => {
  it('does not shrink when the text fits', () => {
    const r = fitText('short', style, 1000, 3, 'Inter, sans-serif', fakeMeasure)
    expect(r.shrunk).toBe(false)
    expect(r.style.size).toBe(100)
    expect(r.lines).toEqual(['short'])
    expect(r.lineHeight).toBeCloseTo(115)
    expect(r.height).toBeCloseTo(115)
  })
  it('shrinks in 4 px steps until the text fits the line limit', () => {
    // 'aaaa bbbb cccc dddd' at 100 px: 4 lines in 300 px width. At 60 px each word is 120 → 2 per line (270 ≤ 300).
    const r = fitText('aaaa bbbb cccc dddd', style, 300, 2, 'Inter, sans-serif', fakeMeasure)
    expect(r.shrunk).toBe(true)
    expect(r.lines.length).toBeLessThanOrEqual(2)
    expect(r.style.size).toBeLessThan(100)
    expect((100 - r.style.size) % 4).toBe(0)
  })
  it('stops at the 55% floor and truncates with an ellipsis', () => {
    const long = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ')
    const r = fitText(long, style, 400, 2, 'Inter, sans-serif', fakeMeasure)
    expect(r.shrunk).toBe(true)
    expect(r.style.size).toBeGreaterThanOrEqual(55)
    expect(r.style.size).toBeLessThan(60)
    expect(r.lines).toHaveLength(2)
    expect(r.lines[1]!.endsWith('…')).toBe(true)
    // Truncated line still fits.
    const font = `700 ${r.style.size}px x`
    expect(fakeMeasure(r.lines[1]!, font)).toBeLessThanOrEqual(400)
  })
  it('never returns a size below the floor', () => {
    const r = fitText('x'.repeat(500), { ...style, size: 96 }, 100, 1, 'Inter, sans-serif', fakeMeasure)
    expect(r.style.size).toBeGreaterThanOrEqual(Math.ceil(96 * 0.55))
  })
})
