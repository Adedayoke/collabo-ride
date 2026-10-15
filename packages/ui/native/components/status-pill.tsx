import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import type { IconComponent } from '../icons/index.tsx'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'
import { toneStyle, type Tone } from './tone.ts'

export type StatusPillProps = {
  readonly tone: Tone
  /** The state in words ("Driver arriving", "Paid"). Translated. */
  readonly label: string
  /** Overrides the tone's icon, such as a car for "Driver arriving". The shape still has to differ by meaning. */
  readonly icon?: IconComponent
  readonly style?: StyleProp<ViewStyle>
}

/** A trip or payment state: icon plus word, never color alone. */
export function StatusPill({ tone, label, icon, style }: StatusPillProps) {
  const theme = useTheme()
  const { fg, bg, icon: toneIcon } = toneStyle[tone]
  const Icon = icon ?? toneIcon
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        styles.pill,
        {
          backgroundColor: theme.color[bg],
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          gap: theme.spacing.xs,
        },
        style,
      ]}
    >
      <Icon size={theme.size.icon.sm} color={theme.color[fg]} strokeWidth={theme.size.iconStroke} />
      <Text variant="caption" color={fg}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
})
