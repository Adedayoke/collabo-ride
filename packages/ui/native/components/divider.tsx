import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { useTheme } from '../theme/use-theme.ts'

export type DividerProps = {
  /** Indent from the start edge, to line up with list text after a leading icon. */
  readonly inset?: number
  readonly style?: StyleProp<ViewStyle>
}

/** A decorative hairline. Hidden from screen readers. */
export function Divider({ inset = 0, style }: DividerProps) {
  const theme = useTheme()
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[{ height: StyleSheet.hairlineWidth, backgroundColor: theme.color.border, marginStart: inset }, style]}
    />
  )
}
