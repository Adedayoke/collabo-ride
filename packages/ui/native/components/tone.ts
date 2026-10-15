// Status tones. Meaning is never color alone: every tone pairs its color with an icon whose
// shape differs (octagon, triangle, circle with i, the two person mark, check circle) and a word.

import { CircleCheck, Clock, Info, OctagonAlert, TriangleAlert } from 'lucide-react-native'

import type { ColorToken } from '../../tokens/index.ts'
import { CollaboMark, type IconComponent } from '../icons/index.tsx'

export const tones = ['success', 'info', 'caution', 'danger', 'collabo', 'neutral'] as const
export type Tone = (typeof tones)[number]

/** Foreground on its soft background. Every pair is in `tokens/pairs.ts`. */
export const toneStyle: Record<Tone, { fg: ColorToken; bg: ColorToken; icon: IconComponent }> = {
  success: { fg: 'primary', bg: 'primarySoft', icon: CircleCheck },
  info: { fg: 'info', bg: 'infoSoft', icon: Info },
  caution: { fg: 'caution', bg: 'cautionSoft', icon: TriangleAlert },
  danger: { fg: 'danger', bg: 'dangerSoft', icon: OctagonAlert },
  collabo: { fg: 'collaboText', bg: 'collaboSoft', icon: CollaboMark },
  neutral: { fg: 'textSecondary', bg: 'surfaceSunken', icon: Clock },
}
