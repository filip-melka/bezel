import type { PairTemplateId, SlideItem, SlideTemplateId, TemplateId } from '../model/types'
import { deviceOnly } from './deviceOnly'
import { panorama } from './panorama'
import { panoTilted } from './panoTilted'
import { textBottom } from './textBottom'
import { textTop } from './textTop'
import { tilted } from './tilted'
import type { LayoutInput, LayoutOutput, TemplateDef } from './types'
import { widgetKindOf, widgetOverlay } from './widget'

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  textTop,
  textBottom,
  deviceOnly,
  tilted,
  panorama,
  panoTilted,
}

// Labels for the segmented control in the inspector, where the full names
// would truncate.
export const SHORT_NAMES: Record<TemplateId, string> = {
  textTop: 'Top',
  textBottom: 'Bottom',
  deviceOnly: 'Device',
  tilted: 'Tilted',
  panorama: 'Straight',
  panoTilted: 'Tilted',
}

export const SLIDE_TEMPLATE_IDS: SlideTemplateId[] = ['textTop', 'textBottom', 'deviceOnly', 'tilted']
export const PAIR_TEMPLATE_IDS: PairTemplateId[] = ['panorama', 'panoTilted']
export const ALL_TEMPLATE_IDS: TemplateId[] = [...SLIDE_TEMPLATE_IDS, ...PAIR_TEMPLATE_IDS]

export const DEFAULT_SLIDE_TEMPLATE: SlideTemplateId = 'textTop'
export const DEFAULT_PAIR_TEMPLATE: PairTemplateId = 'panorama'

export function isTemplateId(v: unknown): v is TemplateId {
  return typeof v === 'string' && v in TEMPLATES
}

export function getTemplate(id: TemplateId): TemplateDef {
  return TEMPLATES[id]
}

export function templateFor(item: SlideItem): TemplateDef {
  return TEMPLATES[item.template]
}

export function canvasSizeFor(item: SlideItem): { w: number; h: number } {
  return { w: item.kind === 'pair' ? 2640 : 1320, h: 2868 }
}

// The one layout entry point: the template's own geometry, then the Live
// Activity overlay, which any template can carry. Templates never have to know
// about the widget beyond leaving room for it.
export function layoutItem(input: LayoutInput): LayoutOutput {
  const out = templateFor(input.item).layout(input)
  if (!out.device || !widgetKindOf(input.item)) return out
  return { ...out, ...widgetOverlay(input, out.device) }
}
