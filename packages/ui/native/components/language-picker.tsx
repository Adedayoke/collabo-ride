import { productLocales, useTranslation, type ProductLocale } from '@collabo/i18n'
import type { StyleProp, ViewStyle } from 'react-native'

import { RadioGroup } from './radio-group.tsx'

export type LanguagePickerProps = {
  readonly value: ProductLocale
  /** Save it: to the device before sign in, and to `users.locale` after (spec 0010). */
  readonly onChange: (locale: ProductLocale) => void
  /** Locales whose catalogs exist yet; the rest arrive with #33. Defaults to all product locales. */
  readonly available?: readonly ProductLocale[]
  readonly style?: StyleProp<ViewStyle>
}

/** Each language named in itself ("Yorùbá", "Hausa"), so anyone can find their own. */
export function LanguagePicker({ value, onChange, available = productLocales, style }: LanguagePickerProps) {
  const { t } = useTranslation()
  return (
    <RadioGroup
      label={t('language.title')}
      options={available.map((locale) => ({ value: locale, label: t(`language.${locale}`) }))}
      value={value}
      onChange={onChange}
      style={style}
    />
  )
}
