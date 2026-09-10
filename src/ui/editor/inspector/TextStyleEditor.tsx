import type { TextAlign, TextStyle, TextWeight } from '../../../model/types'
import { dragHandlers } from '../../../store/history'
import { ColorField } from '../../controls/ColorField'
import { Row } from '../../controls/InsetList'
import { Segmented } from '../../controls/Segmented'
import { Slider } from '../../controls/Slider'

type Props = { value: TextStyle; onChange: (patch: Partial<TextStyle>) => void }

const px = (v: number) => `${Math.round(v)} px`
const parsePx = (t: string) => {
  const n = Number.parseFloat(t)
  return Number.isFinite(n) ? n : null
}

export function TextStyleEditor({ value, onChange }: Props) {
  return (
    <>
      <Slider
        label="Size"
        value={value.size}
        min={40}
        max={200}
        step={1}
        defaultValue={value.size}
        format={px}
        parse={parsePx}
        onChange={(size) => onChange({ size })}
        {...dragHandlers}
      />
      <Row label="Weight">
        <Segmented<`${TextWeight}`>
          ariaLabel="Weight"
          value={`${value.weight}`}
          onChange={(w) => onChange({ weight: Number(w) as TextWeight })}
          options={[
            { value: '400', label: 'Regular' },
            { value: '500', label: 'Medium' },
            { value: '600', label: 'Semibold' },
            { value: '700', label: 'Bold' },
          ]}
        />
      </Row>
      <Row label="Colour">
        <ColorField ariaLabel="Text colour" value={value.color} onChange={(color) => onChange({ color })} {...dragHandlers} />
      </Row>
      <Row label="Align">
        <Segmented<TextAlign>
          ariaLabel="Alignment"
          value={value.align}
          onChange={(align) => onChange({ align })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Centre' },
            { value: 'right', label: 'Right' },
          ]}
        />
      </Row>
    </>
  )
}
