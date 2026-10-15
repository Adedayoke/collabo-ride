// The console's one toast slot, bottom right. `Toast.show` from anywhere; `ToastHost` (mounted
// by `PageShell`) renders it with Radix, which announces it politely and pauses on hover.

import { useTranslation } from '@collabo/i18n'
import * as RadixToast from '@radix-ui/react-toast'
import { X } from 'lucide-react'

import { size, toastDuration } from '../../tokens/index.ts'
import { IconButton } from './icon-button.tsx'
import { Toast, useCurrentToast } from './toast-store.ts'
import tone from './tone.module.css'
import { toneIcon } from './tone.ts'
import styles from './toast.module.css'

export function ToastHost() {
  const { t } = useTranslation()
  const toast = useCurrentToast()
  const kind = toast?.tone ?? 'success'
  const Icon = toneIcon[kind]
  return (
    <RadixToast.Provider label={t('toast.region')}>
      {toast ? (
        <RadixToast.Root
          key={toast.id}
          className={styles.toast}
          duration={toast.action ? toastDuration.withAction : toastDuration.default}
          onOpenChange={(open) => {
            if (!open) Toast.hide()
          }}
        >
          <span className={`${styles.icon} ${tone[kind]}`}>
            <Icon size={size.icon.md} strokeWidth={size.iconStroke} aria-hidden="true" />
          </span>
          <RadixToast.Description className={styles.message}>{toast.message}</RadixToast.Description>
          {toast.action ? (
            <RadixToast.Action altText={toast.action.label} className={styles.action} onClick={toast.action.onSelect}>
              {toast.action.label}
            </RadixToast.Action>
          ) : null}
          <RadixToast.Close asChild>
            <IconButton icon={X} label={t('action.dismiss')} size="sm" />
          </RadixToast.Close>
        </RadixToast.Root>
      ) : null}
      <RadixToast.Viewport className={styles.viewport} />
    </RadixToast.Provider>
  )
}
