import { useTranslation } from '@collabo/i18n'
import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { useId } from 'react'

import { size } from '../../tokens/index.ts'
import { FieldMessage } from './field-message.tsx'
import styles from './field.module.css'
import menu from './menu.module.css'

export type SelectOption<T extends string> = {
  readonly value: T
  /** Translated. */
  readonly label: string
}

export type SelectProps<T extends string> = {
  /** Translated. */
  readonly label: string
  readonly options: readonly SelectOption<T>[]
  readonly value: T | undefined
  readonly onChange: (value: T) => void
  /** Translated; defaults to "Choose one". */
  readonly placeholder?: string
  readonly hint?: string
  readonly error?: string
  readonly disabled?: boolean
}

/** A Radix select with a visible label, keyboard and type ahead support, and the field's hint or error. */
export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder,
  hint,
  error,
  disabled = false,
}: SelectProps<T>) {
  const { t } = useTranslation()
  const id = useId()
  const messageId = `${id}-message`
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <RadixSelect.Root
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          const option = options.find((candidate) => candidate.value === next)
          if (option) onChange(option.value)
        }}
      >
        <RadixSelect.Trigger
          id={id}
          className={`${styles.control} ${menu.trigger}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
        >
          <RadixSelect.Value placeholder={placeholder ?? t('field.select')} />
          <RadixSelect.Icon>
            <ChevronDown size={size.icon.md} strokeWidth={size.iconStroke} aria-hidden="true" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className={menu.content} position="popper" sideOffset={4}>
            <RadixSelect.Viewport>
              {options.map((option) => (
                <RadixSelect.Item key={option.value} value={option.value} className={menu.item}>
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className={menu.indicator}>
                    <Check size={size.icon.md} strokeWidth={size.iconStroke} aria-hidden="true" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      <FieldMessage id={messageId} hint={hint} error={error} />
    </div>
  )
}
