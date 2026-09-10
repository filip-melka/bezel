import { clampNum } from '../templates/common'
import { templateFor } from '../templates/registry'
import { SLOT_CAP, type SlideItem } from './types'

export function slotCost(item: SlideItem): 1 | 2 {
  return item.kind === 'pair' ? 2 : 1
}

export function slotsUsed(items: SlideItem[]): number {
  return items.reduce((n, it) => n + slotCost(it), 0)
}

export function slotsFree(items: SlideItem[]): number {
  return Math.max(0, SLOT_CAP - slotsUsed(items))
}

export function canAdd(items: SlideItem[], cost: 1 | 2): boolean {
  return slotsUsed(items) + cost <= SLOT_CAP
}

export type ExportRange = { start: number; end: number }

// Export numbers per item, 1-based, in filmstrip order. A pair spans two.
export function exportNumbers(items: SlideItem[]): Map<string, ExportRange> {
  const out = new Map<string, ExportRange>()
  let n = 1
  for (const it of items) {
    const cost = slotCost(it)
    out.set(it.id, { start: n, end: n + cost - 1 })
    n += cost
  }
  return out
}

export function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

export function rangeLabel(r: ExportRange): string {
  return r.start === r.end ? pad2(r.start) : `${pad2(r.start)}–${pad2(r.end)}`
}

// Clamps device and text nudges to the item's template limits. Returns the
// same object when nothing changed so callers can skip a store update.
export function clampItemToTemplate<T extends SlideItem>(item: T): T {
  const { limits } = templateFor(item)
  const scale = clampNum(item.device.scale, limits.scale)
  const offsetY = clampNum(item.device.offsetY, limits.deviceOffsetY)
  const textOffsetY = clampNum(item.textNudge.offsetY, limits.textOffsetY)
  if (scale === item.device.scale && offsetY === item.device.offsetY && textOffsetY === item.textNudge.offsetY) {
    return item
  }
  return { ...item, device: { scale, offsetY }, textNudge: { offsetY: textOffsetY } }
}
