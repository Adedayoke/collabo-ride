import { formatMoney, formatMoneyAmount, useTranslation } from '@collabo/i18n'
import { Minus, Plus, TriangleAlert } from 'lucide-react-native'
import { useState } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { haptics } from '../haptics.ts'
import { useTheme } from '../theme/use-theme.ts'
import { IconButton } from './icon-button.tsx'
import { parseNairaInput, stepPrice } from './price-value.ts'
import { Text } from './text.tsx'
import { TextField } from './text-field.tsx'

export type PriceInputProps = {
  readonly valueKobo: number
  readonly onChangeKobo: (kobo: number) => void
  /** The suggested minimum for this trip (#9, #12); below it, a warning shows. */
  readonly suggestedMinKobo: number
  /** How much each step button moves the price. */
  readonly stepKobo: number
  /** Defaults to "Your offer". */
  readonly label?: string
  readonly disabled?: boolean
  readonly style?: StyleProp<ViewStyle>
}

const asText = (kobo: number) => formatMoneyAmount(kobo)

/**
 * The rider's or driver's price in whole naira: a ₦ field with two labelled step buttons, the
 * suggested minimum under it, and a warning (icon plus words) when the price is below it.
 */
export function PriceInput({
  valueKobo,
  onChangeKobo,
  suggestedMinKobo,
  stepKobo,
  label,
  disabled = false,
  style,
}: PriceInputProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const [text, setText] = useState(() => asText(valueKobo))

  // Follow outside changes (the step buttons, a reset) without fighting the user's typing:
  // only a value the text doesn't already say rewrites it.
  const [synced, setSynced] = useState(valueKobo)
  if (valueKobo !== synced) {
    setSynced(valueKobo)
    if (parseNairaInput(text) !== valueKobo) setText(asText(valueKobo))
  }

  const below = valueKobo < suggestedMinKobo
  const step = (direction: 1 | -1) => {
    haptics.selection()
    onChangeKobo(stepPrice(valueKobo, stepKobo, direction))
  }

  return (
    <View style={[{ gap: theme.spacing.sm }, style]}>
      <TextField
        label={label ?? t('field.price')}
        hint={t('money.suggestedMinimum', { fare: formatMoney(suggestedMinKobo) })}
        value={text}
        onChangeText={(next) => {
          setText(next)
          const kobo = parseNairaInput(next)
          if (kobo !== null) onChangeKobo(kobo)
        }}
        onBlur={() => setText(asText(valueKobo))}
        keyboardType="number-pad"
        inputMode="numeric"
        disabled={disabled}
        accessibilityValue={{ text: t('money.spoken', { amount: asText(valueKobo) }) }}
        style={styles.field}
        prefix={
          <Text variant="title3" color="textSecondary" importantForAccessibility="no">
            {t('money.symbol')}
          </Text>
        }
        suffix={
          <View style={[styles.steps, { gap: theme.spacing.xs }]}>
            <IconButton
              icon={Minus}
              variant="tonal"
              label={t('money.lowerBy', { amount: asText(stepKobo) })}
              disabled={disabled || valueKobo <= 0}
              onPress={() => step(-1)}
            />
            <IconButton
              icon={Plus}
              variant="tonal"
              label={t('money.raiseBy', { amount: asText(stepKobo) })}
              disabled={disabled}
              onPress={() => step(1)}
            />
          </View>
        }
      />
      {below ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.warning,
            {
              gap: theme.spacing.sm,
              padding: theme.spacing.md,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.color.cautionSoft,
            },
          ]}
        >
          <TriangleAlert size={theme.size.icon.md} color={theme.color.caution} strokeWidth={theme.size.iconStroke} />
          <Text variant="footnote" style={styles.flex}>
            {t('money.belowSuggested', { fare: formatMoney(suggestedMinKobo) })}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { flexGrow: 1 },
  steps: { flexDirection: 'row', alignItems: 'center' },
  warning: { flexDirection: 'row', alignItems: 'flex-start', borderCurve: 'continuous' },
  flex: { flex: 1 },
})
