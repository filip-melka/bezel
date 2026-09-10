import { deleteAsset, listAssetOwners, listProjects } from './db'

// Deletes assets whose project no longer exists (SPEC §10.2). Runs once at startup.
export async function sweepOrphanAssets(): Promise<number> {
  try {
    const projects = await listProjects()
    const live = new Set(projects.map((p) => p.id))
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
