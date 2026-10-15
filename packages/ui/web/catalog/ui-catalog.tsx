// The console's `/dev/ui` catalog: every console kit component in every variant, size, and
// state, with switches for color mode and locale (`en` / `en-XA`). Development builds only.
// Headings here are developer text; the components shown render translated strings.

import { formatMoney, pseudoLocale, sourceLocale, useTranslation } from '@collabo/i18n'
import { ArrowRight, Check, Inbox, MoreHorizontal, Settings, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { color, type as typeRamp, type ColorToken, type TypeToken } from '../../tokens/index.ts'
import { colorModeSettings, useColorMode, type ColorModeSetting } from '../color-mode.ts'
import { Badge } from '../components/badge.tsx'
import { Button, type ButtonVariant } from '../components/button.tsx'
import { Checkbox } from '../components/checkbox.tsx'
import { createDataTableColumns } from '../components/data-table-features.ts'
import { DataTable } from '../components/data-table.tsx'
import { Dialog } from '../components/dialog.tsx'
import { DropdownMenu } from '../components/dropdown-menu.tsx'
import { EmptyState } from '../components/empty-state.tsx'
import { IconButton, type IconButtonVariant } from '../components/icon-button.tsx'
import { PageShell } from '../components/page-shell.tsx'
import { Select } from '../components/select.tsx'
import { Skeleton, SkeletonGroup } from '../components/skeleton.tsx'
import { Tabs } from '../components/tabs.tsx'
import { TextField } from '../components/text-field.tsx'
import { Toast } from '../components/toast-store.ts'
import type { Tone } from '../components/tone.ts'
import { Tooltip } from '../components/tooltip.tsx'
import type { CssVariables } from '../css-variables.ts'
import styles from './ui-catalog.module.css'

/** Present in every catalog bundle; CI fails if it shows up in a production bundle. */
export const devUiMarker = 'collabo-dev-ui-catalog'

const variants: readonly ButtonVariant[] = ['primary', 'secondary', 'ghost', 'destructive']
const iconButtonVariants: readonly IconButtonVariant[] = ['ghost', 'secondary', 'destructive']
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
            className={[styles.typeSample, token.startsWith('price') ? 'tabular' : undefined].filter(Boolean).join(' ')}
            style={
              {
                '--sample-size': `var(--font-size-${cssName(token)})`,
                '--sample-line-height': `var(--line-height-${cssName(token)})`,
                '--sample-weight': `var(--font-weight-${cssName(token)})`,
              } satisfies CssVariables
            }
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
            <div
              className={styles.swatch}
              style={{ '--swatch': `var(--color-${cssName(token)})` } satisfies CssVariables}
            />
            <span className={styles.caption}>{token}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

function IconButtons() {
  const { t } = useTranslation()
  return (
    <Section title="IconButton and Tooltip">
      <div className={styles.row}>
        {iconButtonVariants.map((variant) => (
          <Tooltip key={variant} content={t('action.moreActions')}>
            <IconButton icon={MoreHorizontal} label={t('action.moreActions')} variant={variant} />
          </Tooltip>
        ))}
        <IconButton icon={Settings} label={t('action.close')} size="sm" />
        <IconButton icon={Settings} label={t('action.close')} disabled />
      </div>
    </Section>
  )
}

function Badges() {
  const { t } = useTranslation()
  return (
    <Section title="Badge">
      <div className={styles.row}>
        <Badge tone="success">{t('status.success')}</Badge>
        <Badge tone="info">{t('status.info')}</Badge>
        <Badge tone="caution">{t('status.caution')}</Badge>
        <Badge tone="danger">{t('status.danger')}</Badge>
        <Badge tone="collabo">{t('collabo.badge')}</Badge>
        <Badge>{t('state.loading')}</Badge>
      </div>
    </Section>
  )
}

function Fields() {
  const { t } = useTranslation()
  const [checked, setChecked] = useState(true)
  const [mode, setMode] = useState<ColorModeSetting | undefined>(undefined)
  return (
    <Section title="TextField, Select, Checkbox">
      <div className={styles.grid}>
        <TextField label={t('field.phone')} hint={t('field.phoneHint')} placeholder={t('field.phonePlaceholder')} />
        <TextField label={t('field.phone')} error={t('errors.BAD_REQUEST')} defaultValue="0803" />
        <TextField label={t('field.phone')} disabled />
        <Select
          label={t('colorMode.title')}
          options={colorModeSettings.map((setting) => ({ value: setting, label: t(`colorMode.${setting}`) }))}
          value={mode}
          onChange={setMode}
          hint={t('field.phoneHint')}
        />
        <Select label={t('colorMode.title')} options={[]} value={undefined} onChange={() => undefined} disabled />
      </div>
      <div className={styles.row}>
        <Checkbox label={t('action.accept')} checked={checked} onCheckedChange={setChecked} />
        <Checkbox label={t('action.decline')} checked="indeterminate" onCheckedChange={() => undefined} />
        <Checkbox label={t('action.dismiss')} checked={false} onCheckedChange={() => undefined} disabled />
      </div>
    </Section>
  )
}

function Overlays() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <Section title="Dialog, DropdownMenu, Toast">
      <div className={styles.row}>
        <Button variant="destructive" icon={Trash2} onClick={() => setOpen(true)}>
          {t('action.cancel')}
        </Button>
        <DropdownMenu
          trigger={<IconButton icon={MoreHorizontal} label={t('action.moreActions')} variant="secondary" />}
          actions={[
            { key: 'save', label: t('action.save'), icon: Check, onSelect: () => Toast.show(t('action.done')) },
            { key: 'retry', label: t('action.retry'), onSelect: () => undefined, disabled: true },
            {
              key: 'cancel',
              label: t('action.cancel'),
              icon: Trash2,
              destructive: true,
              onSelect: () => Toast.show(t('state.error.title'), { tone: 'danger' }),
            },
          ]}
        />
        <Button variant="secondary" onClick={() => Toast.show(t('action.done'))}>
          {t('status.success')}
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            Toast.show(t('state.offline'), {
              tone: 'caution',
              action: { label: t('action.retry'), onSelect: () => undefined },
            })
          }
        >
          {t('status.caution')}
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t('state.error.title')}
        message={t('state.error.body')}
        confirmLabel={t('action.confirm')}
        destructive
        loading={busy}
        onConfirm={() => {
          setBusy(true)
          window.setTimeout(() => {
            setBusy(false)
            setOpen(false)
          }, 800)
        }}
      />
    </Section>
  )
}

/** A status badge with its word, so tone is never shown by color alone. */
function StatusCell({ tone }: { readonly tone: Tone }) {
  const { t } = useTranslation()
  switch (tone) {
    case 'success':
    case 'info':
    case 'caution':
    case 'danger':
      return <Badge tone={tone}>{t(`status.${tone}`)}</Badge>
    case 'collabo':
      return <Badge tone={tone}>{t('collabo.badge')}</Badge>
    case 'neutral':
      return <Badge tone={tone}>{t('state.loading')}</Badge>
  }
}

function WhenCell({ when }: { readonly when: Date }) {
  const { i18n } = useTranslation()
  return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(when)
}

type SampleTrip = { readonly rider: string; readonly state: Tone; readonly fareKobo: number; readonly when: Date }

const tripColumns = createDataTableColumns<SampleTrip>()

const columns = tripColumns.columns([
  tripColumns.accessor('rider', { header: 'Rider', sortFn: 'text' }),
  tripColumns.accessor('state', {
    header: 'Status',
    cell: (info) => <StatusCell tone={info.getValue()} />,
    enableSorting: false,
  }),
  tripColumns.accessor('fareKobo', {
    header: 'Fare',
    cell: (info) => <span className="tabular">{formatMoney(info.getValue())}</span>,
    sortFn: 'basic',
  }),
  tripColumns.accessor('when', {
    header: 'When',
    cell: (info) => <WhenCell when={info.getValue()} />,
    sortFn: 'datetime',
  }),
])

const sampleTrips: readonly SampleTrip[] = Array.from({ length: 27 }, (_, index) => ({
  rider: ['Tunde A.', 'Ngozi O.', 'Aisha B.', 'Chidi E.', 'Bola K.'][index % 5] ?? 'Tunde A.',
  state: (['success', 'info', 'caution', 'danger', 'collabo'] as const)[index % 5] ?? 'success',
  fareKobo: 150000 + index * 12550,
  when: new Date(Date.UTC(2026, 9, 1 + (index % 14), 8 + (index % 10))),
}))

function Data() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'table' | 'loading' | 'empty'>('table')
  return (
    <Section title="Tabs, DataTable, Pagination, Skeleton, EmptyState">
      <Tabs
        label="DataTable states"
        value={tab}
        onChange={setTab}
        tabs={[
          {
            value: 'table',
            label: t('status.success'),
            content: <DataTable caption="Trips" columns={columns} data={sampleTrips} pageSize={8} />,
          },
          {
            value: 'loading',
            label: t('state.loading'),
            content: <DataTable caption="Trips" columns={columns} data={[]} loading />,
          },
          {
            value: 'empty',
            label: t('table.empty.title'),
            content: <DataTable caption="Trips" columns={columns} data={[]} />,
          },
        ]}
      />
      <SkeletonGroup>
        <Skeleton shape="circle" />
        <Skeleton width="60%" />
        <Skeleton shape="block" />
      </SkeletonGroup>
      <EmptyState
        icon={Inbox}
        title={t('table.empty.title')}
        body={t('table.empty.body')}
        action={<Button variant="secondary">{t('action.retry')}</Button>}
      />
    </Section>
  )
}

export function UiCatalog() {
  const { t } = useTranslation()
  return (
    <PageShell
      title={t('app.name', { ns: 'console' })}
      nav={[{ href: '/dev/ui', label: 'UI catalog', icon: Inbox, current: true }]}
    >
      <div className={styles.page} data-testid={devUiMarker}>
        <h1 className={styles.heading}>UI catalog</h1>
        <Controls />
        <Buttons />
        <IconButtons />
        <Badges />
        <Fields />
        <Overlays />
        <Data />
        <Type />
        <Colors />
      </div>
    </PageShell>
  )
}
