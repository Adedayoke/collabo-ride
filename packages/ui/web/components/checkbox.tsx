import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { useId } from 'react'

import { size } from '../../tokens/index.ts'
import styles from './checkbox.module.css'
import focus from './focus.module.css'

export type CheckboxProps = {
  /** Translated. */
  readonly label: string
  readonly checked: boolean | 'indeterminate'
  readonly onCheckedChange: (checked: boolean) => void
  readonly disabled?: boolean
}

/** A Radix checkbox with its label; the whole row is the 48 px target. */
export function Checkbox({ label, checked, onCheckedChange, disabled = false }: CheckboxProps) {
  const id = useId()
  return (
    <div className={styles.row}>
      <RadixCheckbox.Root
        id={id}
        className={`${styles.box} ${focus.ring}`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      >
        <RadixCheckbox.Indicator className={styles.indicator}>
          {checked === 'indeterminate' ? (
            <Minus size={size.icon.sm} strokeWidth={size.iconStroke + 1} aria-hidden="true" />
          ) : (
            <Check size={size.icon.sm} strokeWidth={size.iconStroke + 1} aria-hidden="true" />
          )}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
    </div>
  )
}
