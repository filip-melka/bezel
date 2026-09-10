import type {
  Background,
  GradientStop,
  Pair,
  PairTemplateId,
  Project,
  Slide,
  SlideTemplateId,
  TextStyle,
  Theme,
} from './types'

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  // Fallback for non-secure contexts.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export const DEFAULT_BACKGROUND: Background = {
  kind: 'linear',
  angle: 0,
  stops: [
    { offset: 0, color: '#0b3d91' },
    { offset: 1, color: '#1fa2ff' },
  ] satisfies GradientStop[],
}

export const DEFAULT_HEADLINE: TextStyle = { size: 96, weight: 700, color: '#ffffff', align: 'center' }
export const DEFAULT_SUBHEADLINE: TextStyle = { size: 56, weight: 500, color: '#e6e6eb', align: 'center' }

export function defaultTheme(): Theme {
  return {
    background: structuredClone(DEFAULT_BACKGROUND),
    headline: { ...DEFAULT_HEADLINE },
    subheadline: { ...DEFAULT_SUBHEADLINE },
    bezel: { finish: 'black', shadow: true },
  }
}

export function newSlide(template: SlideTemplateId = 'textTop'): Slide {
  return {
    kind: 'slide',
    id: uuid(),
    template,
    screenshot: null,
    headline: '',
    subheadline: '',
    device: { scale: 1, offsetY: 0 },
    textNudge: { offsetY: 0 },
    overrides: {},
  }
}

export function newPair(template: PairTemplateId = 'panoLeftText'): Pair {
  return {
    kind: 'pair',
    id: uuid(),
    template,
    screenshot: null,
    headline: '',
    subheadline: '',
    device: { scale: 1, offsetY: 0 },
    textNudge: { offsetY: 0 },
    overrides: {},
  }
}

export function newProject(name: string): Project {
  const now = Date.now()
  return {
    id: uuid(),
    name,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    theme: defaultTheme(),
    items: [newSlide('textTop')],
  }
}

export function resolveTheme(theme: Theme, overrides: Slide['overrides']): Theme {
  return {
    background: overrides.background ?? theme.background,
    headline: { ...theme.headline, ...overrides.headline },
    subheadline: { ...theme.subheadline, ...overrides.subheadline },
    bezel: theme.bezel,
  }
}
