// The `/dev/ui` catalog for the rider and driver apps: every kit component in every variant,
// size, and state, with switches for color mode, locale (`en` / `en-XA`), and 100% / 200% text.
// Development builds only: the apps' `(dev)` route group is left out of production bundles.
// Headings and sample data here are developer text; the components render translated strings.

import { formatMoney, pseudoLocale, sourceLocale, useTranslation, type ProductLocale } from '@collabo/i18n'
import { ArrowRight, Bell, Inbox, Layers, LocateFixed, Search, Settings, Trash2 } from 'lucide-react-native'
import { useRef, useState, type ReactNode } from 'react'
import { Image, StyleSheet, View } from 'react-native'

import { AddressSearchRow } from '../components/address-search-row.tsx'
import { Avatar } from '../components/avatar.tsx'
import { Banner } from '../components/banner.tsx'
import { BottomSheet } from '../components/bottom-sheet.tsx'
import { buttonSizes, buttonVariants } from '../components/button-options.ts'
import { Button } from '../components/button.tsx'
import { Card } from '../components/card.tsx'
import { Checkbox } from '../components/checkbox.tsx'
import { Chip } from '../components/chip.tsx'
import { CollaboBadge } from '../components/collabo-badge.tsx'
import { CountdownRing } from '../components/countdown-ring.tsx'
import { Dialog } from '../components/dialog.tsx'
import { Divider } from '../components/divider.tsx'
import { DriverCard, type DriverSummary } from '../components/driver-card.tsx'
import { EmptyState } from '../components/empty-state.tsx'
import { ErrorScreen } from '../components/error-screen.tsx'
import { IconButton } from '../components/icon-button.tsx'
import { LanguagePicker } from '../components/language-picker.tsx'
import { ListItem } from '../components/list-item.tsx'
import { MapControlButton } from '../components/map-control-button.tsx'
import { MoneyText } from '../components/money-text.tsx'
import { OfferCard, type OfferSummary } from '../components/offer-card.tsx'
import { OfflineBanner } from '../components/offline-banner.tsx'
import { bannerTones, iconButtonVariants, type RideClass, type SheetSnap } from '../components/options.ts'
import { OtpInput } from '../components/otp-input.tsx'
import { PermissionPrompt } from '../components/permission-prompt.tsx'
import { PhoneField } from '../components/phone-field.tsx'
import { PinDisplay } from '../components/pin-display.tsx'
import { PriceInput } from '../components/price-input.tsx'
import { RadioGroup } from '../components/radio-group.tsx'
import { RatingStars } from '../components/rating-stars.tsx'
import { RideClassPicker } from '../components/ride-class-picker.tsx'
import { Screen } from '../components/screen.tsx'
import { SegmentedControl } from '../components/segmented-control.tsx'
import { Skeleton, SkeletonGroup } from '../components/skeleton.tsx'
import { SosButton } from '../components/sos-button.tsx'
import { StatusPill } from '../components/status-pill.tsx'
import { StatusTimeline } from '../components/status-timeline.tsx'
import { Switch } from '../components/switch.tsx'
import { Text } from '../components/text.tsx'
import { TextField } from '../components/text-field.tsx'
import { Toast } from '../components/toast-store.ts'
import { tones } from '../components/tone.ts'
import { markerImage } from '../map/marker-images.ts'
import { DriverFound } from '../motion/driver-found.tsx'
import { TripComplete } from '../motion/trip-complete.tsx'
import { colorModeSettings, useColorModeSetting, usePreferences } from '../theme/preferences.ts'
import { useTextScaleOverride } from '../theme/text-scale.ts'
import { useTheme } from '../theme/use-theme.ts'
import { collaboStopNumbers, mapStyles, mapSurfaceColors, markerShapes, markerSpecs } from '../../map/index.ts'
import { colorModes, color as palette, type as typeRamp, type ColorToken, type TypeToken } from '../../tokens/index.ts'

/** Present in every catalog bundle; CI fails if it shows up in a production bundle. */
export const devUiMarker = 'collabo-dev-ui-catalog'

const colorTokens = Object.keys(palette.light).filter((token): token is ColorToken => token in palette.light)
const typeTokens = Object.keys(typeRamp).filter((token): token is TypeToken => token in typeRamp)

const sampleDriver: DriverSummary = {
  fullName: 'Tunde Adebayo',
  photoUri: null,
  rating: 4.8,
  car: 'Toyota Corolla · Silver',
  plate: 'LSD 482 KJ',
}

const sampleOffer: OfferSummary = {
  driverName: 'Ngozi Okafor',
  rating: 4.9,
  car: 'Honda Accord · Black',
  priceKobo: 250000,
  etaSeconds: 240,
}

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

function Label({ children }: { readonly children: string }) {
  return (
    <Text variant="caption" color="textTertiary">
      {children}
    </Text>
  )
}

function Row({ children }: { readonly children: ReactNode }) {
  const theme = useTheme()
  return <View style={[styles.row, { gap: theme.spacing.sm }]}>{children}</View>
}

function Stack({ children }: { readonly children: ReactNode }) {
  const theme = useTheme()
  return <View style={{ gap: theme.spacing.sm }}>{children}</View>
}

function Choice<T extends string | number>({
  options,
  value,
  onChange,
  label,
  testIdPrefix,
}: {
  readonly options: readonly T[]
  readonly value: T
  readonly onChange: (value: T) => void
  readonly label: (value: T) => string
  /** Stable ids for the Maestro flows (`mode-dark`, `locale-en-XA`, `scale-2`), whatever the locale. */
  readonly testIdPrefix: string
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
          testID={`${testIdPrefix}-${option}`}
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
      <Choice
        options={colorModeSettings}
        value={mode}
        onChange={setMode}
        label={(m) => t(`colorMode.${m}`)}
        testIdPrefix="mode"
      />
      <Choice
        options={[sourceLocale, pseudoLocale]}
        value={savedLocale === pseudoLocale ? pseudoLocale : sourceLocale}
        onChange={setLocale}
        label={(locale) => locale}
        testIdPrefix="locale"
      />
      <Choice options={[1, 2]} value={scale} onChange={setScale} label={(s) => `${s * 100}%`} testIdPrefix="scale" />
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
          <Label>{token}</Label>
          <Text variant={token}>{token.startsWith('price') ? formatMoney(1245050) : t('state.error.title')}</Text>
        </View>
      ))}
    </Section>
  )
}

function Buttons() {
  const { t } = useTranslation()
  return (
    <Section title="Button and IconButton">
      {buttonVariants.map((variant) => (
        <Stack key={variant}>
          <Label>{variant}</Label>
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
        </Stack>
      ))}
      <Label>IconButton: plain, tonal, filled, disabled</Label>
      <Row>
        {iconButtonVariants.map((variant) => (
          <IconButton
            key={variant}
            icon={Settings}
            variant={variant}
            label={t('action.close')}
            onPress={() => undefined}
          />
        ))}
        <IconButton icon={Settings} variant="filled" label={t('action.close')} disabled />
      </Row>
    </Section>
  )
}

function Fields() {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [phone, setPhone] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [resendAt] = useState(() => Date.now() + 30_000)
  const [price, setPrice] = useState(180000)
  return (
    <Section title="Fields">
      <TextField
        label={t('field.price')}
        hint={t('field.phoneHint')}
        placeholder={t('field.phonePlaceholder')}
        value={text}
        onChangeText={setText}
      />
      <TextField label={t('field.price')} error={t('errors.BAD_REQUEST')} value="12" />
      <TextField label={t('field.price')} value="1,500" disabled />
      <PhoneField onChangeE164={setPhone} />
      <Label>{`E.164: ${phone ?? 'incomplete'}`}</Label>
      <OtpInput
        value={otp}
        onChange={setOtp}
        phoneDisplay="0803 123 4567"
        resendAvailableAt={resendAt}
        onResend={() => undefined}
        focusOnMount={false}
      />
      <OtpInput
        value="123"
        onChange={() => undefined}
        phoneDisplay="0803 123 4567"
        error={t('errors.BAD_REQUEST')}
        focusOnMount={false}
      />
      <PriceInput valueKobo={price} onChangeKobo={setPrice} suggestedMinKobo={200000} stepKobo={10000} />
    </Section>
  )
}

function Selection() {
  const { t } = useTranslation()
  const [on, setOn] = useState(true)
  const [checked, setChecked] = useState(false)
  const [mode, setMode] = useState<'system' | 'light' | 'dark'>('system')
  const [chip, setChip] = useState(true)
  const [language, setLanguage] = useState<ProductLocale>('en')
  return (
    <Section title="Selection">
      <Switch label={t('colorMode.dark')} description={t('colorMode.title')} value={on} onValueChange={setOn} />
      <Switch label={t('colorMode.dark')} value={false} onValueChange={() => undefined} disabled />
      <Checkbox label={t('permission.notifications.title')} checked={checked} onChange={setChecked} />
      <Checkbox label={t('permission.notifications.title')} checked disabled onChange={() => undefined} />
      <RadioGroup
        label={t('colorMode.title')}
        options={colorModeSettings.map((value) => ({ value, label: t(`colorMode.${value}`) }))}
        value={mode}
        onChange={setMode}
      />
      <SegmentedControl
        label={t('colorMode.title')}
        segments={colorModeSettings.map((value) => ({ value, label: t(`colorMode.${value}`) }))}
        value={mode}
        onChange={setMode}
      />
      <Row>
        <Chip label={t('rideClass.economy')} selected={chip} onPress={() => setChip(!chip)} />
        <Chip label={t('rideClass.comfort')} icon={Bell} onPress={() => undefined} />
        <Chip label={t('rideClass.luxury')} disabled />
      </Row>
      <LanguagePicker value={language} onChange={setLanguage} />
    </Section>
  )
}

function Feedback() {
  const { t } = useTranslation()
  return (
    <Section title="Status, banners, toasts">
      <Row>
        {tones.map((tone) => (
          <StatusPill
            key={tone}
            tone={tone}
            label={t(tone === 'collabo' ? 'collabo.badge' : tone === 'neutral' ? 'state.loading' : `status.${tone}`)}
          />
        ))}
      </Row>
      <Row>
        <CollaboBadge />
        <CollaboBadge variant="soft" />
      </Row>
      {bannerTones.map((tone) => (
        <Banner
          key={tone}
          tone={tone}
          message={t('state.error.body')}
          action={tone === 'danger' ? { label: t('action.retry'), onPress: () => undefined } : undefined}
          onDismiss={() => undefined}
        />
      ))}
      <OfflineBanner offline />
      <Row>
        <Button
          size="sm"
          variant="secondary"
          title={t('status.success')}
          onPress={() => Toast.show(t('status.success'))}
        />
        <Button
          size="sm"
          variant="secondary"
          title={t('status.danger')}
          onPress={() =>
            Toast.show(t('errors.NETWORK'), {
              tone: 'danger',
              action: { label: t('action.retry'), onPress: () => undefined },
            })
          }
        />
      </Row>
    </Section>
  )
}

function Lists() {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <Section title="Lists and cards">
      <Card>
        <ListItem
          title={t('colorMode.title')}
          subtitle={t('colorMode.system')}
          leadingIcon={Settings}
          chevron
          onPress={() => undefined}
        />
        <Divider inset={theme.size.avatar.lg} />
        <ListItem
          title={t('language.title')}
          leading={<Avatar name="Ngozi Okafor" size="sm" />}
          selected
          onPress={() => undefined}
        />
        <Divider inset={theme.size.avatar.lg} />
        <ListItem title={t('language.title')} subtitle={t('language.yo')} disabled onPress={() => undefined} />
      </Card>
      <Card size="lg">
        <AddressSearchRow
          name="Ikeja City Mall"
          address="194 Obafemi Awolowo Way, Ikeja"
          distanceKm={3.4}
          onPress={() => undefined}
        />
        <AddressSearchRow
          name="Murtala Muhammed Airport"
          address="Ikeja, Lagos"
          distanceKm={12.6}
          recent
          onPress={() => undefined}
        />
      </Card>
      <Row>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <Avatar key={size} name="Tunde Adebayo" size={size} />
        ))}
      </Row>
      <SkeletonGroup>
        <Skeleton height={theme.spacing.xl} width="60%" />
        <Skeleton height={theme.spacing.lg} />
        <Skeleton height={theme.size.touchTarget} radius="md" />
      </SkeletonGroup>
      <EmptyState
        icon={Inbox}
        title={t('state.error.title')}
        body={t('state.error.body')}
        action={{ label: t('action.retry'), onPress: () => undefined }}
      />
    </Section>
  )
}

function Ride() {
  const { t } = useTranslation()
  const [rideClass, setRideClass] = useState<RideClass>('economy')
  const [stars, setStars] = useState(4)
  const [expiry] = useState(() => ({ deadline: Date.now() + 45_000, totalSeconds: 60 }))
  return (
    <Section title="Ride essentials">
      <Row>
        <MoneyText kobo={150000} size="lg" />
        <MoneyText kobo={125050} />
        <MoneyText kobo={300000} strikethrough />
      </Row>
      <RideClassPicker
        options={[
          { rideClass: 'economy', suggestedKobo: 180000 },
          { rideClass: 'comfort', suggestedKobo: 260000 },
          { rideClass: 'luxury', suggestedKobo: 420000 },
        ]}
        value={rideClass}
        onChange={setRideClass}
      />
      <OfferCard offer={{ ...sampleOffer, expiry }} onAccept={() => undefined} onDecline={() => undefined} />
      <OfferCard
        offer={{ ...sampleOffer, collabo: true, etaSeconds: 0 }}
        onAccept={() => undefined}
        onDecline={() => undefined}
        accepting
      />
      <DriverCard driver={sampleDriver}>
        <Button variant="secondary" title={t('action.close')} />
      </DriverCard>
      <PinDisplay pin="4729" />
      <StatusTimeline
        steps={[
          { key: 'requested', label: t('trip.driverFound'), detail: '8:42 pm', state: 'done' },
          { key: 'arriving', label: t('offer.arriving'), state: 'current' },
          { key: 'complete', label: t('trip.complete'), state: 'upcoming' },
        ]}
      />
      <RatingStars mode="display" value={4.8} />
      <RatingStars mode="input" label={t('trip.complete')} value={stars} onChange={setStars} />
      <Row>
        <CountdownRing deadline={expiry.deadline} totalSeconds={expiry.totalSeconds} />
        <MapControlButton icon={LocateFixed} label={t('map.recenter')} onPress={() => undefined} />
        <MapControlButton icon={Layers} label={t('map.layers')} onPress={() => undefined} active />
      </Row>
      <SosButton onConfirm={() => Toast.show(t('sos.label'), { tone: 'danger' })} />
    </Section>
  )
}

function MapMarkers() {
  const theme = useTheme()
  // One swatch per distinct land, road, and water color in this mode's map style.
  const swatches = [...new Map(mapSurfaceColors(mapStyles[theme.mode]).map((entry) => [entry.color, entry])).values()]
  const markers = [
    ...markerShapes.filter((shape) => shape !== 'collaboStop').map((shape) => ({ key: shape, shape, stop: undefined })),
    ...collaboStopNumbers.map((stop) => ({ key: `collaboStop-${stop}`, shape: 'collaboStop' as const, stop })),
  ]
  return (
    <Section title={`Map markers (${theme.mode} style)`}>
      {swatches.map(({ surface, color: mapColor }) => (
        <View
          key={mapColor}
          style={[
            styles.row,
            {
              gap: theme.spacing.lg,
              padding: theme.spacing.md,
              borderRadius: theme.radius.md,
              backgroundColor: mapColor,
            },
          ]}
        >
          <Label>{`${surface} ${mapColor}`}</Label>
          {markers.map(({ key, shape, stop }) => (
            <Image
              key={key}
              source={markerImage(shape, theme.mode, stop)}
              style={{ width: markerSpecs[shape].width, height: markerSpecs[shape].height }}
            />
          ))}
        </View>
      ))}
    </Section>
  )
}

function Overlays() {
  const theme = useTheme()
  const { t } = useTranslation()
  const [dialog, setDialog] = useState(false)
  const [snap, setSnap] = useState<SheetSnap>('collapsed')
  const opener = useRef<View>(null)
  return (
    <Section title="Dialog and BottomSheet">
      <View ref={opener}>
        <Button variant="destructive" title={t('action.cancel')} onPress={() => setDialog(true)} />
      </View>
      <Dialog
        visible={dialog}
        title={t('state.error.title')}
        message={t('state.error.body')}
        confirmLabel={t('action.confirm')}
        onConfirm={() => setDialog(false)}
        onCancel={() => setDialog(false)}
        destructive
        returnFocusTo={opener}
      />
      <View
        style={{
          height: theme.size.avatar.xl * 5,
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          backgroundColor: theme.color.surfaceSunken,
        }}
      >
        <BottomSheet
          title={t('trip.driverFound')}
          snap={snap}
          onSnapChange={setSnap}
          footer={<Button title={t('action.next')} icon={Search} />}
        >
          <AddressSearchRow name="Ikeja City Mall" address="Ikeja, Lagos" onPress={() => undefined} />
          <AddressSearchRow name="Lekki Phase 1" address="Eti-Osa, Lagos" onPress={() => undefined} />
        </BottomSheet>
      </View>
      <View
        style={{
          height: theme.size.avatar.xl * 5,
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.color.border,
        }}
      >
        <ErrorScreen retry={() => undefined} />
      </View>
      <PermissionPrompt kind="location" onAllow={() => undefined} onSkip={() => undefined} />
    </Section>
  )
}

function Moments() {
  const { t } = useTranslation()
  const [run, setRun] = useState(0)
  return (
    <Section title="Motion moments">
      <Button variant="secondary" title={t('action.retry')} onPress={() => setRun(run + 1)} />
      <DriverFound key={`found-${run}`} driver={sampleDriver} />
      <TripComplete key={`done-${run}`} fareKobo={250000}>
        <RatingStars mode="input" label={t('trip.complete')} value={0} onChange={() => undefined} />
      </TripComplete>
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
        <Fields />
        <Selection />
        <Feedback />
        <Lists />
        <Ride />
        <MapMarkers />
        <Overlays />
        <Moments />
        <Type />
        <Colors />
        {/* The Maestro flows scroll until this is on screen. */}
        <View testID={`${devUiMarker}-end`} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  swatch: { width: '30%' },
})
