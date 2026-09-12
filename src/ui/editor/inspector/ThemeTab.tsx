import { FINISHES, FINISH_IDS } from '../../../assets/bezel/finishes'
import { FONTS, FONT_IDS } from '../../../assets/fonts/fonts'
import type { Theme } from '../../../model/types'
import { patchThemeText, setBezel, setThemeBackground, setThemeFont } from '../../../store/actions'
import { InsetList, Row, Stack } from '../../controls/InsetList'
import { Switch } from '../../controls/Switch'
import { BackgroundEditor } from './BackgroundEditor'
import { TextStyleEditor } from './TextStyleEditor'
import s from '../editor.module.css'

export function ThemeTab({ theme }: { theme: Theme }) {
  return (
    <>
      <section className={s.section} aria-label="Background">
        <div className={s.sectionHeader}>
          <span className="t-section">Background</span>
        </div>
        <InsetList>
          <Stack>
            <BackgroundEditor value={theme.background} onChange={setThemeBackground} />
          </Stack>
        </InsetList>
      </section>

      <section className={s.section} aria-label="Font">
        <div className={s.sectionHeader}>
          <span className="t-section">Font</span>
        </div>
        <InsetList>
          <div className={s.fonts} role="radiogroup" aria-label="Font">
            {FONT_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                className={s.fontBtn}
                // Each option is set in its own face, so the control shows the
                // choice rather than describing it.
                style={{ fontFamily: FONTS[id].stack }}
                aria-checked={theme.font === id}
                onClick={() => setThemeFont(id)}
              >
                <span className={s.fontSample} aria-hidden>
                  Ag
                </span>
                <span className={s.fontName}>{FONTS[id].label}</span>
              </button>
            ))}
          </div>
        </InsetList>
        <p className={s.hint}>The font applies to every slide in the set. It is bundled with Bezel, so exports look the same on any machine.</p>
      </section>

      <section className={s.section} aria-label="Headline style">
        <div className={s.sectionHeader}>
          <span className="t-section">Headline</span>
        </div>
        <InsetList>
          <TextStyleEditor value={theme.headline} onChange={(p) => patchThemeText('headline', p)} />
        </InsetList>
      </section>

      <section className={s.section} aria-label="Subheadline style">
        <div className={s.sectionHeader}>
          <span className="t-section">Subheadline</span>
        </div>
        <InsetList>
          <TextStyleEditor value={theme.subheadline} onChange={(p) => patchThemeText('subheadline', p)} />
        </InsetList>
      </section>

      <section className={s.section} aria-label="Bezel">
        <div className={s.sectionHeader}>
          <span className="t-section">Bezel</span>
        </div>
        <InsetList>
          <Row label="Finish" value={FINISHES[theme.bezel.finish].label}>
            <div className={s.finishes} role="group" aria-label="Bezel finish">
              {FINISH_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={s.finishBtn}
                  style={{ background: FINISHES[id].body }}
                  aria-label={FINISHES[id].label}
                  aria-pressed={theme.bezel.finish === id}
                  onClick={() => setBezel({ finish: id })}
                />
              ))}
            </div>
          </Row>
          <Row label="Drop shadow">
            <Switch ariaLabel="Drop shadow" checked={theme.bezel.shadow} onChange={(shadow) => setBezel({ shadow })} />
          </Row>
        </InsetList>
        <p className={s.hint}>Finish and shadow apply to every slide in the set.</p>
      </section>
    </>
  )
}
