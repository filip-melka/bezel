import type { TextStyle } from '../model/types'
import { LINE_HEIGHT, fontString } from './fonts'

// Width of `text` when drawn with `font` (a CSS font string). Injected so the
// wrapping logic stays pure and testable without a canvas.
export type MeasureFn = (text: string, font: string) => number

export type FitResult = {
  lines: string[]
  style: TextStyle
  lineHeight: number
  height: number
  shrunk: boolean
}

export const SHRINK_STEP = 4
export const SHRINK_FLOOR = 0.55
const ELLIPSIS = '…'

// Greedy word wrap. Hard newlines are honoured. A single word wider than
// maxWidth is broken by character.
export function wrapLines(text: string, maxWidth: number, width: (s: string) => number): string[] {
  const out: string[] = []
  for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
    const words = paragraph.split(/\s+/).filter((w) => w.length > 0)
    if (words.length === 0) {
      out.push('')
      continue
    }
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (width(candidate) <= maxWidth) {
        line = candidate
        continue
      }
      if (line) out.push(line)
      if (width(word) <= maxWidth) {
        line = word
        continue
      }
      // Word is wider than the slot on its own: break by character.
      let chunk = ''
      for (const ch of word) {
        if (width(chunk + ch) <= maxWidth || chunk === '') chunk += ch
        else {
          out.push(chunk)
          chunk = ch
        }
      }
      line = chunk
    }
    out.push(line)
  }
  return out
}

export function fitText(
  text: string,
  style: TextStyle,
  maxWidth: number,
  maxLines: number,
  measure: MeasureFn,
): FitResult {
  const requested = style.size
  const floor = Math.ceil(requested * SHRINK_FLOOR)
  let size = requested
  let lines: string[] = []
  for (;;) {
    const font = fontString({ size, weight: style.weight })
    lines = wrapLines(text, maxWidth, (s) => measure(s, font))
    if (lines.length <= maxLines || size - SHRINK_STEP < floor) break
    size -= SHRINK_STEP
  }
  let shrunk = size !== requested
  if (lines.length > maxLines) {
    // Still too long at the floor: truncate with an ellipsis.
    const font = fontString({ size, weight: style.weight })
    lines = lines.slice(0, maxLines)
    let last = lines[maxLines - 1] ?? ''
    while (last.length > 0 && measure(last + ELLIPSIS, font) > maxWidth) last = last.slice(0, -1)
    lines[maxLines - 1] = last.trimEnd() + ELLIPSIS
    shrunk = true
  }
  const lineHeight = size * LINE_HEIGHT
  return {
    lines,
    style: { ...style, size },
    lineHeight,
    height: lines.length * lineHeight,
    shrunk,
  }
}
