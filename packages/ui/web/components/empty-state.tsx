import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { size } from '../../tokens/index.ts'
import styles from './empty-state.module.css'

export type EmptyStateProps = {
  readonly icon: LucideIcon
  /** Translated. */
  readonly title: string
  /** Translated: what will appear here, or what to do next. */
  readonly body?: string
  /** One next step, such as a `Button`. */
  readonly action?: ReactNode
}

/** The empty state every data view shows when there is nothing yet. */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon size={size.icon.xl} strokeWidth={size.iconStroke} aria-hidden="true" />
      </span>
      <p className={styles.title}>{title}</p>
      {body ? <p className={styles.body}>{body}</p> : null}
      {action}
    </div>
  )
}
