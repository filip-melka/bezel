import { describe, expect, it } from 'vitest'
import { newProject } from '../../src/model/defaults'
import { CURRENT_SCHEMA_VERSION, MigrationError, migrateProject, tryMigrateProject } from '../../src/model/migrate'

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
  it('treats unversioned data as v1 and migrates it to the current schema', () => {
    const { schemaVersion: _v, ...rest } = newProject('legacy')
    const out = migrateProject(rest)
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })
  it('v1 → v2 merges Text left / Text right into Panorama and keeps text on its side, then v2 → v3 folds tilt direction into an option', () => {
    const base = { id: 'p', name: 'x', createdAt: 0, updatedAt: 0, schemaVersion: 1, theme: {} }
    const pair = (template: string, headline: string) => ({ kind: 'pair', id: template, template, headline, subheadline: 'sub' })
    const out = migrateProject({
      ...base,
      items: [
        { kind: 'slide', id: 's', template: 'textTop', headline: 'keep', subheadline: '' },
        pair('panoLeftText', 'L'),
        pair('panoRightText', 'R'),
        pair('panoTilted', 'TL'),
        pair('panoTiltedRight', 'TR'),
      ],
    })
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    const [slide, left, right, tiltL, tiltR] = out.items as unknown as Array<Record<string, string>>
    expect(slide).toEqual({ kind: 'slide', id: 's', template: 'textTop', headline: 'keep', subheadline: '' })
    expect(left).toMatchObject({ template: 'panorama', headline: 'L', subheadline: 'sub', headlineRight: '', subheadlineRight: '' })
    expect(right).toMatchObject({ template: 'panorama', headline: '', subheadline: '', headlineRight: 'R', subheadlineRight: 'sub' })
    expect(tiltL).toMatchObject({ template: 'panoTilted', tilt: 'left', headline: 'TL', headlineRight: '' })
    expect(tiltR).toMatchObject({ template: 'panoTilted', tilt: 'right', headline: '', headlineRight: 'TR', subheadlineRight: 'sub' })
  })
  it('v2 → v3 turns the Lock and Island templates into a widget mode on Text top', () => {
    const base = { id: 'p', name: 'x', createdAt: 0, updatedAt: 0, schemaVersion: 2, theme: {} }
    const crop = { kind: 'lockActivity', x: 1, y: 2, w: 3, h: 4, radius: 5 }
    const out = migrateProject({
      ...base,
      items: [
        { kind: 'slide', id: 'a', template: 'lockActivity', widget: { crop, screen: 'placeholder', scale: 1.5, offsetY: 10, notFound: false } },
        { kind: 'slide', id: 'b', template: 'island' },
        { kind: 'slide', id: 'c', template: 'tilted' },
        { kind: 'slide', id: 'd', template: 'textTop' },
      ],
    })
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    const [lock, island, tilt, plain] = out.items as unknown as Array<Record<string, unknown>>
    // The crop and every widget setting survive the fold.
    expect(lock).toMatchObject({ template: 'textTop', widget: { mode: 'lockActivity', crop, screen: 'placeholder', scale: 1.5, offsetY: 10 } })
    expect(island).toMatchObject({ template: 'textTop', widget: { mode: 'island' } })
    expect(tilt).toMatchObject({ template: 'tilted', tilt: 'left' })
    expect(plain).toMatchObject({ template: 'textTop' })
    expect(plain!.widget).toBeUndefined()
  })
  it('replaces a template id it does not know rather than failing to load', () => {
    const p = newProject('x')
    const out = migrateProject({
      ...p,
      items: [
        { ...p.items[0], template: 'somethingRemoved' },
        { ...p.items[0], id: 'q', kind: 'pair', template: 'alsoGone', headlineRight: '', subheadlineRight: '', textNudgeRight: { offsetY: 0 } },
      ],
    })
    expect(out.items[0]!.template).toBe('textTop')
    expect(out.items[1]!.template).toBe('panorama')
  })
  it('v3 → v4 moves the font from the machine into the project', () => {
    const base = { id: 'p', name: 'x', createdAt: 0, updatedAt: 0, schemaVersion: 3, items: [] }
    const out = migrateProject({ ...base, theme: { background: { kind: 'solid', color: '#000' } } })
    expect(out.schemaVersion).toBe(4)
    expect(out.theme.font).toBe('inter')
    // A project that already names a font keeps it.
    const kept = migrateProject({ ...base, theme: { background: { kind: 'solid', color: '#000' }, font: 'sourceSerif' } })
    expect(kept.theme.font).toBe('sourceSerif')
  })
  it('replaces a font id it does not know rather than resolving to no stack', () => {
    const p = newProject('x')
    const out = migrateProject({ ...p, theme: { ...p.theme, font: 'comicSans' } })
    expect(out.theme.font).toBe('inter')
  })
  it('gives pairs saved without a right text offset the shared one, so nothing moves', () => {
    const p = newProject('x')
    const pair = { kind: 'pair', id: 'q', template: 'panorama', screenshot: null, headline: 'L', subheadline: '', headlineRight: 'R', subheadlineRight: '', device: { scale: 1, offsetY: 0 }, textNudge: { offsetY: 22 }, overrides: {} }
    const out = migrateProject({ ...p, items: [pair] })
    expect((out.items[0] as { textNudgeRight: { offsetY: number } }).textNudgeRight).toEqual({ offsetY: 22 })
    // Pairs that already have one keep it.
    const kept = migrateProject({ ...p, items: [{ ...pair, textNudgeRight: { offsetY: -5 } }] })
    expect((kept.items[0] as { textNudgeRight: { offsetY: number } }).textNudgeRight).toEqual({ offsetY: -5 })
  })
  it('tryMigrateProject returns null instead of throwing', () => {
    expect(tryMigrateProject({ ...newProject('x'), schemaVersion: 99 })).toBeNull()
    expect(tryMigrateProject(null)).toBeNull()
    expect(tryMigrateProject(newProject('ok'))?.name).toBe('ok')
  })
})
