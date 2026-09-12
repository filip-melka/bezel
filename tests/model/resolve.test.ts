import { describe, expect, it } from 'vitest'
import { defaultTheme, resolveTextStyle, resolveTheme } from '../../src/model/defaults'

describe('resolveTextStyle', () => {
  const theme = defaultTheme()
  it('left slots layer the override over the set theme', () => {
    expect(resolveTextStyle(theme, {}, 'headline')).toEqual(theme.headline)
    expect(resolveTextStyle(theme, { headline: { ...theme.headline, align: 'left' } }, 'headline').align).toBe('left')
  })
  it('right slots inherit the resolved left style', () => {
    const overrides = { headline: { ...theme.headline, size: 150 } }
    expect(resolveTextStyle(theme, overrides, 'headlineRight').size).toBe(150)
    expect(resolveTextStyle(theme, {}, 'subheadlineRight')).toEqual(theme.subheadline)
  })
  it('a right override wins over the left', () => {
    const overrides = { headline: { ...theme.headline, align: 'left' as const }, headlineRight: { ...theme.headline, align: 'right' as const } }
    expect(resolveTextStyle(theme, overrides, 'headline').align).toBe('left')
    expect(resolveTextStyle(theme, overrides, 'headlineRight').align).toBe('right')
  })
})

describe('resolveTheme', () => {
  const theme = defaultTheme()
  it('carries the set font through to the renderer', () => {
    expect(resolveTheme(theme, {}).font).toBe(theme.font)
    expect(resolveTheme({ ...theme, font: 'jakarta' }, {}).font).toBe('jakarta')
  })
  it('keeps the font set-level: no override can change it on one slide', () => {
    // The font is deliberately not part of TextStyle. If it were, a style
    // override would snapshot it and that slide would stop following the set
    // when the project font changed.
    const overrides = {
      background: { kind: 'solid' as const, color: '#123456' },
      headline: { ...theme.headline, size: 150 },
    }
    expect(resolveTheme({ ...theme, font: 'sourceSerif' }, overrides).font).toBe('sourceSerif')
    expect('font' in theme.headline).toBe(false)
  })
})
