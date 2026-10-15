import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { haptics } from '../haptics.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type Segment<T extends string> = {
  readonly value: T
  /** Translated. */
  readonly label: string
}

export type SegmentedControlProps<T extends string> = {
  /** Names the control for screen readers. Translated. */
  readonly label: string
  readonly segments: readonly Segment<T>[]
  readonly value: T
  readonly onChange: (value: T) => void
  readonly style?: StyleProp<ViewStyle>
}

/**
 * Two to four peers, one selected. The selection moves instantly: it changes many times a
 * session, so it does not animate. Labels wrap at large text instead of truncating.
 */
export function SegmentedControl<T extends string>({
  label,
  segments,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme()
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[
        styles.track,
        {
          backgroundColor: theme.color.surfaceSunken,
          borderRadius: theme.radius.md,
          padding: theme.spacing.xxs,
          gap: theme.spacing.xxs,
        },
        style,
      ]}
    >
      {segments.map((segment) => {
        const selected = segment.value === value
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="radio"
            accessibilityLabel={segment.label}
            accessibilityState={{ checked: selected }}
            onPress={() => {
              if (selected) return
              haptics.selection()
              onChange(segment.value)
            }}
            style={({ pressed }) => [
              styles.segment,
              {
                minHeight: theme.size.touchTarget - theme.spacing.xs,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.radius.sm,
                backgroundColor: selected ? theme.color.surface : pressed ? theme.color.pressedOverlay : 'transparent',
                boxShadow: selected ? theme.elevation.card : undefined,
              },
            ]}
          >
            <Text
              variant={selected ? 'headline' : 'subhead'}
              color={selected ? 'text' : 'textSecondary'}
              style={styles.label}
            >
              {segment.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderCurve: 'continuous' },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' },
  label: { textAlign: 'center' },
})
