// Lets an inline `style` set CSS variables, the one inline style the console allows
// (`collabo/ui-drift` reports any other key): `style={{ '--swatch': … } satisfies CssVariables}`.

export type CssVariables = Readonly<Record<`--${string}`, string>>

declare module 'react' {
  interface CSSProperties {
    [variable: `--${string}`]: string | number | undefined
  }
}
