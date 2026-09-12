import type { FontId, TextWeight } from '../../model/types'
import interLatin from './inter-latin.woff2'
import interLatinExt from './inter-latin-ext.woff2'
import jakartaLatin from './jakarta-latin.woff2'
import jakartaLatinExt from './jakarta-latin-ext.woff2'
import sourceSerifLatin from './source-serif-4-latin.woff2'
import sourceSerifLatinExt from './source-serif-4-latin-ext.woff2'

// The bundled families, declared once here and registered with the document at
// startup through the FontFace API rather than a stylesheet, so the family
// names, weight ranges and files cannot drift between CSS and TypeScript.
// Self-hosted, never a CDN: Bezel makes no network requests, and an export must
// never depend on a font host being reachable (SPEC §3, §7.3).

// What Bezel drew before fonts were bundled. Kept as the tail of every stack so
// a face that fails to load still renders something sane.
export const SYSTEM_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

// Google's subset ranges, verbatim. Latin covers Latin-1; latin-ext carries the
// Czech, Polish, Hungarian and Turkish letters, so both are needed for European
// copy.
const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
const LATIN_EXT =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'

export type FontDef = {
  label: string
  // CSS family name, as the faces are registered and as canvas asks for it.
  family: string
  // Family list for `ctx.font` and for CSS: the bundled family, then the system
  // stack as a fallback.
  stack: string
  // Variable weight range of the bundled files. Every family spans 400–700, the
  // range the Weight control offers, so no weight is ever a synthesised bold.
  weights: [number, number]
  files: { url: string; unicodeRange: string }[]
}

function def(label: string, family: string, weights: [number, number], latin: string, latinExt: string): FontDef {
  const quoted = family.includes(' ') ? `"${family}"` : family
  return {
    label,
    family,
    stack: `${quoted}, ${SYSTEM_STACK}`,
    weights,
    files: [
      { url: latin, unicodeRange: LATIN },
      { url: latinExt, unicodeRange: LATIN_EXT },
    ],
  }
}

export const FONTS: Record<FontId, FontDef> = {
  inter: def('Inter', 'Inter', [100, 900], interLatin, interLatinExt),
  jakarta: def('Plus Jakarta Sans', 'Plus Jakarta Sans', [200, 800], jakartaLatin, jakartaLatinExt),
  sourceSerif: def('Source Serif 4', 'Source Serif 4', [200, 900], sourceSerifLatin, sourceSerifLatinExt),
}

export const FONT_IDS: FontId[] = ['inter', 'jakarta', 'sourceSerif']

export function isFontId(v: unknown): v is FontId {
  return typeof v === 'string' && v in FONTS
}

// The family the drawn lock / home placeholders always use. They imitate iOS
// chrome, so they must not change with the project's font — and, like slide
// text, must not change with the machine either.
export const PLACEHOLDER_FONT = FONTS.inter.stack

// Weights the model allows. Declared on each face so the browser knows the
// variable range covers them.
const WEIGHT_RANGE = (d: FontDef) => `${d.weights[0]} ${d.weights[1]}`

let started: Promise<void> | null = null

// Registers every bundled face and resolves once they are all loaded, or after
// 1 s regardless (SPEC §11). The canvas must not measure before this resolves:
// a face the DOM never asked for would otherwise be missing at first render and
// the text would wrap against the fallback metrics.
export function fontsReady(): Promise<void> {
  if (started) return started
  if (typeof document === 'undefined' || !('fonts' in document)) return Promise.resolve()
  const loads = FONT_IDS.flatMap((id) => {
    const d = FONTS[id]
    return d.files.map((f) => {
      const face = new FontFace(d.family, `url(${f.url}) format('woff2')`, {
        weight: WEIGHT_RANGE(d),
        style: 'normal',
        display: 'swap',
        unicodeRange: f.unicodeRange,
      })
      document.fonts.add(face)
      // A single failure must not stop the others, or the editor never renders.
      return face.load().then(
        () => undefined,
        () => undefined,
      )
    })
  })
  started = Promise.race([
    Promise.all(loads).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, 1000)),
  ])
  return started
}

// Exported for the test that checks every family covers the model's weights.
export const MODEL_WEIGHTS: TextWeight[] = [400, 500, 600, 700]
