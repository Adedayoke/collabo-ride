import { useTranslation } from '@collabo/i18n'
import { OctagonAlert } from 'lucide-react'

import { size } from '../../tokens/index.ts'
import styles from './field.module.css'

/** A field's hint, or its error with an icon and a screen reader prefix, so red is never alone. */
export function FieldMessage({
  id,
  hint,
  error,
}: {
  readonly id: string
  readonly hint?: string
  readonly error?: string
}) {
  const { t } = useTranslation()
  if (error) {
    return (
      <p id={id} className={styles.error}>
        <OctagonAlert size={size.icon.sm} strokeWidth={size.iconStroke} aria-hidden="true" />
        <span>
          <span className={styles.srOnly}>{t('field.errorPrefix')} </span>
          {error}
        </span>
      </p>
    )
  }
  return hint ? (
    <p id={id} className={styles.hint}>
      {hint}
    </p>
  ) : null
}
