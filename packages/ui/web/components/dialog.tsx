import { useTranslation } from '@collabo/i18n'
import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { Button } from './button.tsx'
import styles from './dialog.module.css'
import { IconButton } from './icon-button.tsx'

export type DialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Translated. Names the dialog for screen readers. */
  readonly title: string
  /** Translated: what happens if you confirm. */
  readonly message: string
  readonly confirmLabel: string
  readonly cancelLabel?: string
  readonly onConfirm: () => void
  readonly destructive?: boolean
  /** Shows the confirm button busy while the action runs. */
  readonly loading?: boolean
}

/**
 * A confirmation dialog (pickers and forms use pages or sheets). Radix traps focus, closes on
 * Escape, and returns focus to the control that opened it.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
  loading = false,
}: DialogProps) {
  const { t } = useTranslation()
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.scrim} />
        <RadixDialog.Content className={styles.dialog}>
          <div className={styles.header}>
            <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton icon={X} label={t('action.close')} size="sm" />
            </RadixDialog.Close>
          </div>
          <RadixDialog.Description className={styles.message}>{message}</RadixDialog.Description>
          <div className={styles.actions}>
            <RadixDialog.Close asChild>
              <Button variant="ghost" disabled={loading}>
                {cancelLabel ?? t('action.cancel')}
              </Button>
            </RadixDialog.Close>
            <Button variant={destructive ? 'destructive' : 'primary'} loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
