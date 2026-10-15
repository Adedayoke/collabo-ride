import { initials } from '@collabo/i18n'
import { useState } from 'react'
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import type { TypeToken } from '../../tokens/index.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const initialsType: Record<AvatarSize, TypeToken> = {
  xs: 'caption',
  sm: 'caption',
  md: 'subhead',
  lg: 'title3',
  xl: 'title1',
}

export type AvatarProps = {
  /** The person's name: the accessibility label, and the source of the initials. */
  readonly name: string
  readonly photoUri?: string | null
  readonly size?: AvatarSize
  /** Hide from screen readers when the name is already read nearby (a driver card). */
  readonly decorative?: boolean
  readonly style?: StyleProp<ViewStyle>
}

/** A photo, or initials from up to two words when there is no photo or it fails to load. */
export function Avatar({ name, photoUri, size = 'md', decorative = false, style }: AvatarProps) {
  const theme = useTheme()
  const [failed, setFailed] = useState(false)
  const px = theme.size.avatar[size]
  const showPhoto = Boolean(photoUri) && !failed
  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : name}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      style={[
        styles.avatar,
        { width: px, height: px, borderRadius: theme.radius.full, backgroundColor: theme.color.primarySoft },
        style,
      ]}
    >
      {showPhoto && photoUri ? (
        <Image source={{ uri: photoUri }} onError={() => setFailed(true)} style={StyleSheet.absoluteFill} />
      ) : (
        <Text variant={initialsType[size]} color="primary" maxFontSizeMultiplier={1} numberOfLines={1}>
          {initials(name)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
})
