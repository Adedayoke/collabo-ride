import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native'

import { useTheme } from '../theme/use-theme.ts'

export type CardProps = Omit<ViewProps, 'style'> & {
  /** `lg` is for offer and driver cards; everything else is `md`. */
  readonly size?: 'md' | 'lg'
  readonly style?: StyleProp<ViewStyle>
  readonly children: ReactNode
}

/**
 * A surface for one self contained thing. In light mode it carries a hairline as well as the
 * `card` shadow, because the two whites are hard to tell apart in sunlight. In dark mode the
 * surface steps lighter instead.
 */
export function Card({ size = 'md', style, children, ...props }: CardProps) {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.color.surface,
          borderColor: theme.color.border,
          borderWidth: theme.mode === 'light' ? StyleSheet.hairlineWidth : 0,
          borderRadius: size === 'lg' ? theme.radius.lg : theme.radius.md,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          boxShadow: theme.elevation.card,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderCurve: 'continuous' },
})
