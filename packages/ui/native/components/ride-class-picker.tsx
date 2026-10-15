import { formatMoney, useTranslation } from '@collabo/i18n'
import { CircleCheck } from 'lucide-react-native'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { haptics } from '../haptics.ts'
import { ComfortCar, EconomyCar, LuxuryCar, type IconComponent } from '../icons/index.tsx'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'
import type { RideClass } from './options.ts'

const classIcon: Record<RideClass, IconComponent> = { economy: EconomyCar, comfort: ComfortCar, luxury: LuxuryCar }

export type RideClassOption = {
  readonly rideClass: RideClass
  /** The suggested price for this trip in this class (#9). */
  readonly suggestedKobo: number
}

export type RideClassPickerProps = {
  readonly options: readonly RideClassOption[]
  readonly value: RideClass
  readonly onChange: (rideClass: RideClass) => void
  readonly style?: StyleProp<ViewStyle>
}

/** Economy, comfort, luxury as cards with icon, a line on what you get, and the suggested price. */
export function RideClassPicker({ options, value, onChange, style }: RideClassPickerProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('rideClass.title')}
      style={[{ gap: theme.spacing.sm }, style]}
    >
      {options.map(({ rideClass, suggestedKobo }) => {
        const selected = rideClass === value
        const Icon = classIcon[rideClass]
        const name = t(`rideClass.${rideClass}`)
        const body = t(`rideClass.${rideClass}Body`)
        const suggested = t('rideClass.suggested', { fare: formatMoney(suggestedKobo) })
        return (
          <Pressable
            key={rideClass}
            accessibilityRole="radio"
            accessibilityLabel={`${name}, ${body}, ${suggested}`}
            accessibilityState={{ checked: selected }}
            onPress={() => {
              if (selected) return
              haptics.selection()
              onChange(rideClass)
            }}
            style={({ pressed }) => [
              styles.card,
              {
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.radius.lg,
                borderWidth: selected ? theme.size.focusRing.width : 1,
                borderColor: selected ? theme.color.primary : theme.color.border,
                backgroundColor: selected
                  ? theme.color.primarySoft
                  : pressed
                    ? theme.color.surfaceSunken
                    : theme.color.surface,
              },
            ]}
          >
            <View
              style={[
                styles.icon,
                {
                  width: theme.size.avatar.lg,
                  height: theme.size.avatar.lg,
                  borderRadius: theme.radius.md,
                  backgroundColor: selected ? theme.color.surface : theme.color.surfaceSunken,
                },
              ]}
            >
              <Icon size={theme.size.icon.xl} color={selected ? theme.color.primary : theme.color.text} />
            </View>
            <View style={[styles.text, { gap: theme.spacing.xxs }]}>
              <Text variant="headline">{name}</Text>
              <Text variant="footnote" color="textSecondary">
                {body}
              </Text>
            </View>
            <View style={[styles.end, { gap: theme.spacing.xxs }]}>
              <Text variant="priceSm">{formatMoney(suggestedKobo)}</Text>
              {selected ? (
                <CircleCheck
                  size={theme.size.icon.md}
                  color={theme.color.primary}
                  strokeWidth={theme.size.iconStroke}
                />
              ) : null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderCurve: 'continuous' },
  icon: { alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' },
  text: { flex: 1 },
  end: { alignItems: 'flex-end' },
})
