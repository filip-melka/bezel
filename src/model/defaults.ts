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

export type GradientPreset = { name: string; background: Background }

const g = (name: string, angle: number, ...colors: string[]): GradientPreset => ({
  name,
  background: {
    kind: 'linear',
    angle,
    stops: colors.map<GradientStop>((color, i) => ({ offset: i / (colors.length - 1), color })),
  },
})

export const PRESET_GRADIENTS: GradientPreset[] = [
  g('Sunset', 20, '#ff6a3d', '#c02a7a'),
  g('Ocean', 0, '#0b3d91', '#1fa2ff'),
  g('Midnight', 0, '#0f0c29', '#302b63'),
  g('Mint', 30, '#0ba360', '#3cba92'),
  g('Peach', 45, '#ffb88c', '#ff6f61'),
  g('Lavender', 0, '#8e7cff', '#c8a2ff'),
  g('Graphite', 0, '#2c2c2e', '#48484a'),
  g('Cherry', 160, '#ec3013', '#8a1207'),
  g('Sky', 180, '#dceeff', '#8fc5ff'),
  g('Lime', 0, '#a8ff78', '#78ffd6'),
  g('Ember', 30, '#f7971e', '#ffd200'),
  g('Slate', 0, '#3a4a5c', '#1e2a38'),
]

export const DEFAULT_HEADLINE: TextStyle = { size: 96, weight: 700, color: '#ffffff', align: 'center' }
export const DEFAULT_SUBHEADLINE: TextStyle = { size: 56, weight: 500, color: '#e6e6eb', align: 'center' }

export function defaultTheme(): Theme {
  return {
    background: structuredClone(PRESET_GRADIENTS[1]!.background),
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
