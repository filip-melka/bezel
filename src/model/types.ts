// Data model. Mirrors SPEC.md §5 exactly. Everything here is JSON-serializable.

export type ProjectMeta = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  schemaVersion: 2
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

export type SlideTemplateId = 'textTop' | 'textBottom' | 'deviceOnly' | 'tilted' | 'lockActivity' | 'island'
export type PairTemplateId = 'panorama' | 'panoTilted' | 'panoTiltedRight'
export type TemplateId = SlideTemplateId | PairTemplateId

// Text style keys an item can override. The `...Right` keys exist on pairs only:
// absent means the right slide uses the same style as the left.
export type TextStyleKey = 'headline' | 'subheadline' | 'headlineRight' | 'subheadlineRight'

export type Overrides = Partial<Pick<Theme, 'background' | 'headline' | 'subheadline'>> & {
  headlineRight?: TextStyle
  subheadlineRight?: TextStyle
}

type ItemBase = {
  id: string
  screenshot: ScreenshotRef | null
  // Live Activity cut-out, used by widget templates. Optional for v1 projects.
  widget?: WidgetState
  headline: string
  subheadline: string
  device: { scale: number; offsetY: number }
  textNudge: { offsetY: number }
  overrides: Overrides
}

export type Slide = ItemBase & { kind: 'slide'; template: SlideTemplateId }
// A pair has a text slot on each slide. `headline` / `subheadline` from ItemBase
// are the left slide; either side may be left empty.
export type Pair = ItemBase & {
  kind: 'pair'
  template: PairTemplateId
  headlineRight: string
  subheadlineRight: string
  // Vertical offset of the right slide's text; `textNudge` is the left slide's.
  textNudgeRight: { offsetY: number }
}
export type SlideItem = Slide | Pair

export type WidgetKind = 'lockActivity' | 'island'

// Crop of the widget inside the stored screenshot, in stored-pixel coordinates.
export type WidgetCrop = {
  kind: WidgetKind
  x: number
  y: number
  w: number
  h: number
  radius: number
}

export type WidgetScreen = 'screenshot' | 'placeholder'

export type WidgetState = {
  crop: WidgetCrop | null
  // What the device shows behind the cut-out: the screenshot itself, or a drawn
  // placeholder lock / home screen. Optional for projects saved before this.
  screen?: WidgetScreen
  // Base colour of the placeholder wallpaper; null or absent = the designed default.
  placeholderColor?: string | null
  // null = the template's default scale
  scale: number | null
  offsetY: number
  // true when detection ran and found nothing, so the UI can say so
  notFound: boolean
}

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
