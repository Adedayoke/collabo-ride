import * as RadixTabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'

import focus from './focus.module.css'
import styles from './tabs.module.css'

export type TabItem<T extends string> = {
  readonly value: T
  /** Translated. */
  readonly label: string
  readonly content: ReactNode
}

export type TabsProps<T extends string> = {
  /** Translated name for the tab list, read by screen readers. */
  readonly label: string
  readonly tabs: readonly TabItem<T>[]
  readonly value: T
  readonly onChange: (value: T) => void
}

/** Radix tabs: arrow keys move between tabs, and only the active panel is in the tab order. */
export function Tabs<T extends string>({ label, tabs, value, onChange }: TabsProps<T>) {
  return (
    <RadixTabs.Root
      className={styles.root}
      value={value}
      onValueChange={(next) => {
        const tab = tabs.find((candidate) => candidate.value === next)
        if (tab) onChange(tab.value)
      }}
    >
      <RadixTabs.List className={styles.list} aria-label={label}>
        {tabs.map((tab) => (
          <RadixTabs.Trigger key={tab.value} value={tab.value} className={`${styles.tab} ${focus.ring}`}>
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((tab) => (
        <RadixTabs.Content key={tab.value} value={tab.value} className={`${styles.panel} ${focus.ring}`}>
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}
