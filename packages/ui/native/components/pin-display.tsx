import { useTranslation } from '@collabo/i18n'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type PinDisplayProps = {
  /** The 4 digit trip PIN. Never logged, never sent to analytics or crash reports. */
  readonly pin: string
  readonly style?: StyleProp<ViewStyle>
}

/**
 * The trip PIN in four large cells, readable from arm's length through a car window. Text grows
 * with the system up to 1.5 times. Screen readers read it digit by digit.
 */
export function PinDisplay({ pin, style }: PinDisplayProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const digits = pin.split('')
  return (
    <View style={[{ gap: theme.spacing.sm }, style]}>
      <Text variant="subhead" color="textSecondary" importantForAccessibility="no">
        {t('pin.title')}
      </Text>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={t('pin.label', { digits: digits.join(' ') })}
        accessibilityHint={t('pin.hint')}
        style={[styles.cells, { gap: theme.spacing.sm }]}
      >
        {digits.map((digit, index) => (
          <View
            key={index}
            style={[
              styles.cell,
              {
                minWidth: theme.size.button.lg,
                minHeight: theme.size.button.lg + theme.spacing.lg,
                borderRadius: theme.radius.md,
                backgroundColor: theme.color.primarySoft,
                paddingHorizontal: theme.spacing.sm,
              },
            ]}
          >
            <Text variant="display" color="primary" maxFontSizeMultiplier={theme.maxFontScale.pin} style={styles.digit}>
              {digit}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="footnote" color="textSecondary" importantForAccessibility="no">
        {t('pin.hint')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  cells: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' },
  digit: { fontVariant: ['tabular-nums'] },
})
