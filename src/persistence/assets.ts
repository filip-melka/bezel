import { uuid } from '../model/defaults'
import type { Project, ScreenshotRef } from '../model/types'
import { deleteAsset, readAsset, writeAsset } from './db'

export const MAX_FILE_BYTES = 40 * 1024 * 1024
// Longest-edge bound for stored screenshots. Equal to the native 6.9" height so
// a native screenshot is stored untouched and is never upscaled at scale 1.
export const MAX_EDGE = 2868
const ACCEPTED = new Set(['image/png', 'image/jpeg', 'image/webp'])
const ACCEPTED_EXT = /\.(png|jpe?g|webp)$/i

export type ImportErrorCode = 'type' | 'size' | 'decode' | 'quota'

export class ImportError extends Error {
  constructor(
    public readonly code: ImportErrorCode,
    message: string,
  ) {
    super(message)
  }
}

export const IMPORT_MESSAGES: Record<ImportErrorCode, string> = {
  type: "Bezel can't read this format. Export as PNG from Photos or Simulator.",
  decode: "Bezel can't read this format. Export as PNG from Photos or Simulator.",
  size: 'That file is larger than 40 MB. Export a smaller PNG and try again.',
  quota: 'Browser storage is full. Delete other projects to make room.',
}

// Decoded screenshots for the open project, keyed by assetId. Module-level so
// the renderer can look them up synchronously (SPEC §10.2).
const cache = new Map<string, ImageBitmap>()

export function lookupAsset(assetId: string): ImageBitmap | undefined {
  return cache.get(assetId)
}

export function hasAsset(assetId: string): boolean {
  return cache.has(assetId)
}

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED.has(file.type) || (file.type === '' && ACCEPTED_EXT.test(file.name))
}

async function decodeAndBound(file: File): Promise<{ bitmap: ImageBitmap; blob: Blob; ow: number; oh: number }> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ImportError('decode', IMPORT_MESSAGES.decode)
  }
  const ow = bitmap.width
  const oh = bitmap.height
  const longest = Math.max(ow, oh)
  if (longest <= MAX_EDGE) return { bitmap, blob: file, ow, oh }

  // Downscale with high-quality smoothing and re-encode as PNG (SPEC §10.3).
  const k = MAX_EDGE / longest
  const w = Math.round(ow * k)
  const h = Math.round(oh * k)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new ImportError('decode', IMPORT_MESSAGES.decode)
  const scaled = await createImageBitmap(blob)
  return { bitmap: scaled, blob, ow, oh }
}

export async function importScreenshot(file: File, projectId: string): Promise<ScreenshotRef> {
  if (!isAcceptedImage(file)) throw new ImportError('type', IMPORT_MESSAGES.type)
  if (file.size > MAX_FILE_BYTES) throw new ImportError('size', IMPORT_MESSAGES.size)
  const { bitmap, blob, ow, oh } = await decodeAndBound(file)
  const assetId = uuid()
  try {
    await writeAsset(assetId, { blob, projectId, width: bitmap.width, height: bitmap.height })
  } catch (e) {
    bitmap.close()
    const name = e instanceof Error ? e.name : ''
    if (name === 'QuotaExceededError' || /quota/i.test(String(e))) {
      throw new ImportError('quota', IMPORT_MESSAGES.quota)
    }
    throw e
  }
  cache.set(assetId, bitmap)
  return {
    assetId,
    width: bitmap.width,
    height: bitmap.height,
    originalWidth: ow,
    originalHeight: oh,
    fileName: file.name,
  }
}

// Loads every screenshot referenced by the project into the cache. Returns the
// ids that could not be found (e.g. cleared by the browser).
export async function loadProjectAssets(project: Project): Promise<string[]> {
  const missing: string[] = []
  const ids = new Set<string>()
  for (const it of project.items) if (it.screenshot) ids.add(it.screenshot.assetId)
  await Promise.all(
    [...ids].map(async (id) => {
      if (cache.has(id)) return
      const rec = await readAsset(id)
      if (!rec) {
        missing.push(id)
        return
      }
      try {
        cache.set(id, await createImageBitmap(rec.blob))
      } catch {
        missing.push(id)
      }
    }),
  )
  return missing
}

export function releaseAllAssets(): void {
  for (const bmp of cache.values()) bmp.close()
  cache.clear()
}

export async function discardAsset(assetId: string): Promise<void> {
  cache.get(assetId)?.close()
  cache.delete(assetId)
  await deleteAsset(assetId)
}
