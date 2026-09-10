import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import s from './controls.module.css'

type Props = {
  value: string
  onChange: (hex: string) => void
  ariaLabel: string
  onDragStart?: () => void
  onDragEnd?: () => void
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export function normalizeHex(text: string): string | null {
  let t = text.trim()
  if (!t.startsWith('#')) t = '#' + t
  if (!HEX.test(t)) return null
  if (t.length === 4) t = '#' + [...t.slice(1)].map((c) => c + c).join('')
  return t.toLowerCase()
}

export function ColorField({ value, onChange, ariaLabel, onDragStart, onDragEnd }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(value)
  const [editing, setEditing] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editing) setText(value)
  }, [value, editing])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const commitText = () => {
    setEditing(false)
    const hex = normalizeHex(text)
    if (hex) onChange(hex)
    else setText(value)
  }

  return (
    <div className={s.color} ref={root}>
      <button
        type="button"
        className={s.swatch}
        style={{ background: value }}
        aria-label={`${ariaLabel}, pick colour`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      />
      <input
        type="text"
        className={s.hex}
        aria-label={`${ariaLabel} hex`}
        value={text}
        onFocus={() => setEditing(true)}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
      {open ? (
        <div className={s.popover} onPointerDown={() => onDragStart?.()} onPointerUp={() => onDragEnd?.()}>
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      ) : null}
    </div>
  )
}
