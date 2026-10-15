import { useId, type InputHTMLAttributes } from 'react'

import styles from './field.module.css'
import { FieldMessage } from './field-message.tsx'

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  /** Translated; always visible, never only a placeholder. */
  readonly label: string
  /** Translated help under the field. */
  readonly hint?: string
  /** Translated error; replaces the hint and marks the field invalid. */
  readonly error?: string
}

/** A labelled text input whose hint or error is tied to it with `aria-describedby`. */
export function TextField({ label, hint, error, className, ...props }: TextFieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const hasMessage = Boolean(error ?? hint)
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        className={styles.control}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        {...props}
      />
      <FieldMessage id={messageId} hint={hint} error={error} />
    </div>
  )
}
