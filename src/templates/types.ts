import type { SlideItem, TemplateId, TextStyle, Theme } from '../model/types'
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

export type LayoutOutput = {
  device: DeviceBox | null
  headline: TextBlock | null
  subheadline: TextBlock | null
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
  limits: TemplateLimits
  layout: (input: LayoutInput) => LayoutOutput
}
