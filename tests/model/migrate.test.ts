import { describe, expect, it } from 'vitest'
import { newProject } from '../../src/model/defaults'
import { MigrationError, migrateProject } from '../../src/model/migrate'

describe('migrateProject', () => {
  it('accepts a current project unchanged', () => {
    const p = newProject('Test')
    const out = migrateProject(JSON.parse(JSON.stringify(p)))
    expect(out).toEqual(p)
  })
  it('rejects newer schema versions with code "newer"', () => {
    const p = { ...newProject('x'), schemaVersion: 99 }
    expect(() => migrateProject(p)).toThrowError(MigrationError)
    try {
      migrateProject(p)
    } catch (e) {
      expect((e as MigrationError).code).toBe('newer')
    }
  })
  it('rejects malformed data with code "invalid"', () => {
    expect(() => migrateProject(null)).toThrowError(MigrationError)
    try {
      migrateProject({ id: 'a' })
    } catch (e) {
      expect((e as MigrationError).code).toBe('invalid')
    }
  })
  it('treats unversioned v1-shaped data as v1', () => {
    const { schemaVersion: _v, ...rest } = newProject('legacy')
    const out = migrateProject(rest)
    expect(out.schemaVersion).toBe(1)
  })
})
