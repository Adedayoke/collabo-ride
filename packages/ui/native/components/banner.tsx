import { useTranslation } from '@collabo/i18n'
import { X } from 'lucide-react-native'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import { enterUp, fadeOut } from '../motion/presets.ts'
import { useReduceMotion } from '../motion/use-reduce-motion.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'
import { toneStyle } from './tone.ts'
import type { BannerTone } from './options.ts'

export type BannerProps = {
  readonly tone: BannerTone
  /** Optional bold first line. Translated. */
  readonly title?: string
  /** What happened and what happens next. Translated. */
  readonly message: string
  /** A follow up action, such as "Try again". */
  readonly action?: { readonly label: string; readonly onPress: () => void }
  readonly onDismiss?: () => void
  readonly style?: StyleProp<ViewStyle>
}

/** An inline notice with its tone's icon and word, announced when it appears. */
export function Banner({ tone, title, message, action, onDismiss, style }: BannerProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const reduced = useReduceMotion()
  const { fg, bg, icon: Icon } = toneStyle[tone]
  return (
    <Animated.View
      entering={enterUp(reduced)}
      exiting={fadeOut}
      accessibilityRole={tone === 'info' ? undefined : 'alert'}
      accessibilityLiveRegion={tone === 'info' ? 'polite' : 'assertive'}
      style={[
        styles.banner,
        {
          backgroundColor: theme.color[bg],
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          gap: theme.spacing.md,
        },
        style,
      ]}
    >
      <Icon size={theme.size.icon.lg} color={theme.color[fg]} strokeWidth={theme.size.iconStroke} />
      <View style={[styles.body, { gap: theme.spacing.xs }]}>
        <Text variant="subhead" color={fg}>
          {title ?? t(`status.${tone}`)}
        </Text>
        <Text variant="callout">{message}</Text>
        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.action,
              { opacity: pressed ? theme.opacity.pressed : 1, minHeight: theme.size.touchTarget },
            ]}
          >
            <Text variant="headline" color={fg}>
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('action.dismiss')}
          onPress={onDismiss}
          hitSlop={theme.spacing.lg}
          style={({ pressed }) => ({ opacity: pressed ? theme.opacity.pressed : 1 })}
        >
          <X size={theme.size.icon.md} color={theme.color.text} strokeWidth={theme.size.iconStroke} />
        </Pressable>
      ) : null}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'flex-start', borderCurve: 'continuous' },
  body: { flex: 1 },
  action: { alignSelf: 'flex-start', justifyContent: 'center' },
})
