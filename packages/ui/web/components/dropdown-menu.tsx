import * as RadixMenu from '@radix-ui/react-dropdown-menu'
import type { LucideIcon } from 'lucide-react'
import type { ReactElement } from 'react'

import { size } from '../../tokens/index.ts'
import menu from './menu.module.css'

export type MenuAction = {
  readonly key: string
  /** Translated. */
  readonly label: string
  readonly icon?: LucideIcon
  readonly onSelect: () => void
  readonly destructive?: boolean
  readonly disabled?: boolean
}

export type DropdownMenuProps = {
  /** The control that opens the menu, usually an `IconButton` labelled "More actions". */
  readonly trigger: ReactElement
  readonly actions: readonly MenuAction[]
}

/** A Radix menu of actions: arrow keys move, Enter picks, Escape closes and returns focus. */
export function DropdownMenu({ trigger, actions }: DropdownMenuProps) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content className={menu.content} align="end" sideOffset={4}>
          {actions.map(({ key, label, icon: Icon, onSelect, destructive = false, disabled = false }) => (
            <RadixMenu.Item
              key={key}
              className={[menu.item, destructive ? menu.destructive : undefined].filter(Boolean).join(' ')}
              disabled={disabled}
              onSelect={onSelect}
            >
              <span className={menu.itemLabel}>
                {Icon ? <Icon size={size.icon.md} strokeWidth={size.iconStroke} aria-hidden="true" /> : null}
                {label}
              </span>
            </RadixMenu.Item>
          ))}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  )
}
