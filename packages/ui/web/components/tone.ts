// Status tones for the console. Meaning is never color alone: each tone pairs its color with
// an icon whose shape differs and a word, matching the native kit's `tone.ts`.

import { CircleCheck, Clock, Info, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { CollaboMark } from '../icons/index.tsx'

export const tones = ['success', 'info', 'caution', 'danger', 'collabo', 'neutral'] as const
export type Tone = (typeof tones)[number]

export const toneIcon: Record<Tone, LucideIcon | ComponentType<{ size?: number; strokeWidth?: number }>> = {
  success: CircleCheck,
  info: Info,
  caution: TriangleAlert,
  danger: OctagonAlert,
  collabo: CollaboMark,
  neutral: Clock,
}
