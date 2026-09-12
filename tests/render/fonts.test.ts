import { describe, expect, it } from 'vitest'
import { FONTS, FONT_IDS, MODEL_WEIGHTS, PLACEHOLDER_FONT, SYSTEM_STACK, isFontId } from '../../src/assets/fonts/fonts'
import { DEFAULT_HEADLINE, DEFAULT_SUBHEADLINE, defaultTheme } from '../../src/model/defaults'
import { fontString } from '../../src/render/fonts'

describe('fontString', () => {
  it('puts the given family in the canvas font string', () => {
    expect(fontString({ size: 96, weight: 700 }, FONTS.sourceSerif.stack)).toBe(`700 96px ${FONTS.sourceSerif.stack}`)
  })
  it('does not fall back to a module-level family', () => {
    // Regression guard: the family used to be a constant, which is what made
    // exports depend on the machine.
    expect(fontString({ size: 56, weight: 500 }, 'Nothing')).toBe('500 56px Nothing')
  })
})

describe('bundled fonts', () => {
  it('names every id in the registry and nothing else', () => {
    expect(FONT_IDS).toEqual(Object.keys(FONTS))
    expect(isFontId('inter')).toBe(true)
    expect(isFontId('comicSans')).toBe(false)
    expect(isFontId(undefined)).toBe(false)
  })
  it('starts a new project on a font that exists', () => {
    expect(isFontId(defaultTheme().font)).toBe(true)
  })
  it('falls back to the system stack, so a face that fails to load still renders', () => {
    for (const id of FONT_IDS) expect(FONTS[id].stack.endsWith(SYSTEM_STACK)).toBe(true)
  })
  it('quotes multi-word family names so the CSS font string parses', () => {
    for (const id of FONT_IDS) {
      const first = FONTS[id].stack.split(',')[0]!.trim()
      expect(first.includes(' ') ? /^".*"$/.test(first) : true).toBe(true)
      expect(first.replace(/"/g, '')).toBe(FONTS[id].family)
    }
  })
  it('covers every weight the model offers, so nothing is faux bold', () => {
    // This is what ruled out one-weight display faces: the Weight control and
    // both default styles must sit inside each family's variable range.
    const needed = [...MODEL_WEIGHTS, DEFAULT_HEADLINE.weight, DEFAULT_SUBHEADLINE.weight]
    for (const id of FONT_IDS) {
      const [lo, hi] = FONTS[id].weights
      expect(lo).toBeLessThan(hi)
      for (const w of needed) {
        expect(w, `${id} covers ${w}`).toBeGreaterThanOrEqual(lo)
        expect(w, `${id} covers ${w}`).toBeLessThanOrEqual(hi)
      }
    }
  })
  it('ships two local subsets per family, latin and latin-ext', () => {
    for (const id of FONT_IDS) {
      const files = FONTS[id].files
      expect(files, `${id} subsets`).toHaveLength(2)
      for (const f of files) {
        // Vite resolves these to local asset paths; anything absolute would
        // mean a CDN crept in.
        expect(f.url).not.toMatch(/^https?:/)
        expect(f.url).toMatch(/\.woff2$/)
        expect(f.unicodeRange).toMatch(/^U\+/)
      }
      // Latin-1 and the extended block, so Czech and Polish copy has glyphs.
      expect(files[0]!.unicodeRange).toContain('U+0000-00FF')
      expect(files[1]!.unicodeRange).toContain('U+0100-02BA')
    }
  })
  it('draws the placeholders in a fixed family, not the project font', () => {
    expect(PLACEHOLDER_FONT).toBe(FONTS.inter.stack)
  })
})
