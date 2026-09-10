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
  Overrides,
  TextStyleKey,
  WidgetState,
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

export function defaultWidget(): WidgetState {
  return { crop: null, screen: 'screenshot', scale: null, offsetY: 0, notFound: false }
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

export function newPair(template: PairTemplateId = 'panorama'): Pair {
  return {
    kind: 'pair',
    id: uuid(),
    template,
    screenshot: null,
    headline: '',
    subheadline: '',
    headlineRight: '',
    subheadlineRight: '',
    textNudgeRight: { offsetY: 0 },
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
    schemaVersion: 2,
    theme: defaultTheme(),
    items: [newSlide('textTop')],
  }
}

// Resolved style for one text slot on an item. Left slots layer the item's
// override over the set theme; right slots (pairs) layer theirs over the
// resolved left style, so an un-customised right side follows the left.
export function resolveTextStyle(theme: Theme, overrides: Overrides, key: TextStyleKey): TextStyle {
  if (key === 'headlineRight') return { ...resolveTextStyle(theme, overrides, 'headline'), ...overrides.headlineRight }
  if (key === 'subheadlineRight') return { ...resolveTextStyle(theme, overrides, 'subheadline'), ...overrides.subheadlineRight }
  return { ...theme[key], ...overrides[key] }
}

export function resolveTheme(theme: Theme, overrides: Slide['overrides']): Theme {
  return {
    background: overrides.background ?? theme.background,
    headline: { ...theme.headline, ...overrides.headline },
    subheadline: { ...theme.subheadline, ...overrides.subheadline },
    bezel: theme.bezel,
  }
}
