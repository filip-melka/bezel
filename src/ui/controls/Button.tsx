import type { ButtonHTMLAttributes } from 'react'
import s from './controls.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'tinted' | 'plain' | 'destructive' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
}

export function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...rest }: Props) {
  const cls = [s.btn, s[variant], size === 'sm' ? s.sm : '', className ?? ''].join(' ')
  return <button type={type} className={cls} {...rest} />
}
