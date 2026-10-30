import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'

import { useTheme } from '../theme/use-theme.ts'

export type ScreenProps = {
  /** Scroll the content. Most screens do, so text at 200% never clips. */
  readonly scroll?: boolean
  /** Safe area edges to pad. A screen under a stack header usually leaves out `top`. */
  readonly edges?: readonly Edge[]
  readonly style?: StyleProp<ViewStyle>
  readonly children: ReactNode
}

/** A screen: safe area, the `bg` color, edge padding, and a max width on tablets. */
export function Screen({ scroll = true, edges = ['top', 'bottom', 'left', 'right'], style, children }: ScreenProps) {
  const theme = useTheme()
  const content = [
    styles.content,
    { paddingHorizontal: theme.screenPadding, gap: theme.spacing.lg, maxWidth: theme.size.contentMaxWidth.native },
    style,
  ]
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: theme.color.bg }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[content, { paddingVertical: theme.spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, content]}>{children}</View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { width: '100%', alignSelf: 'center' },
})
