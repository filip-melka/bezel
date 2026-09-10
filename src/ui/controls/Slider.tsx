import { useEffect, useId, useState, type KeyboardEvent, type PointerEvent } from 'react'
import s from './controls.module.css'

type Props = {
  label: string
  value: number
  min: number
  max: number
  step: number
  defaultValue: number
  onChange: (v: number) => void
  // Called at the start and end of a pointer drag so callers can batch history.
  onDragStart?: () => void
  onDragEnd?: () => void
  format: (v: number) => string
  parse?: (text: string) => number | null
  // Bipolar sliders fill from the centre (offsets); magnitude sliders from the left.
  bipolar?: boolean
  disabled?: boolean
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function snap(v: number, step: number, min: number): number {
  const n = Math.round((v - min) / step) * step + min
  return Number(n.toFixed(6))
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  onChange,
  onDragStart,
  onDragEnd,
  format,
  parse,
  bipolar,
  disabled,
}: Props) {
  const id = useId()
  const [text, setText] = useState(() => format(value))
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (!editing) setText(format(value))
  }, [value, editing, format])

  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const zero = bipolar ? clamp(0, min, max) : min
  const left = Math.min(pct(zero), pct(value))
  const width = Math.abs(pct(value) - pct(zero))

  const commit = (v: number) => onChange(snap(clamp(v, min, max), step, min))

  const onPointerDown = (e: PointerEvent<HTMLInputElement>) => {
    if (e.altKey) {
      e.preventDefault()
      commit(defaultValue)
      return
    }
    onDragStart?.()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!e.shiftKey) return
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      commit(value - step * 10)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      commit(value + step * 10)
    }
  }

  const commitText = () => {
    setEditing(false)
    const parsed = parse ? parse(text) : Number.parseFloat(text)
    if (parsed !== null && Number.isFinite(parsed)) commit(parsed)
    else setText(format(value))
  }

  return (
    <div className={s.slider}>
      <label htmlFor={id} className={s.sliderLabel}>
        {label}
      </label>
      <div className={s.sliderTrackWrap}>
        <div className={s.sliderTrack} aria-hidden />
        <div className={s.sliderFill} style={{ left: `${left}%`, width: `${width}%` }} aria-hidden />
        <input
          id={id}
          type="range"
          className={s.sliderInput}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-valuetext={format(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={onPointerDown}
          onPointerUp={() => onDragEnd?.()}
          onPointerCancel={() => onDragEnd?.()}
          onKeyDown={onKeyDown}
        />
      </div>
      <input
        type="text"
        className={s.sliderReadout}
        aria-label={`${label} value`}
        value={text}
        disabled={disabled}
        onFocus={() => setEditing(true)}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') {
            setText(format(value))
            setEditing(false)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
    </div>
  )
}
