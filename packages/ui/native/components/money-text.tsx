import { formatMoney, formatMoneyAmount, useTranslation } from '@collabo/i18n'

import type { ColorToken } from '../../tokens/index.ts'
import { Text, type TextProps } from './text.tsx'

export type MoneyTextProps = Omit<TextProps, 'variant' | 'children' | 'color'> & {
  /** Integer kobo, as the API sends it. */
  readonly kobo: number
  /** `lg` is the main price on offers and the fare; `md` is prices in lists. */
  readonly size?: 'lg' | 'md' | 'sm'
  /** The old fare in the Collabo savings reveal. */
  readonly strikethrough?: boolean
  readonly color?: ColorToken
}

const sizeVariant = { lg: 'price', md: 'priceSm', sm: 'subhead' } as const

/** Money from integer kobo: `₦1,500`, or `₦1,250.50` with kobo. Read aloud as "1,500 naira". */
export function MoneyText({
  kobo,
  size = 'md',
  strikethrough = false,
  color = 'text',
  style,
  ...props
}: MoneyTextProps) {
  const { t } = useTranslation()
  return (
    <Text
      variant={sizeVariant[size]}
      color={strikethrough ? 'textSecondary' : color}
      accessibilityLabel={t('money.spoken', { amount: formatMoneyAmount(kobo) })}
      style={[
        size === 'sm' ? { fontVariant: ['tabular-nums'] } : null,
        strikethrough ? { textDecorationLine: 'line-through' } : null,
        style,
      ]}
      {...props}
    >
      {formatMoney(kobo)}
    </Text>
  )
}
