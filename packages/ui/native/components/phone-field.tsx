import { useTranslation } from '@collabo/i18n'
import { forwardRef, useState } from 'react'
import { StyleSheet, View, type TextInput } from 'react-native'

import { useTheme } from '../theme/use-theme.ts'
import { parsePhoneInput, phoneInputFromE164 } from './phone-input.ts'
import { Text } from './text.tsx'
import { TextField, type TextFieldProps } from './text-field.tsx'

export type PhoneFieldProps = Omit<
  TextFieldProps,
  'label' | 'value' | 'onChangeText' | 'prefix' | 'keyboardType' | 'textContentType' | 'autoComplete'
> & {
  /** Defaults to the catalog's "Phone number". */
  readonly label?: string
  /** A saved number to start from. */
  readonly initialE164?: string | null
  /** Called on every change: E.164 once the number is complete, else null. */
  readonly onChangeE164: (e164: string | null) => void
}

/** A Nigerian mobile number: fixed +234 prefix, grouped as typed, E.164 out. */
export const PhoneField = forwardRef<TextInput, PhoneFieldProps>(function PhoneField(
  { label, hint, initialE164, onChangeE164, ...field },
  ref,
) {
  const theme = useTheme()
  const { t } = useTranslation()
  const [display, setDisplay] = useState(() => phoneInputFromE164(initialE164).display)
  return (
    <TextField
      ref={ref}
      label={label ?? t('field.phone')}
      hint={hint ?? t('field.phoneHint')}
      value={display}
      onChangeText={(raw) => {
        const parsed = parsePhoneInput(raw)
        setDisplay(parsed.display)
        onChangeE164(parsed.e164)
      }}
      keyboardType="phone-pad"
      textContentType="telephoneNumber"
      autoComplete="tel"
      placeholder={t('field.phonePlaceholder')}
      prefix={
        <View
          importantForAccessibility="no-hide-descendants"
          style={[styles.prefix, { paddingEnd: theme.spacing.sm, borderEndColor: theme.color.border }]}
        >
          <Text variant="body" color="textSecondary">
            {t('field.phonePrefix')}
          </Text>
        </View>
      }
      {...field}
    />
  )
})

const styles = StyleSheet.create({
  prefix: { borderEndWidth: 1, alignSelf: 'stretch', justifyContent: 'center' },
})
