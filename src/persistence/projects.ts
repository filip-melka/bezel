import { newProject, uuid } from '../model/defaults'
import type { Project } from '../model/types'
import { deleteProjectRecord, listProjects, readAsset, writeAsset, writeProject } from './db'

export async function createProject(name?: string): Promise<Project> {
  const existing = await listProjects()
  const n = existing.length + 1
  const project = newProject(name ?? `Untitled ${n}`)
  await writeProject(project)
  return project
}

// Deep copy with fresh ids. Assets are copied under new ids so each project
// owns its own records and the orphan sweep stays correct.
export async function duplicateProject(src: Project): Promise<Project> {
  const copy: Project = structuredClone(src)
  copy.id = uuid()
  copy.name = `${src.name} copy`
  copy.createdAt = Date.now()
  copy.updatedAt = Date.now()
  const mapping = new Map<string, string>()
  for (const item of copy.items) {
    item.id = uuid()
    if (!item.screenshot) continue
    const oldId = item.screenshot.assetId
    let newId = mapping.get(oldId)
    if (!newId) {
      newId = uuid()
      const rec = await readAsset(oldId)
      if (rec) await writeAsset(newId, { ...rec, projectId: copy.id })
      mapping.set(oldId, newId)
    }
    item.screenshot = { ...item.screenshot, assetId: newId }
  }
  await writeProject(copy)
  return copy
}

export async function renameProjectRecord(p: Project, name: string): Promise<Project> {
  const next = { ...p, name, updatedAt: Date.now() }
  await writeProject(next)
  return next
}

export async function deleteProject(id: string): Promise<void> {
  await deleteProjectRecord(id)
}
