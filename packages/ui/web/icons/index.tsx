// The custom icons for the console, on Lucide's 24 px grid and stroke, so they sit beside
// `lucide-react` icons and take the same props.

import type { LucideProps } from 'lucide-react'

import { size } from '../../tokens/index.ts'

function Frame({ size: pixels = size.icon.lg, strokeWidth = size.iconStroke, children, ...props }: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={pixels}
      height={pixels}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/** Collabo: two riders side by side, the mark on every Collabo badge. */
export function CollaboMark(props: LucideProps) {
  return (
    <Frame {...props}>
      <circle cx="8.5" cy="8" r="3.25" />
      <circle cx="15.5" cy="8" r="3.25" />
      <path d="M2.5 20a6 6 0 0 1 11.2-3" />
      <path d="M10.3 17A6 6 0 0 1 21.5 20" />
    </Frame>
  )
}
