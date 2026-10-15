import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

import { size as sizes } from '../../tokens/index.ts'
import focus from './focus.module.css'
import styles from './icon-button.module.css'

export type IconButtonVariant = 'ghost' | 'secondary' | 'destructive'

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  readonly icon: LucideIcon
  /** Translated; an icon only button always has a label. */
  readonly label: string
  readonly variant?: IconButtonVariant
  readonly size?: 'sm' | 'md'
}

/** A square button with just an icon, at least 40 px (`sm`) or 48 px (`md`). */
export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className,
  ...props
}: IconButtonProps) {
  const classes = [styles.button, focus.ring, styles[variant], styles[size], className]
  return (
    <button type={type} aria-label={label} title={label} className={classes.filter(Boolean).join(' ')} {...props}>
      <Icon size={size === 'sm' ? sizes.icon.md : sizes.icon.lg} strokeWidth={sizes.iconStroke} aria-hidden="true" />
    </button>
  )
}
