import type { MeasureFn } from '../src/render/text'
import type { SlideItem, TextStyle } from '../src/model/types'
import { defaultTheme, newPair, newSlide, resolveTheme } from '../src/model/defaults'
import { fitText } from '../src/render/text'
import type { LayoutInput } from '../src/templates/types'
import { canvasSizeFor, layoutItem } from '../src/templates/registry'

// Deterministic width: each character is half the font size wide.
export const fakeMeasure: MeasureFn = (text, font) => {
  const m = /(\d+(?:\.\d+)?)px/.exec(font)
  const size = m ? Number(m[1]) : 16
  return text.length * size * 0.5
}

export function fakeMeasureText(text: string, style: TextStyle, maxWidth: number, maxLines: number) {
  return fitText(text, style, maxWidth, maxLines, fakeMeasure)
}

export function layoutInput(item: SlideItem, screenshotSize: { w: number; h: number } | null = null): LayoutInput {
  const { w, h } = canvasSizeFor(item)
  return {
    canvasW: w,
    canvasH: h,
    item,
    // Same as renderItem: the item's own overrides are resolved over the theme.
    resolvedTheme: resolveTheme(defaultTheme(), item.overrides),
    screenshotSize,
    measureText: fakeMeasureText,
  }
}

// The layout the renderer would use: the template's geometry plus the Live
// Activity overlay, if the item has one.
export function layoutOf(item: SlideItem, screenshotSize: { w: number; h: number } | null = null) {
  return layoutItem(layoutInput(item, screenshotSize))
}

export { newPair, newSlide }
