import type { SlideItem } from '../../../model/types'
import { templateFor } from '../../../templates/registry'
import { resetDevice, setDevice, setTextNudge } from '../../../store/actions'
import { dragHandlers } from '../../../store/history'
import { Button } from '../../controls/Button'
import { InsetList } from '../../controls/InsetList'
import { Slider } from '../../controls/Slider'
import s from '../editor.module.css'

const scaleFmt = (v: number) => `${v.toFixed(2)}×`
const pxFmt = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v)} px`
const parseNum = (t: string) => {
  const n = Number.parseFloat(t.replace(/[×x]/g, ''))
  return Number.isFinite(n) ? n : null
}

export function DeviceSection({ item }: { item: SlideItem }) {
  const { limits, hasText } = templateFor(item)
  const isDefault = item.device.scale === 1 && item.device.offsetY === 0

  return (
    <>
      <section className={s.section} aria-label="Device">
        <div className={s.sectionHeader}>
          <span className="t-section">Device</span>
          {!isDefault ? (
            <Button variant="plain" size="sm" onClick={() => resetDevice(item.id)}>
              Reset
            </Button>
          ) : null}
        </div>
        <InsetList>
          <Slider
            label="Scale"
            value={item.device.scale}
            min={limits.scale[0]}
            max={limits.scale[1]}
            step={0.01}
            defaultValue={1}
            format={scaleFmt}
            parse={parseNum}
            onChange={(scale) => setDevice(item.id, { scale })}
            {...dragHandlers}
          />
          <Slider
            label="Offset"
            value={item.device.offsetY}
            min={limits.deviceOffsetY[0]}
            max={limits.deviceOffsetY[1]}
            step={1}
            defaultValue={0}
            format={pxFmt}
            parse={parseNum}
            bipolar
            onChange={(offsetY) => setDevice(item.id, { offsetY })}
            {...dragHandlers}
          />
        </InsetList>
      </section>
      {hasText ? (
        <section className={s.section} aria-label="Text position">
          <div className={s.sectionHeader}>
            <span className="t-section">Text position</span>
          </div>
          <InsetList>
            <Slider
              label="Offset"
              value={item.textNudge.offsetY}
              min={limits.textOffsetY[0]}
              max={limits.textOffsetY[1]}
              step={1}
              defaultValue={0}
              format={pxFmt}
              parse={parseNum}
              bipolar
              onChange={(v) => setTextNudge(item.id, v)}
              {...dragHandlers}
            />
          </InsetList>
        </section>
      ) : null}
    </>
  )
}
