import { useTranslation } from '@collabo/i18n'
import type { ReactNode } from 'react'

import styles from './skeleton.module.css'

export type SkeletonProps = {
  readonly shape?: 'line' | 'block' | 'circle'
  /** A token CSS length, such as `var(--size-avatar-md)`. Defaults per shape. */
  readonly width?: string
}

/** One loading placeholder. Group several in `SkeletonGroup`, which announces loading once. */
export function Skeleton({ shape = 'line', width }: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${styles[shape]}`}
      style={width ? { '--skeleton-width': width } : undefined}
      aria-hidden="true"
    />
  )
}

/** Loading placeholders read as one "Loading" to assistive tech, not as empty boxes. */
export function SkeletonGroup({ children }: { readonly children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className={styles.group} aria-busy="true">
      <output className={styles.srOnly}>{t('state.loading')}</output>
      {children}
    </div>
  )
}
