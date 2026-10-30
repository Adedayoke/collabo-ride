// Expressive moment: driver found (rider). The driver card rises with `springGentle`, the photo
// and plate fade in 60 ms apart, a success haptic lands with it, and screen readers hear it.

import { useTranslation } from '@collabo/i18n'
import { useEffect, type ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

import { announce } from '../a11y/announce.ts'
import { DriverCard, type DriverSummary } from '../components/driver-card.tsx'
import { haptics } from '../haptics.ts'

export type DriverFoundProps = {
  readonly driver: DriverSummary
  readonly children?: ReactNode
  readonly style?: StyleProp<ViewStyle>
}

export function DriverFound({ driver, children, style }: DriverFoundProps) {
  const { t } = useTranslation()
  useEffect(() => {
    haptics.success()
    announce(t('trip.driverFound'))
  }, [t])
  return (
    <DriverCard driver={driver} animateIn style={style}>
      {children}
    </DriverCard>
  )
}
