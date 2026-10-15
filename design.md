# Collabo Ride design system

One warm, trustworthy look across the rider app, the driver app, and the ops console. This guide is written for you, whoever builds the next screen. It explains the values in `packages/ui/tokens` and how to use them; it never adds values of its own.

**Source of truth.** `packages/ui/tokens` holds every value. When this file and the tokens disagree, the tokens win, and `packages/ui/tokens/design-md.test.ts` fails until this file catches up. Decisions and reasoning live in spec [0012](docs/specs/0012-design-system/index.md).

**Where to see it.** Every component, in every variant and state, lives in the `/dev/ui` catalog of each surface (development builds only): the rider and driver apps at `collaborider://dev/ui` and `collabodriver://dev/ui` (with `EXPO_PUBLIC_DEV_UI=true`), and the console at `/dev/ui`. Each catalog has switches for color mode, locale (`en` and the pseudo locale `en-XA`), and on native, 100% and 200% text.

## Principles

1. **Calm and dependable.** Riders often book in a hurry, drivers work for hours. Quiet surfaces, one clear main action per screen, no decoration that competes with the price or the driver.
2. **Readable at a glance.** Prices, plates, PINs, and ETAs are the information people act on. They get the biggest, steadiest type (tabular figures, so digits never jump).
3. **Collabo is the signature.** Marigold amber belongs to Collabo and nothing else, so a shared trip is easy to spot and the saving feels like a moment.
4. **Never color alone.** Every status carries a word and an icon with its own shape.
5. **One source.** Screens never invent a color, size, or spacing. If you need a value that does not exist, add a token (and a pair to `pairs.ts` if it holds text) rather than a literal. The `collabo/ui-drift` and `css-drift` lint rules enforce this.

## Voice

Warm, plain Nigerian English with British spelling (colour, cancelled), sentence case, short direct sentences. Say what happens next, especially for safety and payments.

| Instead of | Write |
|---|---|
| Payment failed. Error 402. | Your card didn't go through. You can pay with cash or try another card. |
| Are you sure you want to cancel? | Cancel this trip? Your driver will be told straight away. |
| Driver ETA: 3 | Tunde is 3 min away |
| Invalid input | Enter a Nigerian phone number, like 0803 123 4567 |
| SUCCESS! | Done. Your trip is booked. |

Translators use this section as their brief (`pcm`, `yo`, `ha`, `ig` arrive with feature #33). Every string lives in `packages/i18n/catalogs/<locale>/<surface>.json`; money goes into messages already formatted (`{fare}` filled by `formatMoney`), counts as ICU plurals. The API sends error codes, never sentences; the apps show `errors.<code>`.

**Formats.** Money in whole naira when there are no kobo (`₦1,500`), two decimals otherwise (`₦1,250.50`). Ratings with one decimal (`4.8`). ETAs in whole minutes ("3 min", "Arriving"). Distances in km with one decimal under 10 km. Phones as `0803 123 4567`. Names as first name plus last initial ("Tunde A."). Plates upper case, as stored.

## Color

Names describe a role, not a hue. Each token is an explicit light and dark pair, so iOS, Android, and the console look the same (Android dynamic color is deliberately not followed). Read colors through `useTheme()` on native or the `--color-*` variables of `tokens.css` in the console.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#FAFAF7` | `#0F1412` | screen background |
| `surface` | `#FFFFFF` | `#171D1A` | cards, sheets |
| `surfaceSunken` | `#F2F2EE` | `#121815` | grouped list background, inputs |
| `surfaceRaised` | `#FFFFFF` | `#1F2622` | menus, toasts, dialogs (with elevation) |
| `border` | `#E3E3DD` | `#2C3430` | decorative dividers |
| `borderStrong` | `#7A817C` | `#6E7772` | input borders (3:1 or more) |
| `text` | `#161A17` | `#EEF1EE` | primary text |
| `textSecondary` | `#5A615C` | `#A9B1AC` | secondary text |
| `textTertiary` | `#646B66` | `#8A928D` | placeholders, hints |
| `primary` | `#1B5E3A` | `#4CAF7A` | forest green: main buttons, links, selection |
| `primaryPressed` | `#154A2E` | `#3E9768` | pressed state of `primary` |
| `onPrimary` | `#FFFFFF` | `#0B1F14` | text on `primary` |
| `primarySoft` | `#E6F0EA` | `#16301F` | selected rows and chips; text on it uses `primary` |
| `collabo` | `#B45309` | `#F5A524` | marigold amber: Collabo badges, the savings reveal |
| `onCollabo` | `#FFFFFF` | `#2A1A05` | text on `collabo` |
| `collaboSoft` | `#FDF1E3` | `#33230C` | Collabo backgrounds |
| `collaboText` | `#92400E` | `#F5A524` | Collabo text and icons on `collaboSoft` |
| `danger` | `#B42318` | `#F97066` | errors, SOS, destructive actions |
| `onDanger` | `#FFFFFF` | `#2B0A07` | text on `danger` |
| `dangerSoft` | `#FDECEA` | `#3A1512` | danger banners and pills |
| `caution` | `#8A6100` | `#FACC15` | warnings, a yellow kept apart from Collabo's amber |
| `cautionSoft` | `#FDF6D8` | `#332A07` | caution banners and pills |
| `info` | `#175CD3` | `#7CB4FF` | neutral notices, always with an icon |
| `infoSoft` | `#EAF1FD` | `#10233F` | info banners and pills |
| `success` | `#1B5E3A` | `#4CAF7A` | success uses the brand green |
| `focusRing` | `#1B5E3A` | `#7FD1A3` | 2 px keyboard focus outline |
| `scrim` | `rgba(15,20,18,0.48)` | `rgba(0,0,0,0.6)` | behind sheets and dialogs |
| `pressedOverlay` | `rgba(22,26,23,0.08)` | `rgba(238,241,238,0.10)` | pressed state on surfaces and ghost buttons |
| `disabledBg` | `#ECECE7` | `#232A26` | disabled controls |
| `disabledText` | `#9AA09C` | `#5F6863` | disabled controls (exempt from contrast, always with a non color cue) |
| `skeleton` | `#ECECE7` | `#1F2622` | loading placeholders |
| `skeletonHighlight` | `#F6F6F2` | `#28302C` | the skeleton pulse |

**Contrast.** Every foreground and background a component uses is listed in `packages/ui/tokens/pairs.ts`, and a test checks each pair in both modes: 4.5:1 for text, 3:1 for large text, icons, input borders, focus rings, and map markers. A component may only use a listed pair; to use a new one, add it there first.

**Status is never color alone.** Each tone pairs its color with a word and an icon whose shape differs: octagon for danger, triangle for caution, circle with an i for info, check circle for success, and the two person mark for Collabo. `CollaboBadge` always says "Collabo".

**Cards in sunlight.** In light mode, cards on `bg` carry a `border` hairline as well as the `card` shadow, because the two whites are hard to tell apart outdoors.

## Type

DM Sans is the brand face, with Inter as the fallback for any locale DM Sans can't fully set. Both ship as static files at 400, 500, 600, and 700 (no synthesized weights), and components never name a family: they pick a step, and the theme supplies the family for the current locale.

**Current state, worth knowing.** The build time coverage check (`packages/ui/tokens/fonts.ts`) found that DM Sans has no naira sign (₦), and Yoruba, Igbo, and Hausa need letters it lacks. Because the rule moves a locale to Inter when anything is missing, **every locale, English included, currently renders in Inter.** Spec 0012's Follow-up tracks this; a fix (such as setting only the naira sign in Inter) is a design decision for `/architect`.

| Token | Size / line height | Weight | Tabular | Use |
|---|---|---|---|---|
| `display` | 34 / 40 | 700 | no | rare hero numbers (Collabo saving, earnings total) |
| `title1` | 28 / 34 | 700 | no | screen titles outside stack headers |
| `title2` | 22 / 28 | 600 | no | section and sheet titles |
| `title3` | 20 / 26 | 600 | no | card and dialog titles |
| `headline` | 17 / 22 | 600 | no | list titles, button labels |
| `body` | 17 / 24 | 400 | no | default text |
| `callout` | 16 / 22 | 400 | no | supporting text in cards |
| `subhead` | 15 / 20 | 500 | no | labels, metadata |
| `footnote` | 13 / 18 | 400 | no | fine print, hints, errors |
| `caption` | 12 / 16 | 500 | no | badges, map labels |
| `price` | 28 / 34 | 700 | yes | the main price on offers and the fare |
| `priceSm` | 17 / 22 | 600 | yes | prices in lists |

**Large text.** Text scales with the system setting everywhere, except these caps (`maxFontScale`): map overlays and the tab bar at 1.3, and `PinDisplay` and `price` at 1.5, so the map stays usable. Sheets over the map scroll, and the collapsed snap point shows only the main action. Android's system maximum is about 130%, so the 200% check uses the catalog's text scale switch.

## Spacing

A 4 point grid. Layouts use `gap`; screen edge padding is `lg`.

| Token | Value |
|---|---|
| `xxs` | 2 |
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |
| `xxl` | 32 |
| `xxxl` | 48 |

## Radius

Non capsule radii use `borderCurve: "continuous"` on native (iOS only; Android ignores it, which is fine).

| Token | Value | Use |
|---|---|---|
| `sm` | 8 | chips, inputs |
| `md` | 12 | buttons, cards |
| `lg` | 16 | offer and driver cards, dialogs |
| `xl` | 24 | sheet top corners |
| `full` | 9999 | pills, avatars |

## Elevation

`boxShadow` strings. In dark mode, surfaces step lighter (`surface` to `surfaceRaised`) and shadows darken at the same offsets.

| Token | Light | Dark |
|---|---|---|
| `card` | `0 1px 2px rgba(22,26,23,0.06)` | `0 1px 2px rgba(0,0,0,0.4)` |
| `raised` | `0 4px 12px rgba(22,26,23,0.10)` | `0 4px 12px rgba(0,0,0,0.4)` |
| `overlay` | `0 12px 32px rgba(22,26,23,0.18)` | `0 12px 32px rgba(0,0,0,0.4)` |

## Sizes and layers

- **Touch targets** are at least 48 by 48 (above the 44 point minimum, matching Android's 48 dp). Buttons are `sm` 40 (with hit slop up to 48), `md` 48, and `lg` 56 for the driver's main actions.
- **Icons** are 16, 20, 24 (default), and 32, on a 1.75 stroke.
- **Avatars** are 24, 32, 40, 56, and 80.
- **Widths**: content is capped at 640 on tablets and 1280 in the console; dialogs at 420.
- **Focus ring**: 2 px with a 2 px offset, never removed.
- **Layers** (`zIndex`): `base` 0, `sticky` 10, `mapControls` 20, `sheet` 30, `toast` 40, `dialog` 50.
- **Sheets** snap to `collapsed` (just the main action, measured), `half` (50%), and `full` (90%).
- **Toasts** stay 4 seconds (6 with an action): at the top on native, bottom right in the console.

## Motion

Calm and quick. Motion only explains a change: an offer sliding into the list, the car gliding between positions, a status step advancing. Every animation reads these tokens.

| Token | Value | Use |
|---|---|---|
| `fast` | 150 ms | press, toggle, small state changes, every exit |
| `base` | 220 ms | elements entering or leaving |
| `slow` | 320 ms | sheets, screen level changes |
| `expressiveMax` | 900 ms | the ceiling for any expressive moment |
| `reducedFade` | 150 ms | what every moment becomes under Reduce Motion |
| `stagger` | 60 ms | gap between parts that appear one after another |
| `checkDraw` | 500 ms | the check mark draw |
| `sosHold` | 1000 ms | how long SOS must be held |
| `markerGlide` | 4000 ms | the car glides across the gap between location updates |
| `skeletonPulse` | 1200 ms | one loading pulse |

Springs: `gentle` (damping 20, stiffness 180) for cards and sheets settling, `snappy` (damping 18, stiffness 260) for chips and selection. Timing based entries use `easeOut`, cubic bezier (0.2, 0, 0, 1). Floating controls shrink to 0.97 while pressed.

**The four expressive moments** (each 900 ms or less, never blocking input; in `packages/ui/native/motion/`):

| Moment | Surface | What happens | Haptic | Status |
|---|---|---|---|---|
| Driver found | rider | the driver card rises with `gentle`; avatar and plate fade in 60 ms apart | success | built (`DriverFound`) |
| Collabo savings reveal | rider | in the amber card, the old fare is struck through and the new fare counts down over 700 ms, with a soft amber glow | light impact at the end | designed, built with #21 |
| Trip complete | both | a check mark draws (500 ms) and the fare settles, leading into the rating | success | built (`TripComplete`) |
| Driver earnings | driver | going online fills the status pill green; an earning counts up and the day total ticks; a paid payout draws a check | light impact | designed, built with #26 |

**Reduce Motion.** Components read the one `useReduceMotion()` hook, which follows the system setting live. Every moment becomes a fade of 150 ms or less with no movement or scaling, count ups show the final value at once, and the car marker jumps instead of gliding. The console does the same with `prefers-reduced-motion`.

**Haptics** go through `haptics.ts`, which does nothing when the system has them off. Besides the moments: a correct PIN, the SOS long press, and errors. A haptic is never the only signal.

**Theme changes mid animation.** Worklets and Skia paints take plain colors from `useTheme()`, so a running animation finishes in the old colors and the next one uses the new.

## Icons

Lucide (`lucide-react-native` on native, `lucide-react` in the console) on a 24 px grid with a 1.75 stroke, colored from a token. Custom icons sit on the same grid and stroke: the ride classes (economy, comfort, luxury), Collabo's two person mark, and the SOS mark, in `packages/ui/native/icons` and `packages/ui/web/icons`. An icon only button always has a translated label.

## Map

Two Google Maps styles, `packages/ui/map/map-style-light.json` and `map-style-dark.json`, switch with the color mode through `useMapStyle()`: muted land and water near the `bg` tones, roads in clear neutral greys with arterials slightly stronger, business labels off, transit and parks faint. iOS uses the Google provider too, so both platforms match.

Markers are PNG bitmaps at 1x, 2x, and 3x (custom SVG markers are slow on Android), drawn from the color tokens by `pnpm --filter @collabo/ui ui:markers`, one set per color mode, sized by icon tokens and never scaled with text:

| Marker | Shape | Fill | Component |
|---|---|---|---|
| Pickup | dot with a ring | `primary` | `MapPin kind="pickup"` |
| Drop off | square pin | `text` | `MapPin kind="dropoff"` |
| Car | top view, rotated by heading | `text` | `CarMarker` |
| Collabo stop | amber pin with its number (1 to 4) | `collabo` | `MapPin kind="collaboStop"` |

A test checks every marker fill against every land, road, and water color in its style at 3:1 or more. The map is one element for screen readers, labelled with a summary ("Driver 3 minutes away"); on map screens the sheet comes before the map in reading order.

## Components

Native components follow one contract: `variant`, `size`, and state props, pressed feedback through `Pressable`, `style` merged last, an explicit accessibility role, label, and state, and tokens only. Import them from `@collabo/ui/native`; console components from `@collabo/ui/web`.

**Core (native):** `Text`, `Screen`, `Button` (`primary`, `secondary`, `ghost`, `destructive`; `sm`, `md`, `lg`; loading), `IconButton`, `TextField`, `PhoneField` (+234, formats as you type, E.164 out), `OtpInput` (one hidden input drawn as 6 cells, SMS autofill, resend timer), `Card`, `ListItem`, `BottomSheet`, `Dialog` (confirmations only), `Toast`, `Banner`, `StatusPill`, `Avatar`, `Skeleton`, `EmptyState`, `SegmentedControl`, `Switch`, `Checkbox`, `RadioGroup`, `Chip`, `Divider`, `LanguagePicker`, `OfflineBanner`, `PermissionPrompt`, `ErrorScreen`, and the themed header and tab bar options for Expo Router.

**Ride essentials (native):** `MoneyText`, `PriceInput` (whole naira, two labelled step buttons, the suggested minimum), `AddressSearchRow`, `StatusTimeline`, `RatingStars`, `CountdownRing`, `MapControlButton`, `RideClassPicker`, `MapPin`, `CarMarker`, `OfferCard`, `DriverCard` (plate in a plate style badge), `PinDisplay` (read digit by digit, never logged), `SosButton` (hold 1 second), `CollaboBadge`.

**Console (web, on Radix):** `Button`, `IconButton`, `TextField`, `Checkbox`, `Select`, `Dialog`, `DropdownMenu`, `Tabs`, `Tooltip`, `Toast`, `Badge`, `Skeleton`, `EmptyState`, `Pagination`, `DataTable` (TanStack Table with sorting, pagination, loading, and empty states), and `PageShell` (skip link, navigation, header, and the theme toggle). Console styles live in CSS modules on `tokens.css`; an inline `style` may only set CSS variables.

**Every data screen** shows four states: loading (skeletons, never a full screen spinner), empty, error with a retry, and content.

## Accessibility

The target is WCAG 2.2 AA on every surface.

- **Labels and roles.** Every interactive element has a role, a translated label, and its state (selected, disabled, busy, checked). Icon only buttons always carry a label.
- **Targets.** At least 48 by 48.
- **Contrast.** Only pairs listed in `pairs.ts`, tested in both modes.
- **Never color alone.** Status uses an icon shape and a word; errors add an icon and a screen reader prefix.
- **Text size.** Everything renders without clipping at 200% text in both modes; only the caps under Type limit scaling.
- **Strings.** Nothing user facing is hard coded; lint fails on literal JSX text and on literal `label`, `title`, `placeholder`, `accessibilityLabel`, `accessibilityHint`, `aria-label`, and `alt`, and on literal strings passed to toasts, alerts, form errors, and navigation titles. The `en-XA` pseudo locale (accented, 40% longer) catches what lint can't.
- **Announcements.** Offers arriving, the match, and trip status changes are announced politely through `announce()`; a driver's incoming request is assertive. Countdowns announce only at 30 and 10 seconds left.
- **Sheets and dialogs.** Focus moves to the title on open, the background is hidden from screen readers, Android back and Escape close them, and focus returns to the control that opened them.
- **Keyboard (console).** Focus is always visible (`focusRing`), a skip link leads to the main content, and menus, selects, tabs, and dialogs follow the Radix keyboard patterns.
- **Motion.** Reduce Motion is honoured everywhere, as described under Motion.
- **Direction.** Right to left is out of scope (none of the five languages needs it), but styles use `start` and `end`, never `left` and `right`.

## Checks that keep this true

| Check | What it guards | Where |
|---|---|---|
| Contrast pairs | AC-3: every pair in both modes | `packages/ui/tokens/pairs.test.ts` |
| Marker contrast | AC-9: markers on their map style | `packages/ui/map/map.test.ts` |
| Font coverage | AC-6: `fonts.ts` matches the font files | `packages/ui/tokens/fonts.test.ts` |
| This file | AC-1: every value here matches the tokens | `packages/ui/tokens/design-md.test.ts` |
| `collabo/ui-drift` | AC-2: no literal color, off scale spacing, or raw font size in native styles | `packages/config/lint/ui-drift.ts` |
| `css-drift` | AC-2: the same for console CSS modules | `packages/config/lint/css-drift.ts` |
| String rules | AC-5: no hard coded user facing text | `packages/config/oxlint.ui.json` |
| Catalog flows | AC-4, AC-5: screenshots in every mode, locale, and text size | `apps/*/.maestro/ui-catalog.yaml` |
