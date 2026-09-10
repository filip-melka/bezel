import { HEADLINE_MAX_CHARS, SUBHEADLINE_MAX_CHARS, type SlideItem, type Theme } from '../../../model/types'
import { clearOverride, patchTextOverride, setItemText, setOverride } from '../../../store/actions'
import { focusHandlers } from '../../../store/history'
import { useUiStore } from '../../../store/uiStore'
import { InsetList, Row, Stack } from '../../controls/InsetList'
import { Switch } from '../../controls/Switch'
import c from '../../controls/controls.module.css'
import { TextStyleEditor } from './TextStyleEditor'
import s from '../editor.module.css'

type Props = { item: SlideItem; slot: 'headline' | 'subheadline'; theme: Theme }

export function TextSection({ item, slot, theme }: Props) {
  const shrunk = useUiStore((u) => u.previewReport?.textShrunk ?? false)
  const overridden = slot in item.overrides
  const style = { ...theme[slot], ...item.overrides[slot] }
  const title = slot === 'headline' ? 'Headline' : 'Subheadline'
  const max = slot === 'headline' ? HEADLINE_MAX_CHARS : SUBHEADLINE_MAX_CHARS

  return (
    <section className={s.section} aria-label={title}>
      <div className={s.sectionHeader}>
        <span className="t-section">{title}</span>
        <span className="t-caption">
          {item[slot].length} / {max}
        </span>
      </div>
      <InsetList>
        <Stack>
          <textarea
            className={c.textarea}
            aria-label={`${title} text`}
            placeholder={slot === 'headline' ? 'Say what the screen does' : 'Optional supporting line'}
            value={item[slot]}
            maxLength={max}
            rows={2}
            onChange={(e) => setItemText(item.id, slot, e.target.value)}
            {...focusHandlers}
          />
          {shrunk && item[slot].trim() ? (
            <span className="t-caption" role="status" style={{ color: 'var(--warning-text)' }}>
              Text was shrunk to fit
            </span>
          ) : null}
        </Stack>
        <Row
          label="Style"
          value={overridden ? 'Custom' : 'Set theme'}
          overridden={overridden}
          onReset={() => clearOverride(item.id, slot)}
        >
          <Switch
            ariaLabel={`Override ${title.toLowerCase()} style on this slide`}
            checked={overridden}
            onChange={(on) => (on ? setOverride(item.id, slot, { ...theme[slot] }) : clearOverride(item.id, slot))}
          />
        </Row>
        {overridden ? <TextStyleEditor value={style} onChange={(patch) => patchTextOverride(item.id, slot, patch)} /> : null}
      </InsetList>
    </section>
  )
}
