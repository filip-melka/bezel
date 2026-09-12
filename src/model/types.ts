// Data model. Mirrors SPEC.md §5 exactly. Everything here is JSON-serializable.

export type ProjectMeta = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  schemaVersion: 4
}

export type Project = ProjectMeta & {
  theme: Theme
  items: SlideItem[]
}

export type Theme = {
  background: Background
  // Set-level, like the bezel finish: one font per screenshot set. Not part of
  // TextStyle, so a slide with a style override still follows the set's font.
  font: FontId
  headline: TextStyle
  subheadline: TextStyle
  bezel: { finish: BezelFinish; shadow: boolean }
}

// The bundled families (src/assets/fonts). Slide text is drawn in one of these
// rather than a system font, so a project exports identically on every machine.
export type FontId = 'inter' | 'jakarta' | 'sourceSerif'

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

export type SlideTemplateId = 'textTop' | 'textBottom' | 'deviceOnly' | 'tilted'
export type PairTemplateId = 'panorama' | 'panoTilted'
export type TemplateId = SlideTemplateId | PairTemplateId

// Which way a tilted template leans. Absent on items saved before the direction
// was an option, which read as 'left' — the only direction those templates had.
export type TiltDirection = 'left' | 'right'

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
  // Live Activity cut-out. Available on every template; absent means none.
  widget?: WidgetState
  // Lean of the tilted templates; ignored by the others. Absent = 'left'.
  tilt?: TiltDirection
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

// The Live Activity option on an item: none, or one of the two kinds. Any
// template can carry any mode.
export type WidgetMode = 'none' | WidgetKind

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
  // Which Live Activity to lift off the screen, if any. Absent = 'none', so
  // projects saved before this read as having no widget.
  mode?: WidgetMode
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
