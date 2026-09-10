import { useCallback } from 'react'
import { resolveTheme } from '../../../model/defaults'
import type { SlideItem, TemplateId, Theme } from '../../../model/types'
import { aspectMismatch } from '../../../render/renderItem'
import { PAIR_TEMPLATE_IDS, SLIDE_TEMPLATE_IDS, TEMPLATES, templateFor } from '../../../templates/registry'
import { clearOverride, setOverride, setScreenshot, setTemplate } from '../../../store/actions'
import { useUiStore } from '../../../store/uiStore'
import { Button } from '../../controls/Button'
import { InsetList, Row, Stack } from '../../controls/InsetList'
import { Segmented } from '../../controls/Segmented'
import { Switch } from '../../controls/Switch'
import { pickFiles } from '../../hooks/useDropZone'
import { importFileToItem } from '../importFiles'
import { BackgroundEditor } from './BackgroundEditor'
import { DeviceSection } from './DeviceSection'
import { TextSection } from './TextSection'
import s from '../editor.module.css'

export function SlideTab({ item, theme }: { item: SlideItem; theme: Theme }) {
  const def = templateFor(item)
  const resolved = resolveTheme(theme, item.overrides)
  const ids = item.kind === 'pair' ? PAIR_TEMPLATE_IDS : SLIDE_TEMPLATE_IDS
  const shot = item.screenshot
  const mismatch = shot ? aspectMismatch(shot.width, shot.height) : false
  const lowRes = shot ? shot.width < 1000 : false
  const bgOverridden = 'background' in item.overrides

  const replace = useCallback(async () => {
    const [file] = await pickFiles(false)
    if (file) await importFileToItem(file, item.id)
  }, [item.id])

  return (
    <>
      <section className={s.section} aria-label="Template">
        <div className={s.sectionHeader}>
          <span className="t-section">Template</span>
        </div>
        <Segmented<TemplateId>
          ariaLabel="Template"
          value={item.template}
          onChange={(t) => setTemplate(item.id, t)}
          options={ids.map((id) => ({ value: id, label: TEMPLATES[id].name }))}
        />
      </section>

      <section className={s.section} aria-label="Screenshot">
        <div className={s.sectionHeader}>
          <span className="t-section">Screenshot</span>
        </div>
        <InsetList>
          <div className={s.section} style={{ padding: '10px 12px' }}>
            {shot ? (
              <div className={s.fileMeta}>
                <span className={s.fileName} title={shot.fileName}>
                  {shot.fileName}
                </span>
                <span className="t-caption">
                  {shot.originalWidth} × {shot.originalHeight}
                  {shot.width !== shot.originalWidth ? ` (stored at ${shot.width} × ${shot.height})` : ''}
                </span>
              </div>
            ) : (
              <span className="t-caption">No screenshot. Drop one on the preview or choose a file.</span>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" onClick={() => void replace()}>
                {shot ? 'Replace…' : 'Choose…'}
              </Button>
              {shot ? (
                <Button size="sm" variant="destructive" onClick={() => setScreenshot(item.id, null)}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
          {mismatch && shot ? (
            <div className={s.warnText} role="status">
              This screenshot is {shot.originalWidth} × {shot.originalHeight}. It will be cropped to fit the 6.9" screen.
            </div>
          ) : null}
          {lowRes && shot ? (
            <div className={s.warnText} role="status">
              Low resolution: {shot.width} × {shot.height}, may look blurry.
            </div>
          ) : null}
        </InsetList>
      </section>

      {def.hasText ? (
        <>
          <TextSection item={item} slot="headline" theme={theme} />
          <TextSection item={item} slot="subheadline" theme={theme} />
        </>
      ) : null}

      <DeviceSection item={item} />

      <section className={s.section} aria-label="Background override">
        <div className={s.sectionHeader}>
          <span className="t-section">Background</span>
        </div>
        <InsetList>
          <Row label="Override" overridden={bgOverridden} onReset={() => clearOverride(item.id, 'background')}>
            <Switch
              ariaLabel="Override background on this slide"
              checked={bgOverridden}
              onChange={(on) => (on ? setOverride(item.id, 'background', structuredClone(theme.background)) : clearOverride(item.id, 'background'))}
            />
          </Row>
          {bgOverridden ? (
            <Stack>
              <BackgroundEditor value={resolved.background} onChange={(bg) => setOverride(item.id, 'background', bg)} />
            </Stack>
          ) : (
            <Row label="Uses" value="Set theme" />
          )}
        </InsetList>
        {!def.hasText ? <p className={s.hint}>This template has no text slots.</p> : null}
        <SlotHint />
      </section>
    </>
  )
}

function SlotHint() {
  const report = useUiStore((u) => u.previewReport)
  if (!report?.missingScreenshot) return null
  return <p className={s.hint}>The screen area exports as solid black until a screenshot is added.</p>
}
