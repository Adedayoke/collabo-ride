// The console's `/dev/ui` catalog: every console kit component in every variant, size, and
// state, with switches for color mode and locale (`en` / `en-XA`). Development builds only.
// Headings here are developer text; the components shown render translated strings.

import { formatMoney, pseudoLocale, sourceLocale, useTranslation } from '@collabo/i18n'
import { ArrowRight, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { color, type as typeRamp, type ColorToken, type TypeToken } from '../../tokens/index.ts'
import { colorModeSettings, useColorMode } from '../color-mode.ts'
import { Button, type ButtonVariant } from '../components/button.tsx'
import styles from './ui-catalog.module.css'

/** Present in every catalog bundle; CI fails if it shows up in a production bundle. */
export const devUiMarker = 'collabo-dev-ui-catalog'

const variants: readonly ButtonVariant[] = ['primary', 'secondary', 'ghost', 'destructive']
const colorTokens = Object.keys(color.light).filter((token): token is ColorToken => token in color.light)
const typeTokens = Object.keys(typeRamp).filter((token): token is TypeToken => token in typeRamp)
const cssName = (token: string) => token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className={styles.section} aria-label={title}>
      <h2 className={styles.heading}>{title}</h2>
      {children}
    </section>
  )
}

function Controls() {
  const { t, i18n } = useTranslation()
  const [mode, setMode] = useColorMode()
  return (
    <Section title="Controls">
      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Colour mode</legend>
        <div className={styles.row}>
          {colorModeSettings.map((setting) => (
            <Button
              key={setting}
              size="sm"
              variant={setting === mode ? 'primary' : 'secondary'}
              aria-pressed={setting === mode}
              onClick={() => setMode(setting)}
            >
              {t(`colorMode.${setting}`)}
            </Button>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Locale</legend>
        <div className={styles.row}>
          {[sourceLocale, pseudoLocale].map((locale) => (
            <Button
              key={locale}
              size="sm"
              variant={i18n.language === locale ? 'primary' : 'secondary'}
              aria-pressed={i18n.language === locale}
              onClick={() => void i18n.changeLanguage(locale)}
            >
              {locale}
            </Button>
          ))}
        </div>
      </fieldset>
    </Section>
  )
}

function Buttons() {
  const { t } = useTranslation()
  return (
    <Section title="Button">
      {variants.map((variant) => (
        <div key={variant} className={styles.section}>
          <p className={styles.label}>{variant}</p>
          <div className={styles.row}>
            <Button variant={variant} size="sm">
              {t('action.next')}
            </Button>
            <Button variant={variant}>{t('action.next')}</Button>
            <Button variant={variant} size="lg">
              {t('action.next')}
            </Button>
            <Button variant={variant} disabled>
              {t('action.confirm')}
            </Button>
            <Button variant={variant} loading>
              {t('action.confirm')}
            </Button>
            <Button variant={variant} icon={variant === 'destructive' ? Trash2 : ArrowRight}>
              {variant === 'destructive' ? t('action.decline') : t('action.next')}
            </Button>
          </div>
        </div>
      ))}
    </Section>
  )
}

function Type() {
  const { t } = useTranslation()
  return (
    <Section title="Type">
      {typeTokens.map((token) => (
        <div key={token}>
          <span className={styles.caption}>{token}</span>
          <p
            className={token.startsWith('price') ? 'tabular' : undefined}
            style={{
              margin: 0,
              fontSize: `var(--font-size-${cssName(token)})`,
              lineHeight: `var(--line-height-${cssName(token)})`,
              fontWeight: `var(--font-weight-${cssName(token)})`,
            }}
          >
            {token.startsWith('price') ? formatMoney(1245050) : t('state.error.title')}
          </p>
        </div>
      ))}
    </Section>
  )
}

function Colors() {
  return (
    <Section title="Colours">
      <div className={styles.swatches}>
        {colorTokens.map((token) => (
          <div key={token}>
            <div className={styles.swatch} style={{ background: `var(--color-${cssName(token)})` }} />
            <span className={styles.caption}>{token}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

export function UiCatalog() {
  return (
    <main className={styles.page} data-testid={devUiMarker}>
      <h1 className={styles.heading}>UI catalog</h1>
      <Controls />
      <Buttons />
      <Type />
      <Colors />
    </main>
  )
}
