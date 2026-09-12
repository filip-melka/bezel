import type { SlideItem, WidgetMode, WidgetScreen } from '../../../model/types'
import { setWidget } from '../../../store/actions'
import { dragHandlers } from '../../../store/history'
import { useUiStore } from '../../../store/uiStore'
import { WIDGET_DEFAULT_SCALE, WIDGET_OFFSET_LIMITS, WIDGET_SCALE_LIMITS, widgetKindOf } from '../../../templates/widget'
import { detectWidgetForItem } from '../../../widgets/run'
import { DEFAULT_PLACEHOLDER_COLOR } from '../../../render/placeholders'
import { Button } from '../../controls/Button'
import { ColorField } from '../../controls/ColorField'
import { InsetList, Row } from '../../controls/InsetList'
import { Segmented } from '../../controls/Segmented'
import { Slider } from '../../controls/Slider'
import s from '../editor.module.css'

const scaleFmt = (v: number) => `${v.toFixed(2)}×`
const pxFmt = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v)} px`
const parseNum = (t: string) => {
  const n = Number.parseFloat(t.replace(/[×x]/g, ''))
  return Number.isFinite(n) ? n : null
}

// Controls for the Live Activity cut-out. Available on every template, so the
// section is always present and its first row is the option itself.
export function WidgetSection({ item }: { item: SlideItem }) {
  const openSheet = useUiStore((u) => u.openSheet)
  const kind = widgetKindOf(item)
  const crop = kind && item.widget?.crop?.kind === kind ? item.widget.crop : null
  const status = !item.screenshot ? 'Needs a screenshot' : crop ? 'Detected' : item.widget?.notFound ? 'Not found' : 'Not detected yet'
  const scale = item.widget?.scale ?? WIDGET_DEFAULT_SCALE
  const placeholder = (item.widget?.screen ?? 'screenshot') === 'placeholder'
  const customColor = item.widget?.placeholderColor ?? null
  const defaultColor = DEFAULT_PLACEHOLDER_COLOR[kind === 'island' ? 'home' : 'lock']

  return (
    <section className={s.section} aria-label="Live Activity">
      <div className={s.sectionHeader}>
        <span className="t-section">Live Activity</span>
      </div>
      <InsetList>
        <Row label="Lift">
          <Segmented<WidgetMode>
            ariaLabel="Live Activity to lift off the screen"
            className={s.segFill}
            value={item.widget?.mode ?? 'none'}
            onChange={(mode) => {
              setWidget(item.id, { mode })
              if (mode !== 'none' && item.screenshot && item.widget?.crop?.kind !== mode) void detectWidgetForItem(item.id)
            }}
            options={[
              { value: 'none', label: 'None' },
              { value: 'lockActivity', label: 'Lock', title: 'Lift the lock-screen Live Activity card off the screen' },
              { value: 'island', label: 'Island', title: 'Lift the expanded Dynamic Island off the screen' },
            ]}
          />
        </Row>
        {kind ? (
          <>
            <Row label="Crop" value={status}>
              <Button size="sm" disabled={!item.screenshot} onClick={() => void detectWidgetForItem(item.id)}>
                Detect
              </Button>
              <Button size="sm" disabled={!item.screenshot} onClick={() => openSheet('widget')}>
                Adjust…
              </Button>
            </Row>
            <Row label="Screen">
              <Segmented<WidgetScreen>
                ariaLabel="Screen behind the widget"
                className={s.segFill}
                value={item.widget?.screen ?? 'screenshot'}
                onChange={(screen) => setWidget(item.id, { screen })}
                options={[
                  { value: 'screenshot', label: 'Screenshot' },
                  { value: 'placeholder', label: 'Placeholder', title: kind === 'island' ? 'Drawn home screen, only the island comes from your screenshot' : 'Drawn lock screen, only the card comes from your screenshot' },
                ]}
              />
            </Row>
            {placeholder ? (
              <Row label="Colour" overridden={!!customColor} onReset={() => setWidget(item.id, { placeholderColor: null })}>
                <ColorField
                  ariaLabel="Placeholder colour"
                  value={customColor ?? defaultColor}
                  onChange={(placeholderColor) => setWidget(item.id, { placeholderColor })}
                  {...dragHandlers}
                />
              </Row>
            ) : null}
            <Slider
              label="Scale"
              value={scale}
              min={WIDGET_SCALE_LIMITS[0]}
              max={WIDGET_SCALE_LIMITS[1]}
              step={0.01}
              defaultValue={WIDGET_DEFAULT_SCALE}
              format={scaleFmt}
              parse={parseNum}
              onChange={(v) => setWidget(item.id, { scale: v })}
              disabled={!crop}
              {...dragHandlers}
            />
            <Slider
              label="Offset"
              value={item.widget?.offsetY ?? 0}
              min={WIDGET_OFFSET_LIMITS[0]}
              max={WIDGET_OFFSET_LIMITS[1]}
              step={1}
              defaultValue={0}
              format={pxFmt}
              parse={parseNum}
              bipolar
              onChange={(v) => setWidget(item.id, { offsetY: v })}
              disabled={!crop}
              {...dragHandlers}
            />
          </>
        ) : null}
      </InsetList>
      {kind && !crop && item.screenshot ? (
        <p className={s.hint}>
          {kind === 'island'
            ? 'Use a screenshot with the Dynamic Island expanded. Detection looks for the black island at the top.'
            : 'Use a lock-screen screenshot showing the Live Activity card. Detection looks for a flat card above the quick actions.'}
        </p>
      ) : null}
    </section>
  )
}
