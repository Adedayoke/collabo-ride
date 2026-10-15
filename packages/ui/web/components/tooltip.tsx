import * as RadixTooltip from '@radix-ui/react-tooltip'
import type { ReactElement, ReactNode } from 'react'

import styles from './tooltip.module.css'

export type TooltipProps = {
  /** Translated. Extra detail only: never the only place a control's name lives. */
  readonly content: string
  /** One focusable element; the tooltip shows on hover and on keyboard focus. */
  readonly children: ReactElement
}

/** Wraps the console once (`PageShell` does it), so every tooltip shares one delay. */
export function TooltipProvider({ children }: { readonly children: ReactNode }) {
  return <RadixTooltip.Provider delayDuration={400}>{children}</RadixTooltip.Provider>
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content className={styles.tooltip} sideOffset={6}>
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
