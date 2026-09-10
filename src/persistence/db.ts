import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { tryMigrateProject } from '../model/migrate'
import type { Project } from '../model/types'

export type AssetRecord = { blob: Blob; projectId: string; width: number; height: number }

interface BezelDB extends DBSchema {
  projects: { key: string; value: Project }
  assets: { key: string; value: AssetRecord; indexes: { 'by-project': string } }
}

// In-memory fallback for browsers where IndexedDB is unavailable (SPEC §11).
const memory = {
  projects: new Map<string, Project>(),
  assets: new Map<string, AssetRecord>(),
}

let dbPromise: Promise<IDBPDatabase<BezelDB> | null> | undefined
let memoryOnly = false

export function isMemoryOnly(): boolean {
  return memoryOnly
}

export function getDb(): Promise<IDBPDatabase<BezelDB> | null> {
  if (dbPromise) return dbPromise
  dbPromise = (async () => {
    try {
      if (typeof indexedDB === 'undefined') throw new Error('no indexedDB')
      const db = await openDB<BezelDB>('bezel', 1, {
        upgrade(db) {
          db.createObjectStore('projects', { keyPath: 'id' })
          const assets = db.createObjectStore('assets')
          assets.createIndex('by-project', 'projectId')
        },
      })
      // Probe: some private modes open but fail on first transaction.
      await db.count('projects')
      return db
    } catch {
      memoryOnly = true
      return null
    }
  })()
  return dbPromise
}

export async function listProjects(): Promise<Project[]> {
  const db = await getDb()
  const raw = db ? await db.getAll('projects') : [...memory.projects.values()]
  // Listings show projects in the current schema; unreadable or newer ones are skipped.
  const all = raw.map(tryMigrateProject).filter((p): p is Project => p !== null)
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

// Every stored project id, without migrating or validating. Used by the orphan
// sweep so a project this build cannot read never has its assets deleted.
export async function listProjectIds(): Promise<string[]> {
  const db = await getDb()
  if (!db) return [...memory.projects.keys()]
  return (await db.getAllKeys('projects')).map(String)
}

export async function readProject(id: string): Promise<Project | undefined> {
  const db = await getDb()
  return db ? db.get('projects', id) : memory.projects.get(id)
}

export async function writeProject(project: Project): Promise<void> {
  const db = await getDb()
  if (db) await db.put('projects', project)
  else memory.projects.set(project.id, project)
}

export async function deleteProjectRecord(id: string): Promise<void> {
  const db = await getDb()
  if (!db) {
    memory.projects.delete(id)
    for (const [k, v] of memory.assets) if (v.projectId === id) memory.assets.delete(k)
    return
  }
  const tx = db.transaction(['projects', 'assets'], 'readwrite')
  await tx.objectStore('projects').delete(id)
  const keys = await tx.objectStore('assets').index('by-project').getAllKeys(id)
  for (const k of keys) await tx.objectStore('assets').delete(k)
  await tx.done
}

export async function readAsset(id: string): Promise<AssetRecord | undefined> {
  const db = await getDb()
  return db ? db.get('assets', id) : memory.assets.get(id)
}

export async function writeAsset(id: string, rec: AssetRecord): Promise<void> {
  const db = await getDb()
  if (db) await db.put('assets', rec, id)
  else memory.assets.set(id, rec)
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await getDb()
  if (db) await db.delete('assets', id)
  else memory.assets.delete(id)
}

export async function listAssetOwners(): Promise<Array<{ id: string; projectId: string }>> {
  const db = await getDb()
  if (!db) return [...memory.assets].map(([id, v]) => ({ id, projectId: v.projectId }))
  const out: Array<{ id: string; projectId: string }> = []
  let cursor = await db.transaction('assets').store.openCursor()
  while (cursor) {
    out.push({ id: String(cursor.key), projectId: cursor.value.projectId })
    cursor = await cursor.continue()
  }
  return out
}
