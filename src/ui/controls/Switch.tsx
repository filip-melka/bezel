import s from './controls.module.css'

type Props = {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel: string
  disabled?: boolean
}

export function Switch({ checked, onChange, ariaLabel, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={s.switch}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  )
}
