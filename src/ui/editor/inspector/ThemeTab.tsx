import { FINISHES, FINISH_IDS } from '../../../assets/bezel/finishes'
import type { Theme } from '../../../model/types'
import { patchThemeText, setBezel, setThemeBackground } from '../../../store/actions'
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
