import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import { pressScale } from '../../tokens/index.ts'
import type { IconComponent } from '../icons/index.tsx'
import { useTheme } from '../theme/use-theme.ts'

export type MapControlButtonProps = {
  readonly icon: IconComponent
  /** Translated, such as "Centre on my location". */
  readonly label: string
  readonly onPress: () => void
  /** A toggled control, such as the layers panel open. */
  readonly active?: boolean
  readonly testID?: string
  readonly style?: StyleProp<ViewStyle>
}

/** A floating round control over the map (recentre, layers), raised so it reads on any map tile. */
export function MapControlButton({ icon: Icon, label, onPress, active = false, testID, style }: MapControlButtonProps) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        {
          width: theme.size.touchTarget,
          height: theme.size.touchTarget,
          borderRadius: theme.radius.full,
          zIndex: theme.zIndex.mapControls,
          backgroundColor: active ? theme.color.primarySoft : theme.color.surfaceRaised,
          boxShadow: theme.elevation.raised,
          transform: [{ scale: pressed ? pressScale : 1 }],
        },
        style,
      ]}
    >
      <Icon
        size={theme.size.icon.lg}
        color={active ? theme.color.primary : theme.color.text}
        strokeWidth={theme.size.iconStroke}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
})
