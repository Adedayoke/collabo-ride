import { describe, expect, it } from 'vitest'

import { color } from './color.ts'
import { renderTokensCss } from './css.ts'

describe('tokens.css', () => {
  const css = renderTokensCss('./fonts')

  it('puts light values on :root and dark values under the media query', () => {
    expect(css).toMatch(/:root \{[^}]*--color-bg: #FAFAF7;/)
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s*:root \{[^}]*--color-bg: #0F1412;/)
  })

  it('lets the theme toggle force either mode after the media query', () => {
    const media = css.indexOf('@media')
    expect(css.indexOf('[data-theme="light"]')).toBeGreaterThan(media)
    expect(css).toContain(`[data-theme="dark"] {\n  --color-bg: ${color.dark.bg};`)
  })

  it('names variables in kebab case', () => {
    expect(css).toContain('--color-text-secondary: #5A615C;')
    expect(css).toContain('--font-size-price-sm: 17px;')
    expect(css).toContain('--space-lg: 16px;')
  })

  it('loads every font face as swap', () => {
    expect(css.match(/@font-face/g)).toHaveLength(8)
    expect(css).not.toMatch(/font-display: (?!swap)/)
  })
})
