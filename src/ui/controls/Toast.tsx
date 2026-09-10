import { createPortal } from 'react-dom'
import { useUiStore } from '../../store/uiStore'
import s from './controls.module.css'

export function ToastHost() {
  const toast = useUiStore((u) => u.toast)
  if (!toast) return null
  return createPortal(
    <div className={s.toast} role="status" aria-live="polite">
      <span>{toast.message}</span>
      {toast.action ? (
        <button type="button" className={s.toastAction} onClick={toast.action.onClick}>
          {toast.action.label}
        </button>
      ) : null}
    </div>,
    document.body,
  )
}

export function Banner({ kind, children }: { kind: 'warning' | 'error' | 'info'; children: React.ReactNode }) {
  return (
    <div className={[s.banner, s[kind]].join(' ')} role={kind === 'error' ? 'alert' : 'status'}>
      <span className={s.bannerText}>{children}</span>
    </div>
  )
}
