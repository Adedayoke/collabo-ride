import { useTranslation } from '@collabo/i18n'
import { WifiOff } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { enterDown, fadeOut } from '../motion/presets.ts'
import { useReduceMotion } from '../motion/use-reduce-motion.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type OfflineBannerProps = {
  /** From the app's connection state. The banner shows only while offline. */
  readonly offline: boolean
}

/** A slim strip under the header while the device is offline, announced once when it appears. */
export function OfflineBanner({ offline }: OfflineBannerProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const reduced = useReduceMotion()
  if (!offline) return null
  return (
    <Animated.View
      entering={enterDown(reduced)}
      exiting={fadeOut}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.strip,
        {
          backgroundColor: theme.color.cautionSoft,
          paddingHorizontal: theme.screenPadding,
          paddingVertical: theme.spacing.sm,
          gap: theme.spacing.sm,
          zIndex: theme.zIndex.sticky,
        },
      ]}
    >
      <WifiOff size={theme.size.icon.md} color={theme.color.caution} strokeWidth={theme.size.iconStroke} />
      <View style={styles.text}>
        <Text variant="subhead" color="caution">
          {t('state.offlineTitle')}
        </Text>
        <Text variant="footnote">{t('state.offline')}</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1 },
})
