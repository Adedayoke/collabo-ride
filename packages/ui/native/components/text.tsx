import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native'

import type { ColorToken, TypeToken } from '../../tokens/index.ts'
import { useTheme } from '../theme/use-theme.ts'

export type TextProps = NativeTextProps & {
  /** A step of the type ramp. Never set `fontSize` directly. */
  readonly variant?: TypeToken
  readonly color?: ColorToken
}

/** Text in the brand font for the current locale, sized by the type ramp, scaling with the system. */
export function Text({ variant = 'body', color = 'text', style, maxFontSizeMultiplier, ...props }: TextProps) {
  const theme = useTheme()
  const capped = variant === 'price' ? theme.maxFontScale.price : undefined
  return (
    <NativeText
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? capped}
      style={[theme.text(variant), { color: theme.color[color] }, style]}
      {...props}
    />
  )
}
