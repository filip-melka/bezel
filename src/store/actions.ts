import { canAdd, clampItemToTemplate, exportNumbers, rangeLabel, slotCost } from '../model/clamp'
import { defaultWidget, newPair, newSlide, resolveTextStyle, uuid } from '../model/defaults'
import type {
  Background,
  Overrides,
  PairTemplateId,
  Project,
  ScreenshotRef,
  SlideItem,
  SlideTemplateId,
  TemplateId,
  TextStyle,
  TextStyleKey,
  Theme,
  TiltDirection,
  WidgetState,
} from '../model/types'
import { getTemplate } from '../templates/registry'
import { resetBatches } from './history'
import { clearHistory, getProject, useProjectStore } from './projectStore'
import { toast, useUiStore } from './uiStore'

export function loadProject(project: Project | null): void {
  resetBatches()
  useProjectStore.setState({ project })
  clearHistory()
  useUiStore.getState().select(project?.items[0]?.id ?? null)
  useUiStore.getState().setTab('slide')
}

export function updateProject(fn: (p: Project) => Project): void {
  const current = getProject()
  if (!current) return
  const next = fn(current)
  if (next === current) return
  useProjectStore.setState({ project: { ...next, updatedAt: Date.now() } })
}

export function renameProject(name: string): void {
  updateProject((p) => ({ ...p, name }))
}

function updateItems(fn: (items: SlideItem[]) => SlideItem[]): void {
  updateProject((p) => {
    const items = fn(p.items)
    return items === p.items ? p : { ...p, items }
  })
}

export function updateItem(id: string, fn: (item: SlideItem) => SlideItem): void {
  updateItems((items) => {
    const idx = items.findIndex((it) => it.id === id)
    const item = items[idx]
    if (!item) return items
    const next = fn(item)
    if (next === item) return items
    const copy = items.slice()
    copy[idx] = next
    return copy
  })
}

// Adds a new item after the selected one (or at the end) and selects it.
export function addItem(template: TemplateId): boolean {
  const project = getProject()
  if (!project) return false
  const def = getTemplate(template)
  if (!canAdd(project.items, def.slots)) return false
  const item: SlideItem =
    def.slots === 2 ? newPair(template as PairTemplateId) : newSlide(template as SlideTemplateId)
  const selectedId = useUiStore.getState().selectedId
  updateItems((items) => {
    const idx = items.findIndex((it) => it.id === selectedId)
    const at = idx < 0 ? items.length : idx + 1
    return [...items.slice(0, at), item, ...items.slice(at)]
  })
  useUiStore.getState().select(item.id)
  return true
}

// Appends one textTop slide per screenshot ref; returns how many were added.
export function appendSlidesWithScreenshots(refs: ScreenshotRef[]): number {
  const project = getProject()
  if (!project) return 0
  let items = project.items
  let added = 0
  let lastId: string | null = null
  for (const ref of refs) {
    if (!canAdd(items, 1)) break
    const slide = newSlide('textTop')
    slide.screenshot = ref
    items = [...items, slide]
    lastId = slide.id
    added += 1
  }
  if (added > 0) {
    const finalItems = items
    updateItems(() => finalItems)
    useUiStore.getState().select(lastId)
  }
  return added
}

export function duplicateItem(id: string): boolean {
  const project = getProject()
  if (!project) return false
  const idx = project.items.findIndex((it) => it.id === id)
  const item = project.items[idx]
  if (!item || !canAdd(project.items, slotCost(item))) return false
  const copy: SlideItem = structuredClone(item)
  copy.id = uuid()
  updateItems((items) => [...items.slice(0, idx + 1), copy, ...items.slice(idx + 1)])
  useUiStore.getState().select(copy.id)
  return true
}

export function removeItem(id: string): void {
  const project = getProject()
  if (!project) return
  const idx = project.items.findIndex((it) => it.id === id)
  if (idx < 0) return
  const label = rangeLabel(exportNumbers(project.items).get(id)!)
  const wasSelected = useUiStore.getState().selectedId === id
  updateItems((items) => items.filter((it) => it.id !== id))
  if (wasSelected) {
    const remaining = getProject()?.items ?? []
    const next = remaining[Math.min(idx, remaining.length - 1)]
    useUiStore.getState().select(next?.id ?? null)
  }
  toast(`Slide ${label} deleted`, {
    label: 'Undo',
    onClick: () => {
      useProjectStore.temporal.getState().undo()
      useUiStore.getState().select(id)
      useUiStore.getState().dismissToast()
    },
  })
}

export function reorderItems(activeId: string, overId: string): void {
  if (activeId === overId) return
  updateItems((items) => {
    const from = items.findIndex((it) => it.id === activeId)
    const to = items.findIndex((it) => it.id === overId)
    if (from < 0 || to < 0) return items
    const copy = items.slice()
    const [moved] = copy.splice(from, 1)
    copy.splice(to, 0, moved!)
    return copy
  })
}

export function setTemplate(id: string, template: TemplateId): void {
  updateItem(id, (item) => {
    if (item.template === template) return item
    const def = getTemplate(template)
    if (def.slots !== slotCost(item)) return item
    const next = { ...item, template } as SlideItem
    return clampItemToTemplate(next)
  })
}

export type TextKey = 'headline' | 'subheadline' | 'headlineRight' | 'subheadlineRight'

// Right-slide keys exist only on pairs and are ignored for single slides.
export function setItemText(id: string, key: TextKey, value: string): void {
  updateItem(id, (item) => {
    if ((key === 'headlineRight' || key === 'subheadlineRight') && item.kind !== 'pair') return item
    const current = (item as Record<TextKey, string | undefined>)[key] ?? ''
    return current === value ? item : ({ ...item, [key]: value } as SlideItem)
  })
}

export function setDevice(id: string, patch: Partial<SlideItem['device']>): void {
  updateItem(id, (item) => clampItemToTemplate({ ...item, device: { ...item.device, ...patch } }))
}

// The right side applies to pairs only; for a single slide it is ignored.
export function setTextNudge(id: string, offsetY: number, side: 'left' | 'right' = 'left'): void {
  updateItem(id, (item) => {
    if (side === 'left') return clampItemToTemplate({ ...item, textNudge: { offsetY } })
    if (item.kind !== 'pair') return item
    return clampItemToTemplate({ ...item, textNudgeRight: { offsetY } })
  })
}

// Lean of a tilted template. Stored on every item; the other templates ignore it.
export function setTilt(id: string, tilt: TiltDirection): void {
  updateItem(id, (item) => (item.tilt === tilt ? item : { ...item, tilt }))
}

export function resetDevice(id: string): void {
  updateItem(id, (item) => ({ ...item, device: { scale: 1, offsetY: 0 } }))
}

export function setScreenshot(id: string, ref: ScreenshotRef | null): void {
  updateItem(id, (item) => ({ ...item, screenshot: ref }))
}

export function setOverride<K extends keyof Overrides>(id: string, key: K, value: Overrides[K]): void {
  updateItem(id, (item) => ({ ...item, overrides: { ...item.overrides, [key]: value } }))
}

// Merges `patch` into the slot's resolved style and stores the result as a full
// override. For a pair's right slot this snapshots the left style, so from then
// on the right side is independent.
export function patchTextOverride(id: string, key: TextStyleKey, patch: Partial<TextStyle>): void {
  const project = getProject()
  if (!project) return
  updateItem(id, (item) => {
    const base = { ...resolveTextStyle(project.theme, item.overrides, key), ...patch }
    return { ...item, overrides: { ...item.overrides, [key]: base } }
  })
}

export function clearOverride(id: string, key: keyof Overrides): void {
  updateItem(id, (item) => {
    if (!(key in item.overrides)) return item
    const overrides = { ...item.overrides }
    delete overrides[key]
    return { ...item, overrides }
  })
}

export function setTheme(fn: (t: Theme) => Theme): void {
  updateProject((p) => {
    const theme = fn(p.theme)
    return theme === p.theme ? p : { ...p, theme }
  })
}

export function setThemeBackground(background: Background): void {
  setTheme((t) => ({ ...t, background }))
}

export function patchThemeText(key: 'headline' | 'subheadline', patch: Partial<TextStyle>): void {
  setTheme((t) => ({ ...t, [key]: { ...t[key], ...patch } }))
}

export function setBezel(patch: Partial<Theme['bezel']>): void {
  setTheme((t) => ({ ...t, bezel: { ...t.bezel, ...patch } }))
}

// Live Activity cut-out state. Missing on projects saved before the option
// existed, so patches merge over the default.
export function setWidget(id: string, patch: Partial<WidgetState>): void {
  updateItem(id, (item) => ({ ...item, widget: { ...defaultWidget(), ...item.widget, ...patch } }))
}
