import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import s from './controls.module.css'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

const OUT_MS = 160

// Centred card over a scrim. Escape and scrim-click dismiss (DESIGN §4.7).
export function Sheet({ open, onClose, title, children }: Props) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }
    if (!mounted) return
    setClosing(true)
    const t = setTimeout(() => {
      setMounted(false)
      setClosing(false)
    }, OUT_MS)
    return () => clearTimeout(t)
  }, [open, mounted])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey, true)
    bodyRef.current?.querySelector<HTMLElement>('button, [tabindex]')?.focus()
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  if (!mounted) return null
  return createPortal(
    <div
      className={[s.scrim, closing ? s.closing : ''].join(' ')}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={s.sheet} role="dialog" aria-modal="true" aria-label={title} ref={bodyRef}>
        <div className={s.grabber} aria-hidden />
        <div className={s.sheetHeader}>
          <span className="t-title">{title}</span>
          <Button variant="plain" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
        <div className={s.sheetBody}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
