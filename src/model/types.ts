// Data model. Mirrors SPEC.md §5 exactly. Everything here is JSON-serializable.

export type ProjectMeta = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  schemaVersion: 1
}

export type Project = ProjectMeta & {
  theme: Theme
  items: SlideItem[]
}

export type Theme = {
  background: Background
  headline: TextStyle
  subheadline: TextStyle
  bezel: { finish: BezelFinish; shadow: boolean }
}

export type Background =
  | { kind: 'solid'; color: string }
  | { kind: 'linear'; angle: number; stops: GradientStop[] }
  | { kind: 'radial'; stops: GradientStop[] }

export type GradientStop = { offset: number; color: string }

export type TextWeight = 400 | 500 | 600 | 700
export type TextAlign = 'left' | 'center' | 'right'

export type TextStyle = {
  size: number
  weight: TextWeight
  color: string
  align: TextAlign
}

export type BezelFinish = 'black' | 'white' | 'blue' | 'orange'

export type SlideTemplateId = 'textTop' | 'deviceOnly' | 'tilted'
export type PairTemplateId = 'panoLeftText' | 'panoRightText'
export type TemplateId = SlideTemplateId | PairTemplateId

export type Overrides = Partial<Pick<Theme, 'background' | 'headline' | 'subheadline'>>

type ItemBase = {
  id: string
  screenshot: ScreenshotRef | null
  headline: string
  subheadline: string
  device: { scale: number; offsetY: number }
  textNudge: { offsetY: number }
  overrides: Overrides
}

export type Slide = ItemBase & { kind: 'slide'; template: SlideTemplateId }
export type Pair = ItemBase & { kind: 'pair'; template: PairTemplateId }
export type SlideItem = Slide | Pair

export type ScreenshotRef = {
  assetId: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  fileName: string
}

export const CANVAS_W = 1320
export const CANVAS_H = 2868
export const SLOT_CAP = 10
export const HEADLINE_MAX_CHARS = 200
export const SUBHEADLINE_MAX_CHARS = 300
