import type { TextStyle } from '../model/types'

// SPEC §7.3. The family is a parameter, not a constant: it comes from the
// project's theme (src/assets/fonts), so the same project measures the same way
// on every machine.

export const LINE_HEIGHT = 1.15

export function fontString(style: Pick<TextStyle, 'size' | 'weight'>, family: string): string {
  return `${style.weight} ${style.size}px ${family}`
}
