import { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { toastDuration } from '../../tokens/index.ts'
import { announce } from '../a11y/announce.ts'
import { enterDown, fadeOut } from '../motion/presets.ts'
import { useReduceMotion } from '../motion/use-reduce-motion.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'
import { Toast, useToastStore } from './toast-store.ts'
import { toneStyle } from './tone.ts'

/** Renders the current toast. `AppRoot` mounts one; nothing else should. */
export function ToastHost() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const reduced = useReduceMotion()
  const toast = useToastStore((state) => state.current)

  useEffect(() => {
    if (!toast) return
    announce(toast.message)
    const timer = setTimeout(
      () => {
        if (useToastStore.getState().current?.id === toast.id) Toast.hide()
      },
      toast.action ? toastDuration.withAction : toastDuration.default,
    )
    return () => clearTimeout(timer)
  }, [toast])

  if (!toast) return null
  const { fg, icon: Icon } = toneStyle[toast.tone ?? 'success']
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.layer,
        {
          zIndex: theme.zIndex.toast,
          paddingTop: insets.top + theme.spacing.sm,
          paddingHorizontal: theme.screenPadding,
        },
      ]}
    >
      <Animated.View
        key={toast.id}
        entering={enterDown(reduced)}
        exiting={fadeOut}
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          {
            maxWidth: theme.size.contentMaxWidth.native,
            backgroundColor: theme.color.surfaceRaised,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            gap: theme.spacing.md,
            boxShadow: theme.elevation.raised,
            borderColor: theme.color.border,
            borderWidth: theme.mode === 'light' ? StyleSheet.hairlineWidth : 0,
          },
        ]}
      >
        <Icon size={theme.size.icon.lg} color={theme.color[fg]} strokeWidth={theme.size.iconStroke} />
        <Text variant="callout" style={styles.message}>
          {toast.message}
        </Text>
        {toast.action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={toast.action.label}
            onPress={() => {
              toast.action?.onPress()
              Toast.hide()
            }}
            style={({ pressed }) => [
              styles.action,
              { minHeight: theme.size.touchTarget, opacity: pressed ? theme.opacity.pressed : 1 },
            ]}
          >
            <Text variant="headline" color="primary">
              {toast.action.label}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, start: 0, end: 0, alignItems: 'center' },
  toast: { width: '100%', flexDirection: 'row', alignItems: 'center', borderCurve: 'continuous' },
  message: { flex: 1 },
  action: { justifyContent: 'center' },
})
