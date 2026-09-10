import type { ReactNode } from 'react'
import { Button } from './Button'
import s from './controls.module.css'

export function InsetList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[s.list, className ?? ''].join(' ')}>{children}</div>
}

type RowProps = {
  label: ReactNode
  value?: ReactNode
  overridden?: boolean
  onReset?: () => void
  children?: ReactNode
}

// label · value · trailing. Overridden rows carry a tint dot before the label,
// a bolder value, and a Reset action (DESIGN §4.2).
export function Row({ label, value, overridden, onReset, children }: RowProps) {
  return (
    <div className={s.row}>
      <div className={s.rowLabel}>
        {overridden ? <span className={s.dot} aria-hidden /> : null}
        <span>{label}</span>
        {overridden ? <span className="visually-hidden">(overridden on this slide)</span> : null}
      </div>
      <div className={s.rowBody}>
        {value !== undefined ? <span className={[s.rowValue, overridden ? s.overridden : ''].join(' ')}>{value}</span> : null}
        {children}
        {overridden && onReset ? (
          <Button variant="plain" size="sm" onClick={onReset}>
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function Stack({ children }: { children: ReactNode }) {
  return <div className={s.stack}>{children}</div>
}
