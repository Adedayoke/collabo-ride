// Custom icons drawn on Lucide's grid (24 units, 1.75 stroke, round caps and joins), so they sit
// beside Lucide icons without looking borrowed. Every icon takes its color from a token.

import type { ComponentType, ReactNode } from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

import { size } from '../../tokens/index.ts'

export type IconProps = {
  readonly size?: number
  readonly color?: string
  readonly strokeWidth?: number
}

/** Anything drawable as an icon: a Lucide icon or one of the custom ones below. */
export type IconComponent = ComponentType<IconProps>

const iconStroke = size.iconStroke
const iconGrid = size.icon.lg

function Frame({
  size: px = iconGrid,
  color,
  strokeWidth = iconStroke,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <Svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  )
}

/** Collabo: two riders side by side, sharing one trip. */
export function CollaboMark(props: IconProps) {
  return (
    <Frame {...props}>
      <Circle cx="8.5" cy="8" r="3.25" />
      <Circle cx="15.5" cy="8" r="3.25" />
      <Path d="M2.5 20a6 6 0 0 1 11.2-3" />
      <Path d="M10.3 17A6 6 0 0 1 21.5 20" />
    </Frame>
  )
}

/** SOS: an emergency beacon with its light rays. */
export function SosMark(props: IconProps) {
  return (
    <Frame {...props}>
      <Path d="M6.5 18v-5.5a5.5 5.5 0 0 1 11 0V18" />
      <Path d="M4.5 18h15v3h-15z" />
      <Path d="M12 2.5v2" />
      <Path d="m4.6 5.6 1.4 1.4" />
      <Path d="m19.4 5.6-1.4 1.4" />
      <Path d="M12 12.5v2" />
    </Frame>
  )
}

/** Economy: a compact hatchback. */
export function EconomyCar(props: IconProps) {
  return (
    <Frame {...props}>
      <Path d="M3 16.5V13l2.2-4.5h8.6L18 13h3v3.5" />
      <Path d="M3 13h18" />
      <Path d="M9.5 16.5h5" />
      <Circle cx="7" cy="17" r="2" />
      <Circle cx="17" cy="17" r="2" />
    </Frame>
  )
}

/** Comfort: a roomier sedan with a longer boot. */
export function ComfortCar(props: IconProps) {
  return (
    <Frame {...props}>
      <Path d="M2 16.5V13.5l3.5-1 2.5-4h8l3 4 3 1v3" />
      <Path d="M5.5 12.5h13.5" />
      <Path d="M9.5 16.5h5" />
      <Circle cx="7" cy="17" r="2" />
      <Circle cx="17" cy="17" r="2" />
    </Frame>
  )
}

/** Luxury: the sedan with a star above it. */
export function LuxuryCar(props: IconProps) {
  return (
    <Frame {...props}>
      <Path d="M2 18.5V15.5l3.5-1 2.5-4h8l3 4 3 1v3" />
      <Path d="M9.5 18.5h5" />
      <Circle cx="7" cy="19" r="2" />
      <Circle cx="17" cy="19" r="2" />
      <Path d="m12 2.5.9 1.9 2.1.3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.4 2.1-.3z" />
    </Frame>
  )
}
