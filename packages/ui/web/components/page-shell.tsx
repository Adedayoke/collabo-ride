// The console's frame: a skip link, the header with the theme toggle, the main navigation, and
// the shared toast and tooltip hosts. Every console page renders inside it.

import { useTranslation } from '@collabo/i18n'
import * as RadixMenu from '@radix-ui/react-dropdown-menu'
import { Check, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

import { size } from '../../tokens/index.ts'
import { colorModeSettings, useColorMode, type ColorModeSetting } from '../color-mode.ts'
import focus from './focus.module.css'
import { IconButton } from './icon-button.tsx'
import menu from './menu.module.css'
import styles from './page-shell.module.css'
import { ToastHost } from './toast.tsx'
import { TooltipProvider } from './tooltip.tsx'

export type ShellLinkProps = {
  readonly href: string
  readonly className: string
  readonly 'aria-current'?: 'page'
  readonly children: ReactNode
}

export type ShellNavItem = {
  readonly href: string
  /** Translated. */
  readonly label: string
  readonly icon: LucideIcon
  readonly current?: boolean
}

export type PageShellProps = {
  /** Translated product name, such as "Collabo Ride ops". */
  readonly title: string
  readonly nav: readonly ShellNavItem[]
  /** The router's link, so navigation stays in the app. Defaults to a plain `<a>`. */
  readonly linkComponent?: ComponentType<ShellLinkProps>
  readonly children: ReactNode
}

const mainId = 'main'

const modeIcon: Record<ColorModeSetting, LucideIcon> = { system: Monitor, light: Sun, dark: Moon }

function PlainLink({ href, className, children, ...props }: ShellLinkProps) {
  return (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  )
}

function ColorModeMenu() {
  const { t } = useTranslation()
  const [mode, setMode] = useColorMode()
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>
        <IconButton icon={modeIcon[mode]} label={t('colorMode.title')} />
      </RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content className={menu.content} align="end" sideOffset={4}>
          <RadixMenu.RadioGroup
            value={mode}
            onValueChange={(next) => {
              const setting = colorModeSettings.find((candidate) => candidate === next)
              if (setting) setMode(setting)
            }}
          >
            {colorModeSettings.map((setting) => {
              const Icon = modeIcon[setting]
              return (
                <RadixMenu.RadioItem key={setting} value={setting} className={menu.item}>
                  <span className={menu.itemLabel}>
                    <Icon size={size.icon.md} strokeWidth={size.iconStroke} aria-hidden="true" />
                    {t(`colorMode.${setting}`)}
                  </span>
                  <RadixMenu.ItemIndicator className={menu.indicator}>
                    <Check size={size.icon.md} strokeWidth={size.iconStroke} aria-hidden="true" />
                  </RadixMenu.ItemIndicator>
                </RadixMenu.RadioItem>
              )
            })}
          </RadixMenu.RadioGroup>
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  )
}

export function PageShell({ title, nav, linkComponent: Link = PlainLink, children }: PageShellProps) {
  const { t } = useTranslation()
  return (
    <TooltipProvider>
      <div className={styles.shell}>
        <a href={`#${mainId}`} className={`${styles.skip} ${focus.ring}`}>
          {t('shell.skip')}
        </a>
        <header className={styles.header}>
          <span className={styles.title}>{title}</span>
          <ColorModeMenu />
        </header>
        <nav className={styles.nav} aria-label={t('shell.nav')}>
          <ul className={styles.navList}>
            {nav.map(({ href, label, icon: Icon, current = false }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.navLink} ${focus.ring}`}
                  aria-current={current ? 'page' : undefined}
                >
                  <Icon size={size.icon.md} strokeWidth={size.iconStroke} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main id={mainId} tabIndex={-1} className={styles.main}>
          {children}
        </main>
      </div>
      <ToastHost />
    </TooltipProvider>
  )
}
