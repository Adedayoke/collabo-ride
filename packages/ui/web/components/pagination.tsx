import { useTranslation } from '@collabo/i18n'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { IconButton } from './icon-button.tsx'
import styles from './pagination.module.css'

export type PaginationProps = {
  /** Zero based. */
  readonly pageIndex: number
  readonly pageCount: number
  readonly onPageChange: (pageIndex: number) => void
}

/** Previous and next with "Page 2 of 7", announced as it changes. */
export function Pagination({ pageIndex, pageCount, onPageChange }: PaginationProps) {
  const { t } = useTranslation()
  const count = Math.max(pageCount, 1)
  return (
    <nav className={styles.pagination} aria-label={t('pagination.label')}>
      <IconButton
        icon={ChevronLeft}
        label={t('pagination.previous')}
        variant="secondary"
        disabled={pageIndex <= 0}
        onClick={() => onPageChange(pageIndex - 1)}
      />
      <span className={styles.status} aria-live="polite">
        {t('pagination.status', { page: pageIndex + 1, count })}
      </span>
      <IconButton
        icon={ChevronRight}
        label={t('pagination.next')}
        variant="secondary"
        disabled={pageIndex >= count - 1}
        onClick={() => onPageChange(pageIndex + 1)}
      />
    </nav>
  )
}
