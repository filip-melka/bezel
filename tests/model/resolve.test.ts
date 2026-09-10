import { describe, expect, it } from 'vitest'
import { defaultTheme, resolveTextStyle } from '../../src/model/defaults'

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
