import type { Project } from './types'

export class MigrationError extends Error {
  constructor(
    public readonly code: 'newer' | 'invalid',
    message: string,
  ) {
    super(message)
  }
}

export const CURRENT_SCHEMA_VERSION = 2

type Raw = Record<string, unknown>
type Migration = (raw: Raw) => Raw

// v1 → v2: pairs gain a text slot on each slide. "Text left" and "Text right"
// merge into one Panorama template; text that sat on the right slide (Text
// right, Tilted right) moves into the new right-hand fields so every existing
// pair renders exactly as before.
function migratePairV1toV2(it: unknown): unknown {
  if (typeof it !== 'object' || it === null) return it
  const item = it as Raw
  if (item.kind !== 'pair') return item
  const template = item.template === 'panoTilted' || item.template === 'panoTiltedRight' ? item.template : 'panorama'
  const textOnRight = item.template === 'panoRightText' || item.template === 'panoTiltedRight'
  const headline = typeof item.headline === 'string' ? item.headline : ''
  const subheadline = typeof item.subheadline === 'string' ? item.subheadline : ''
  return textOnRight
    ? { ...item, template, headline: '', subheadline: '', headlineRight: headline, subheadlineRight: subheadline }
    : { ...item, template, headline, subheadline, headlineRight: '', subheadlineRight: '' }
}

// Chain of migrate_N_to_N+1 steps, indexed by the version they migrate FROM.
const MIGRATIONS: Record<number, Migration> = {
  1: (raw) => ({
    ...raw,
    schemaVersion: 2,
    items: Array.isArray(raw.items) ? raw.items.map(migratePairV1toV2) : raw.items,
  }),
}

export function migrateProject(input: unknown): Project {
  if (typeof input !== 'object' || input === null) {
    throw new MigrationError('invalid', 'Project data is not an object')
  }
  let raw = input as Raw
  let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new MigrationError('newer', 'This project was made with a newer version of Bezel.')
  }
  if (version === 0) {
    // Unversioned data is treated as v1 if it has the v1 shape.
    version = 1
    raw = { ...raw, schemaVersion: 1 }
  }
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[version]
    if (!step) throw new MigrationError('invalid', `No migration from schema ${version}`)
    raw = step(raw)
    version += 1
  }
  validate(raw)
  return normalize(raw) as unknown as Project
}

// Like migrateProject, but returns null instead of throwing, for listings
// that should skip unreadable records rather than fail.
export function tryMigrateProject(input: unknown): Project | null {
  try {
    return migrateProject(input)
  } catch {
    return null
  }
}

// Fills fields added within the current schema version so older records of the
// same version load cleanly. A pair saved before its sides had separate text
// positions gets a right offset equal to the shared one, so nothing moves.
function normalize(raw: Raw): Raw {
  if (!Array.isArray(raw.items)) return raw
  let changed = false
  const items = raw.items.map((it: unknown) => {
    if (typeof it !== 'object' || it === null) return it
    const item = it as Raw
    if (item.kind !== 'pair' || (typeof item.textNudgeRight === 'object' && item.textNudgeRight !== null)) return item
    changed = true
    const left = item.textNudge as { offsetY?: unknown } | undefined
    const offsetY = typeof left?.offsetY === 'number' ? left.offsetY : 0
    return { ...item, textNudgeRight: { offsetY } }
  })
  return changed ? { ...raw, items } : raw
}

function validate(raw: Raw): void {
  const ok =
    typeof raw.id === 'string' &&
    typeof raw.name === 'string' &&
    typeof raw.theme === 'object' &&
    raw.theme !== null &&
    Array.isArray(raw.items)
  if (!ok) throw new MigrationError('invalid', 'Project data is missing required fields')
}
