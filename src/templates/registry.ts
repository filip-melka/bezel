import type { PairTemplateId, SlideItem, SlideTemplateId, TemplateId } from '../model/types'
import { deviceOnly } from './deviceOnly'
import { panoLeftText } from './panoLeftText'
import { panoRightText } from './panoRightText'
import { textTop } from './textTop'
import { tilted } from './tilted'
import type { TemplateDef } from './types'

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  textTop,
  deviceOnly,
  tilted,
  panoLeftText,
  panoRightText,
}

export const SLIDE_TEMPLATE_IDS: SlideTemplateId[] = ['textTop', 'deviceOnly', 'tilted']
export const PAIR_TEMPLATE_IDS: PairTemplateId[] = ['panoLeftText', 'panoRightText']
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
