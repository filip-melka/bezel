import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
const POP_W = 220
const POP_H = 220
const GAP = 6

export function normalizeHex(text: string): string | null {
  let t = text.trim()
  if (!t.startsWith('#')) t = '#' + t
  if (!HEX.test(t)) return null
  if (t.length === 4) t = '#' + [...t.slice(1)].map((c) => c + c).join('')
  return t.toLowerCase()
}

// Positions the popover under the swatch in viewport coordinates, flipping
// above it when there is no room below. Rendered in a portal so ancestor
// overflow clipping cannot crop it.
function placePopover(anchor: HTMLElement): { top: number; left: number } {
  const r = anchor.getBoundingClientRect()
  const below = r.bottom + GAP + POP_H <= window.innerHeight
  const top = below ? r.bottom + GAP : Math.max(8, r.top - GAP - POP_H)
  const left = Math.min(Math.max(8, r.left), window.innerWidth - POP_W - 8)
  return { top, left }
}

export function ColorField({ value, onChange, ariaLabel, onDragStart, onDragEnd }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(value)
  const [editing, setEditing] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const root = useRef<HTMLDivElement>(null)
  const swatch = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editing) setText(value)
  }, [value, editing])

  useLayoutEffect(() => {
    if (!open || !swatch.current) return
    const update = () => swatch.current && setPos(placePopover(swatch.current))
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (root.current?.contains(t) || pop.current?.contains(t)) return
      setOpen(false)
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
        ref={swatch}
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
      {open
        ? createPortal(
            <div
              ref={pop}
              className={s.popover}
              style={{ top: pos.top, left: pos.left, width: POP_W }}
              onPointerDown={() => onDragStart?.()}
              onPointerUp={() => onDragEnd?.()}
            >
              <HexColorPicker color={value} onChange={onChange} />
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
