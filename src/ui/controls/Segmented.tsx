import s from './controls.module.css'

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  disabled?: boolean
  title?: string
}

type Props<T extends string> = {
  value: T
  onChange: (v: T) => void
  options: SegmentedOption<T>[]
  ariaLabel: string
  className?: string
}

export function Segmented<T extends string>({ value, onChange, options, ariaLabel, className }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={[s.seg, className ?? ''].join(' ')}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={s.segItem}
          disabled={o.disabled}
          title={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
