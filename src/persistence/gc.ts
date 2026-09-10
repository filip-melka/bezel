import { deleteAsset, listAssetOwners, listProjectIds } from './db'

// Deletes assets whose project no longer exists (SPEC §10.2). Runs once at startup.
export async function sweepOrphanAssets(): Promise<number> {
  try {
    const live = new Set(await listProjectIds())
    const owners = await listAssetOwners()
    let removed = 0
    for (const { id, projectId } of owners) {
      if (!live.has(projectId)) {
        await deleteAsset(id)
        removed += 1
      }
    }
    return removed
  } catch (e) {
    console.warn('asset sweep failed', e)
    return 0
  }
}
