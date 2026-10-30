import { size } from '../../tokens/index.ts'
import styles from './badge.module.css'
import tone from './tone.module.css'
import { toneIcon, type Tone } from './tone.ts'

export type BadgeProps = {
  readonly tone?: Tone
  /** Translated, such as `t('status.danger')` or a trip state. Color is never the only signal. */
  readonly children: string
}

/** A small status label: icon plus word on the tone's soft background. */
export function Badge({ tone: kind = 'neutral', children }: BadgeProps) {
  const Icon = toneIcon[kind]
  return (
    <span className={`${styles.badge} ${tone[kind]}`}>
      <Icon size={size.icon.sm} strokeWidth={size.iconStroke} aria-hidden="true" />
      {children}
    </span>
  )
}
