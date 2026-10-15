import { useTranslation } from '@collabo/i18n'
import { useRef, type RefObject } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'

import { useFocusOnMount, useReturnFocus } from '../a11y/announce.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Button } from './button.tsx'
import { Text } from './text.tsx'

export type DialogProps = {
  readonly visible: boolean
  /** A short question: "Cancel this trip?". Translated. */
  readonly title: string
  /** What happens if they confirm. Translated. */
  readonly message?: string
  readonly confirmLabel: string
  readonly onConfirm: () => void
  /** Defaults to "Cancel". */
  readonly cancelLabel?: string
  readonly onCancel: () => void
  /** A destructive confirm uses the danger button. */
  readonly destructive?: boolean
  readonly loading?: boolean
  /** The control that opened the dialog; focus returns to it on close. */
  readonly returnFocusTo?: RefObject<View | null>
}

/**
 * Confirmations only (pickers use sheets). Focus moves to the title on open and back to the
 * opener on close; the Android back button and a tap on the scrim cancel.
 */
export function Dialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  destructive = false,
  loading = false,
  returnFocusTo,
}: DialogProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const titleRef = useRef<View>(null)
  useFocusOnMount(titleRef, visible)
  useReturnFocus(visible, returnFocusTo)

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={[styles.center, { backgroundColor: theme.color.scrim, padding: theme.spacing.xl }]}>
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          style={StyleSheet.absoluteFill}
          onPress={loading ? undefined : onCancel}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            {
              maxWidth: theme.size.dialogMaxWidth,
              backgroundColor: theme.color.surfaceRaised,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.xl,
              gap: theme.spacing.lg,
              boxShadow: theme.elevation.overlay,
            },
          ]}
        >
          <View style={{ gap: theme.spacing.sm }}>
            <View ref={titleRef} accessible accessibilityRole="header">
              <Text variant="title3">{title}</Text>
            </View>
            {message ? (
              <Text variant="callout" color="textSecondary">
                {message}
              </Text>
            ) : null}
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <Button
              title={confirmLabel}
              variant={destructive ? 'destructive' : 'primary'}
              loading={loading}
              onPress={onConfirm}
            />
            <Button title={cancelLabel ?? t('action.cancel')} variant="ghost" disabled={loading} onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dialog: { width: '100%', borderCurve: 'continuous' },
})
