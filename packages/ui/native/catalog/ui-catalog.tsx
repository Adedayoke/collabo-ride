// The `/dev/ui` catalog for the rider and driver apps: every kit component in every variant,
// size, and state, with switches for color mode, locale (`en` / `en-XA`), and 100% / 200% text.
// Development builds only: the apps' `(dev)` route group is left out of production bundles.
// Headings here are developer text; the components shown render translated strings.

import { formatMoney, pseudoLocale, sourceLocale, useTranslation } from '@collabo/i18n'
import { ArrowRight, Trash2 } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { buttonSizes, buttonVariants } from '../components/button-options.ts'
import { Button } from '../components/button.tsx'
import { Screen } from '../components/screen.tsx'
import { Text } from '../components/text.tsx'
import { colorModeSettings, useColorModeSetting, usePreferences } from '../theme/preferences.ts'
import { useTextScaleOverride } from '../theme/text-scale.ts'
import { useTheme } from '../theme/use-theme.ts'
import { colorModes, color as palette, type as typeRamp, type ColorToken, type TypeToken } from '../../tokens/index.ts'

/** Present in every catalog bundle; CI fails if it shows up in a production bundle. */
export const devUiMarker = 'collabo-dev-ui-catalog'

const colorTokens = Object.keys(palette.light).filter((token): token is ColorToken => token in palette.light)
const typeTokens = Object.keys(typeRamp).filter((token): token is TypeToken => token in typeRamp)

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  const theme = useTheme()
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Text variant="title2" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  )
}

function Row({ children }: { readonly children: ReactNode }) {
  const theme = useTheme()
  return <View style={[styles.row, { gap: theme.spacing.sm }]}>{children}</View>
}

function Choice<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  readonly options: readonly T[]
  readonly value: T
  readonly onChange: (value: T) => void
  readonly label: (value: T) => string
}) {
  return (
    <Row>
      {options.map((option) => (
        <Button
          key={option}
          size="sm"
          variant={option === value ? 'primary' : 'secondary'}
          title={label(option)}
          onPress={() => onChange(option)}
        />
      ))}
    </Row>
  )
}

function Controls() {
  const { t } = useTranslation()
  const [mode, setMode] = useColorModeSetting()
  const savedLocale = usePreferences((state) => state.locale)
  const setLocale = usePreferences((state) => state.setLocale)
  const scale = useTextScaleOverride((state) => state.scale)
  const setScale = useTextScaleOverride((state) => state.setScale)
  return (
    <Section title="Controls">
      <Choice options={colorModeSettings} value={mode} onChange={setMode} label={(m) => t(`colorMode.${m}`)} />
      <Choice
        options={[sourceLocale, pseudoLocale]}
        value={savedLocale === pseudoLocale ? pseudoLocale : sourceLocale}
        onChange={setLocale}
        label={(locale) => locale}
      />
      <Choice options={[1, 2]} value={scale} onChange={setScale} label={(s) => `${s * 100}%`} />
    </Section>
  )
}

function Colors() {
  const theme = useTheme()
  return (
    <Section title={`Colours (${theme.mode})`}>
      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        {colorTokens.map((token) => (
          <View key={token} style={[styles.swatch, { gap: theme.spacing.xs }]}>
            <View
              style={{
                height: theme.size.touchTarget,
                borderRadius: theme.radius.sm,
                borderCurve: 'continuous',
                backgroundColor: theme.color[token],
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.color.border,
              }}
            />
            <Text variant="caption" color="textSecondary">
              {token}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="footnote" color="textSecondary">
        {`Modes: ${colorModes.join(', ')}. Font set: ${theme.fontSet}.`}
      </Text>
    </Section>
  )
}

function Type() {
  const { t } = useTranslation()
  return (
    <Section title="Type">
      {typeTokens.map((token) => (
        <View key={token}>
          <Text variant="caption" color="textTertiary">
            {token}
          </Text>
          <Text variant={token}>{token.startsWith('price') ? formatMoney(1245050) : t('state.error.title')}</Text>
        </View>
      ))}
    </Section>
  )
}

function Buttons() {
  const { t } = useTranslation()
  return (
    <Section title="Button">
      {buttonVariants.map((variant) => (
        <View key={variant} style={styles.stack}>
          <Text variant="subhead" color="textSecondary">
            {variant}
          </Text>
          <Row>
            {buttonSizes.map((size) => (
              <Button key={size} variant={variant} size={size} title={t('action.next')} onPress={() => undefined} />
            ))}
          </Row>
          <Row>
            <Button variant={variant} title={t('action.confirm')} disabled />
            <Button variant={variant} title={t('action.confirm')} loading />
            <Button
              variant={variant}
              title={variant === 'destructive' ? t('action.decline') : t('action.next')}
              icon={variant === 'destructive' ? Trash2 : ArrowRight}
              onPress={() => undefined}
            />
          </Row>
        </View>
      ))}
    </Section>
  )
}

export function UiCatalog() {
  const theme = useTheme()
  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <View testID={devUiMarker} style={{ gap: theme.spacing.xxl }}>
        <Controls />
        <Buttons />
        <Type />
        <Colors />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  stack: { gap: 8 },
  swatch: { width: '30%' },
})
