import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { size as sizes } from '../../tokens/index.ts'
import styles from './button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly loading?: boolean
  readonly icon?: LucideIcon
  /** The translated label. */
  readonly children: ReactNode
}

/** The console button: the same variants and sizes as the native kit, on `tokens.css`. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[variant], size === 'md' ? undefined : styles[size], className]
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes.filter(Boolean).join(' ')}
      {...props}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {!loading && Icon ? <Icon size={sizes.icon.md} strokeWidth={1.75} aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
