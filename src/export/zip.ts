import { zipSync } from 'fflate'

export type ZipEntry = { name: string; blob: Blob }

// PNGs are already deflated, so entries are stored uncompressed.
export async function buildZip(entries: ZipEntry[]): Promise<Blob> {
  const files: Record<string, [Uint8Array, { level: 0 }]> = {}
  for (const e of entries) {
    files[e.name] = [new Uint8Array(await e.blob.arrayBuffer()), { level: 0 }]
  }
  const bytes = zipSync(files)
  return new Blob([bytes], { type: 'application/zip' })
}
