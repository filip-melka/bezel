import type { TextStyle } from '../model/types'

// SPEC §7.3. The same stack is used by the editor chrome (DESIGN §2.1).
export const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

export const LINE_HEIGHT = 1.15

export function fontString(style: Pick<TextStyle, 'size' | 'weight'>): string {
  return `${style.weight} ${style.size}px ${FONT_FAMILY}`
}

// Resolves when system fonts are ready, or after 1 s regardless (SPEC §11).
export function fontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return Promise.resolve()
  return Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, 1000)),
  ])
}
