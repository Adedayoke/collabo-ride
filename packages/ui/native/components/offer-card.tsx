import { etaMinutes, formatMoney, formatRating, formatShortName, useTranslation } from '@collabo/i18n'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import { enterUp, fadeOut } from '../motion/presets.ts'
import { useReduceMotion } from '../motion/use-reduce-motion.ts'
import { useLocale } from '../theme/use-locale.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Avatar } from './avatar.tsx'
import { Button } from './button.tsx'
import { CollaboBadge } from './collabo-badge.tsx'
import { CountdownRing } from './countdown-ring.tsx'
import { MoneyText } from './money-text.tsx'
import { RatingStars } from './rating-stars.tsx'
import { Text } from './text.tsx'

export type OfferSummary = {
  readonly driverName: string
  readonly photoUri?: string | null
  readonly rating: number
  readonly car: string
  readonly priceKobo: number
  /** Driver's time to pickup. */
  readonly etaSeconds: number
  /** A Collabo offer: the trip is shared. */
  readonly collabo?: boolean
  /** When the offer lapses (epoch ms), with its whole window, to show the countdown. */
  readonly expiry?: { readonly deadline: number; readonly totalSeconds: number }
}

export type OfferCardProps = {
  readonly offer: OfferSummary
  readonly onAccept: () => void
  readonly onDecline: () => void
  /** Slide in when it arrives in the list. Leave off for offers already shown. */
  readonly animateIn?: boolean
  readonly accepting?: boolean
  readonly onExpire?: () => void
  readonly style?: StyleProp<ViewStyle>
}

/**
 * A driver's offer: who, how far, and the price, with accept and decline. The summary is one
 * element for screen readers ("Tunde A., rated 4.8, Toyota Corolla, offers 1,500 naira, 3 min
 * away"), followed by its two actions.
 */
export function OfferCard({
  offer,
  onAccept,
  onDecline,
  animateIn = false,
  accepting = false,
  onExpire,
  style,
}: OfferCardProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const locale = useLocale()
  const reduced = useReduceMotion()
  const name = formatShortName(offer.driverName)
  const minutes = etaMinutes(offer.etaSeconds)
  const eta = minutes === 0 ? t('offer.arriving') : t('offer.eta', { minutes })

  return (
    <Animated.View
      entering={animateIn ? enterUp(reduced) : undefined}
      exiting={fadeOut}
      style={[
        styles.card,
        {
          backgroundColor: offer.collabo ? theme.color.collaboSoft : theme.color.surface,
          borderColor: offer.collabo ? theme.color.collabo : theme.color.border,
          borderWidth: offer.collabo ? 1 : theme.mode === 'light' ? StyleSheet.hairlineWidth : 0,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          boxShadow: theme.elevation.card,
        },
        style,
      ]}
    >
      <View
        accessible
        accessibilityLabel={t('offer.label', {
          name,
          rating: formatRating(offer.rating, locale),
          car: offer.car,
          fare: formatMoney(offer.priceKobo),
          eta,
        })}
        style={[styles.row, { gap: theme.spacing.md }]}
      >
        <Avatar name={offer.driverName} photoUri={offer.photoUri} size="md" decorative />
        <View style={[styles.flex, { gap: theme.spacing.xxs }]}>
          <View style={[styles.row, styles.wrap, { gap: theme.spacing.sm }]}>
            <Text variant="headline">{name}</Text>
            <RatingStars mode="display" value={offer.rating} />
          </View>
          <Text variant="subhead" color="textSecondary">
            {offer.car}
          </Text>
          {offer.collabo ? <CollaboBadge style={{ marginTop: theme.spacing.xs }} /> : null}
        </View>
        <View style={[styles.end, { gap: theme.spacing.xxs }]}>
          <MoneyText kobo={offer.priceKobo} size="lg" />
          <Text variant="footnote" color="textSecondary">
            {eta}
          </Text>
        </View>
      </View>
      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        {offer.expiry ? (
          <CountdownRing
            deadline={offer.expiry.deadline}
            totalSeconds={offer.expiry.totalSeconds}
            onExpire={onExpire}
          />
        ) : null}
        <Button
          variant="secondary"
          title={t('action.decline')}
          disabled={accepting}
          onPress={onDecline}
          style={styles.flex}
        />
        <Button title={t('action.accept')} loading={accepting} onPress={onAccept} style={styles.flex} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: { borderCurve: 'continuous' },
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  flex: { flex: 1 },
  end: { alignItems: 'flex-end' },
})
