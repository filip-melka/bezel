import type { Project } from './types'

export class MigrationError extends Error {
  constructor(
    public readonly code: 'newer' | 'invalid',
    message: string,
  ) {
    super(message)
  }
}

export const CURRENT_SCHEMA_VERSION = 1

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>

// Chain of migrate_N_to_N+1 steps, indexed by the version they migrate FROM.
// v1 has no predecessors; future versions append here.
const MIGRATIONS: Record<number, Migration> = {}

export function migrateProject(input: unknown): Project {
  if (typeof input !== 'object' || input === null) {
    throw new MigrationError('invalid', 'Project data is not an object')
  }
  let raw = input as Record<string, unknown>
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
  return raw as unknown as Project
}

function validate(raw: Record<string, unknown>): void {
  const ok =
    typeof raw.id === 'string' &&
    typeof raw.name === 'string' &&
    typeof raw.theme === 'object' &&
    raw.theme !== null &&
    Array.isArray(raw.items)
  if (!ok) throw new MigrationError('invalid', 'Project data is missing required fields')
}
