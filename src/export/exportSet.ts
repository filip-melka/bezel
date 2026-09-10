import { exportNumbers, pad2 } from '../model/clamp'
import type { Project, SlideItem } from '../model/types'
import type { AssetLookup } from '../render/renderItem'
import { downloadBlob, slug } from './download'
import { renderItemToPngs } from './png'
import { buildZip, type ZipEntry } from './zip'

export type ProgressFn = (done: number, total: number) => void

const yieldToPaint = () => new Promise<void>((r) => setTimeout(r, 0))

// Export numbers of items that have no screenshot, for the confirm sheet.
export function numbersMissingScreenshots(project: Project): string[] {
  const numbers = exportNumbers(project.items)
  const out: string[] = []
  for (const it of project.items) {
    if (it.screenshot) continue
    const r = numbers.get(it.id)!
    for (let n = r.start; n <= r.end; n++) out.push(pad2(n))
  }
  return out
}

export function fileNamesFor(project: Project, item: SlideItem): string[] {
  const r = exportNumbers(project.items).get(item.id)
  if (!r) return []
  const names: string[] = []
  for (let n = r.start; n <= r.end; n++) names.push(`${pad2(n)}.png`)
  return names
}

export async function exportItem(project: Project, item: SlideItem, assets: AssetLookup): Promise<void> {
  const names = fileNamesFor(project, item)
  const blobs = await renderItemToPngs(item, project.theme, assets)
  blobs.forEach((blob, i) => downloadBlob(blob, names[i] ?? `${i + 1}.png`))
}

export async function exportSet(project: Project, assets: AssetLookup, onProgress: ProgressFn): Promise<void> {
  const total = project.items.length
  const entries: ZipEntry[] = []
  onProgress(0, total)
  for (let i = 0; i < total; i++) {
    const item = project.items[i]!
    const names = fileNamesFor(project, item)
    const blobs = await renderItemToPngs(item, project.theme, assets)
    blobs.forEach((blob, j) => entries.push({ name: names[j] ?? `${j + 1}.png`, blob }))
    onProgress(i + 1, total)
    await yieldToPaint()
  }
  const zip = await buildZip(entries)
  downloadBlob(zip, `${slug(project.name)}-iphone-6.9.zip`)
}
