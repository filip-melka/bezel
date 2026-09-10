import { PRESET_GRADIENTS } from '../../../model/defaults'
import type { Background, GradientStop } from '../../../model/types'
import { backgroundToCss } from '../../../render/background'
import { dragHandlers } from '../../../store/history'
import { Button } from '../../controls/Button'
import { ColorField } from '../../controls/ColorField'
import { Segmented } from '../../controls/Segmented'
import { Slider } from '../../controls/Slider'
import s from '../editor.module.css'

type Kind = Background['kind']
type Props = { value: Background; onChange: (bg: Background) => void }

function darken(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) return '#000000'
  const n = Number.parseInt(m[1]!, 16)
  const f = (v: number) => Math.max(0, Math.round(v * 0.55))
  const r = f((n >> 16) & 255)
  const g = f((n >> 8) & 255)
  const b = f(n & 255)
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

function convert(bg: Background, kind: Kind): Background {
  if (bg.kind === kind) return bg
  if (kind === 'solid') {
    const first = bg.kind === 'solid' ? bg.color : (bg.stops[0]?.color ?? '#000000')
    return { kind: 'solid', color: first }
  }
  const stops: GradientStop[] =
    bg.kind === 'solid'
      ? [
          { offset: 0, color: bg.color },
          { offset: 1, color: darken(bg.color) },
        ]
      : bg.stops
  return kind === 'linear' ? { kind: 'linear', angle: 0, stops } : { kind: 'radial', stops }
}

export function BackgroundEditor({ value, onChange }: Props) {
  const setStops = (stops: GradientStop[]) => {
    if (value.kind === 'solid') return
    onChange({ ...value, stops })
  }

  return (
    <>
      <Segmented<Kind>
        ariaLabel="Background kind"
        value={value.kind}
        onChange={(k) => onChange(convert(value, k))}
        options={[
          { value: 'solid', label: 'Solid' },
          { value: 'linear', label: 'Linear' },
          { value: 'radial', label: 'Radial' },
        ]}
      />

      {value.kind === 'solid' ? (
        <div className={s.stopRow}>
          <span style={{ flex: 1, fontSize: 13 }}>Colour</span>
          <ColorField ariaLabel="Background colour" value={value.color} onChange={(color) => onChange({ kind: 'solid', color })} {...dragHandlers} />
        </div>
      ) : (
        <>
          {value.stops.map((stop, i) => (
            <div className={s.stopRow} key={i}>
              <span style={{ flex: 1, fontSize: 13 }}>Stop {i + 1}</span>
              <input
                type="number"
                className={s.stopOffset}
                aria-label={`Stop ${i + 1} position, percent`}
                min={0}
                max={100}
                value={Math.round(stop.offset * 100)}
                onChange={(e) => {
                  const pct = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                  setStops(value.stops.map((st, j) => (j === i ? { ...st, offset: pct / 100 } : st)))
                }}
              />
              <ColorField
                ariaLabel={`Stop ${i + 1} colour`}
                value={stop.color}
                onChange={(color) => setStops(value.stops.map((st, j) => (j === i ? { ...st, color } : st)))}
                {...dragHandlers}
              />
              <button
                type="button"
                className={s.iconBtn}
                aria-label={`Remove stop ${i + 1}`}
                disabled={value.stops.length <= 2}
                onClick={() => setStops(value.stops.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="sm"
              disabled={value.stops.length >= 4}
              onClick={() => {
                const last = value.stops[value.stops.length - 1]!
                setStops([...value.stops.slice(0, -1), { offset: Math.max(0, last.offset - 0.25), color: last.color }, last])
              }}
            >
              + Stop
            </Button>
          </div>
          {value.kind === 'linear' ? (
            <div style={{ margin: '0 -12px' }}>
              <Slider
                label="Angle"
                value={value.angle}
                min={0}
                max={360}
                step={1}
                defaultValue={0}
                format={(v) => `${Math.round(v)}°`}
                parse={(t) => {
                  const n = Number.parseFloat(t)
                  return Number.isFinite(n) ? n : null
                }}
                onChange={(angle) => onChange({ ...value, angle })}
                {...dragHandlers}
              />
            </div>
          ) : null}
        </>
      )}

      <div>
        <div className="t-caption" style={{ marginBottom: 6 }}>
          Presets
        </div>
        <div className={s.swatches} role="group" aria-label="Preset gradients">
          {PRESET_GRADIENTS.map((p) => (
            <button
              key={p.name}
              type="button"
              className={s.swatchBtn}
              style={{ background: backgroundToCss(p.background) }}
              aria-label={p.name}
              title={p.name}
              aria-pressed={JSON.stringify(p.background) === JSON.stringify(value)}
              onClick={() => onChange(structuredClone(p.background))}
            />
          ))}
        </div>
      </div>
    </>
  )
}
