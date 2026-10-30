import { formatDistanceKm } from '@collabo/i18n'
import { Clock, MapPin } from 'lucide-react-native'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { useLocale } from '../theme/use-locale.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type AddressSearchRowProps = {
  /** The place name ("Ikeja City Mall"), from the places provider. */
  readonly name: string
  /** The street address under it. */
  readonly address?: string
  /** Distance from the rider, when known. */
  readonly distanceKm?: number
  /** A recent or saved place shows a clock instead of a pin. */
  readonly recent?: boolean
  readonly onPress: () => void
  readonly testID?: string
  readonly style?: StyleProp<ViewStyle>
}

/** One place result when picking a pickup or drop off. The whole row is one button. */
export function AddressSearchRow({
  name,
  address,
  distanceKm,
  recent = false,
  onPress,
  testID,
  style,
}: AddressSearchRowProps) {
  const theme = useTheme()
  const locale = useLocale()
  const Icon = recent ? Clock : MapPin
  const distance = distanceKm === undefined ? undefined : formatDistanceKm(distanceKm, locale)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[name, address, distance].filter(Boolean).join(', ')}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: theme.size.touchTarget + theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
          backgroundColor: pressed ? theme.color.pressedOverlay : 'transparent',
        },
        style,
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            width: theme.size.avatar.md,
            height: theme.size.avatar.md,
            borderRadius: theme.radius.full,
            backgroundColor: theme.color.surfaceSunken,
          },
        ]}
      >
        <Icon size={theme.size.icon.md} color={theme.color.textSecondary} strokeWidth={theme.size.iconStroke} />
      </View>
      <View style={[styles.text, { gap: theme.spacing.xxs }]}>
        <Text variant="headline" numberOfLines={2}>
          {name}
        </Text>
        {address ? (
          <Text variant="subhead" color="textSecondary" numberOfLines={2}>
            {address}
          </Text>
        ) : null}
      </View>
      {distance ? (
        <Text variant="footnote" color="textSecondary">
          {distance}
        </Text>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
})
