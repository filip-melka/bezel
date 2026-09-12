import type { SlideItem, TemplateId, TextStyle, Theme, WidgetCrop } from '../model/types'
import type { FitResult } from '../render/text'

export type TextMeasurer = (text: string, style: TextStyle, maxWidth: number, maxLines: number) => FitResult

export type LayoutInput = {
  canvasW: number
  canvasH: number
  item: SlideItem
  resolvedTheme: Theme
  screenshotSize: { w: number; h: number } | null
  measureText: TextMeasurer
}

export type DeviceBox = {
  x: number
  y: number
  w: number
  h: number
  rotation: number // degrees, about the box centre
}

export type TextBlock = {
  x: number
  y: number
  w: number
  lines: string[]
  style: TextStyle
  lineHeight: number
  shrunk: boolean
}

export type WidgetLayout = {
  box: { x: number; y: number; w: number; h: number }
  radius: number
  // Degrees about the box centre, matching the device the widget sits on.
  rotation: number
  crop: WidgetCrop
  // Dashed outline where the widget sits in the screenshot, if the template shows one.
  ghost: { x: number; y: number; w: number; h: number; radius: number } | null
}

export type LayoutOutput = {
  device: DeviceBox | null
  headline: TextBlock | null
  subheadline: TextBlock | null
  // Right-slide text on pair templates; headline / subheadline are the left slide.
  headlineRight?: TextBlock | null
  subheadlineRight?: TextBlock | null
  // Widget cut-out drawn above the device, or null.
  widget?: WidgetLayout | null
  // 0..1 black overlay on the screen area so a lifted widget stands out.
  screenDim?: number
  // Draw a stand-in lock / home screen instead of the screenshot.
  screenPlaceholder?: 'lock' | 'home' | null
  // Base colour for the placeholder; null = its designed default.
  screenPlaceholderColor?: string | null
}

export type TemplateLimits = {
  scale: [number, number]
  deviceOffsetY: [number, number]
  textOffsetY: [number, number]
}

export type TemplateDef = {
  id: TemplateId
  name: string
  description: string
  slots: 1 | 2
  hasText: boolean
  // True on the templates that read `item.tilt`, so the inspector offers a
  // direction control.
  hasTilt: boolean
  limits: TemplateLimits
  layout: (input: LayoutInput) => LayoutOutput
}
