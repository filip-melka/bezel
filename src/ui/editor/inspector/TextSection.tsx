import { Fragment } from 'react'
import { FONTS } from '../../../assets/fonts/fonts'
import { resolveTextStyle } from '../../../model/defaults'
import { HEADLINE_MAX_CHARS, SUBHEADLINE_MAX_CHARS, type SlideItem, type TextStyleKey, type Theme } from '../../../model/types'
import { clearOverride, patchTextOverride, setItemText, setOverride, type TextKey } from '../../../store/actions'
import { focusHandlers } from '../../../store/history'
import { useUiStore } from '../../../store/uiStore'
import { InsetList, Row, Stack } from '../../controls/InsetList'
import { Switch } from '../../controls/Switch'
import c from '../../controls/controls.module.css'
import { TextStyleEditor } from './TextStyleEditor'
import s from '../editor.module.css'

type Slot = 'headline' | 'subheadline'
type Props = { item: SlideItem; slot: Slot; theme: Theme }

type Side = {
  textKey: TextKey
  styleKey: TextStyleKey
  label: 'Left slide' | 'Right slide' | null
  value: string
  // What the style row reads when the side has no override of its own.
  inherited: 'Set theme' | 'Same as left'
}

// A single slide has one text field. A pair has one per slide, each with its
// own style: the left slide overrides the set theme, the right slide overrides
// the left (so an un-customised right side follows the left).
function sidesFor(item: SlideItem, slot: Slot): Side[] {
  if (item.kind !== 'pair') return [{ textKey: slot, styleKey: slot, label: null, value: item[slot], inherited: 'Set theme' }]
  const right = slot === 'headline' ? 'headlineRight' : 'subheadlineRight'
  return [
    { textKey: slot, styleKey: slot, label: 'Left slide', value: item[slot], inherited: 'Set theme' },
    { textKey: right, styleKey: right, label: 'Right slide', value: item[right] ?? '', inherited: 'Same as left' },
  ]
}

export function TextSection({ item, slot, theme }: Props) {
  const shrunk = useUiStore((u) => u.previewReport?.textShrunk ?? false)
  const title = slot === 'headline' ? 'Headline' : 'Subheadline'
  const max = slot === 'headline' ? HEADLINE_MAX_CHARS : SUBHEADLINE_MAX_CHARS
  const sides = sidesFor(item, slot)
  const single = sides.length === 1
  const anyText = sides.some((f) => f.value.trim())
  const placeholder = slot === 'headline' ? 'Say what the screen does' : 'Optional supporting line'

  return (
    <section className={s.section} aria-label={title}>
      <div className={s.sectionHeader}>
        <span className="t-section">{title}</span>
        {single ? (
          <span className="t-caption">
            {sides[0]!.value.length} / {max}
          </span>
        ) : null}
      </div>
      <InsetList>
        {sides.map((side, i) => {
          const overridden = side.styleKey in item.overrides
          const where = side.label ? ` on the ${side.label.toLowerCase()}` : ' on this slide'
          return (
            <Fragment key={side.textKey}>
              {i > 0 ? <div className={s.sideDivider} aria-hidden /> : null}
              <Stack>
                {side.label ? (
                  <div className={s.textFieldHeader}>
                    <span className={s.sideLabel}>{side.label}</span>
                    <span className="t-caption">
                      {side.value.length} / {max}
                    </span>
                  </div>
                ) : null}
                <textarea
                  className={c.textarea}
                  // Typed in the face it will be drawn in, so the field shows
                  // what the slide gets.
                  style={{ fontFamily: FONTS[theme.font].stack }}
                  aria-label={side.label ? `${title} text, ${side.label.toLowerCase()}` : `${title} text`}
                  placeholder={side.label === 'Right slide' ? 'Leave empty for no text on this side' : placeholder}
                  value={side.value}
                  maxLength={max}
                  rows={2}
                  onChange={(e) => setItemText(item.id, side.textKey, e.target.value)}
                  {...focusHandlers}
                />
                {single && shrunk && anyText ? (
                  <span className="t-caption" role="status" style={{ color: 'var(--warning-text)' }}>
                    Text was shrunk to fit
                  </span>
                ) : null}
              </Stack>
              <Row
                label="Style"
                value={overridden ? 'Custom' : side.inherited}
                overridden={overridden}
                onReset={() => clearOverride(item.id, side.styleKey)}
              >
                <Switch
                  ariaLabel={`Override ${title.toLowerCase()} style${where}`}
                  checked={overridden}
                  onChange={(on) =>
                    on ? setOverride(item.id, side.styleKey, resolveTextStyle(theme, item.overrides, side.styleKey)) : clearOverride(item.id, side.styleKey)
                  }
                />
              </Row>
              {overridden ? (
                <TextStyleEditor
                  value={resolveTextStyle(theme, item.overrides, side.styleKey)}
                  onChange={(patch) => patchTextOverride(item.id, side.styleKey, patch)}
                />
              ) : null}
            </Fragment>
          )
        })}
      </InsetList>
      {!single && shrunk && anyText ? (
        <p className={s.hint} role="status" style={{ color: 'var(--warning-text)' }}>
          Text was shrunk to fit
        </p>
      ) : null}
    </section>
  )
}
