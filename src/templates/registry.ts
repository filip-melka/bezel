import type { PairTemplateId, SlideItem, SlideTemplateId, TemplateId } from '../model/types'
import { deviceOnly } from './deviceOnly'
import { island } from './island'
import { lockActivity } from './lockActivity'
import { panorama } from './panorama'
import { panoTilted, panoTiltedRight } from './panoTilted'
import { textBottom } from './textBottom'
import { textTop } from './textTop'
import { tilted } from './tilted'
import type { TemplateDef } from './types'

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  textTop,
  textBottom,
  deviceOnly,
  tilted,
  lockActivity,
  island,
  panorama,
  panoTilted,
  panoTiltedRight,
}

// Labels for the four-way segmented control in the inspector, where the full
// names would truncate.
export const SHORT_NAMES: Record<TemplateId, string> = {
  textTop: 'Top',
  textBottom: 'Bottom',
  deviceOnly: 'Device',
  tilted: 'Tilted',
  lockActivity: 'Lock',
  island: 'Island',
  panorama: 'Straight',
  panoTilted: 'Tilt left',
  panoTiltedRight: 'Tilt right',
}

export const SLIDE_TEMPLATE_IDS: SlideTemplateId[] = ['textTop', 'textBottom', 'deviceOnly', 'tilted', 'lockActivity', 'island']
export const PAIR_TEMPLATE_IDS: PairTemplateId[] = ['panorama', 'panoTilted', 'panoTiltedRight']
export const ALL_TEMPLATE_IDS: TemplateId[] = [...SLIDE_TEMPLATE_IDS, ...PAIR_TEMPLATE_IDS]

export function getTemplate(id: TemplateId): TemplateDef {
  return TEMPLATES[id]
}

export function templateFor(item: SlideItem): TemplateDef {
  return TEMPLATES[item.template]
}

export function canvasSizeFor(item: SlideItem): { w: number; h: number } {
  return { w: item.kind === 'pair' ? 2640 : 1320, h: 2868 }
}
