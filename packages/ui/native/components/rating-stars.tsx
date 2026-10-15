import { formatRating, useTranslation } from '@collabo/i18n'
import { Star } from 'lucide-react-native'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { haptics } from '../haptics.ts'
import { useLocale } from '../theme/use-locale.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

const stars = [1, 2, 3, 4, 5] as const

export type RatingStarsProps =
  | {
      /** Show a rating: one star and the number ("★ 4.8"), read as "Rated 4.8 out of 5". */
      readonly mode: 'display'
      readonly value: number
      readonly style?: StyleProp<ViewStyle>
    }
  | {
      /** Ask for a rating: five 48 point stars, each a radio. */
      readonly mode: 'input'
      readonly value: number
      readonly onChange: (stars: number) => void
      /** What is being rated ("Rate your trip"). Translated. */
      readonly label: string
      readonly style?: StyleProp<ViewStyle>
    }

export function RatingStars(props: RatingStarsProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const locale = useLocale()

  if (props.mode === 'display') {
    const formatted = formatRating(props.value, locale)
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={t('rating.value', { rating: formatted })}
        style={[styles.row, { gap: theme.spacing.xxs }, props.style]}
      >
        <Star
          size={theme.size.icon.sm}
          color={theme.color.primary}
          fill={theme.color.primary}
          strokeWidth={theme.size.iconStroke}
        />
        <Text variant="subhead" style={styles.tabular}>
          {formatted}
        </Text>
      </View>
    )
  }

  const { value, onChange, label, style } = props
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.row, style]}>
      {stars.map((count) => {
        const filled = count <= value
        return (
          <Pressable
            key={count}
            accessibilityRole="radio"
            accessibilityLabel={t('rating.input', { stars: count })}
            accessibilityState={{ checked: count === value }}
            onPress={() => {
              haptics.selection()
              onChange(count)
            }}
            style={({ pressed }) => [
              styles.star,
              {
                width: theme.size.touchTarget,
                height: theme.size.touchTarget,
                borderRadius: theme.radius.full,
                backgroundColor: pressed ? theme.color.pressedOverlay : 'transparent',
              },
            ]}
          >
            <Star
              size={theme.size.icon.xl}
              color={filled ? theme.color.primary : theme.color.borderStrong}
              fill={filled ? theme.color.primary : 'transparent'}
              strokeWidth={theme.size.iconStroke}
            />
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { alignItems: 'center', justifyContent: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
})
