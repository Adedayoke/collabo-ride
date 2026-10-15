// `css-drift`: the CSS module half of `collabo/ui-drift` (oxlint does not read CSS). In
// `*.module.css`, a color, font size, line height, spacing, or radius must come from a
// `var(--…)` defined in `tokens.css` (or a local variable set from one). Allowed literals: `0`,
// percentages, `auto`, and the color keywords below. A genuine one off goes under a
// `/* ui-drift-ok: <reason> */` comment on the line above.
//
// Run: `node lint/css-drift.ts '<glob>' …` (the `lint:css` script). Prints `file:line: message`
// per finding and exits 1 on any.

import { glob, readFile } from 'node:fs/promises'
import { relative } from 'node:path'

import { parse, type Declaration } from 'postcss'

export type CssFinding = { readonly file: string; readonly line: number; readonly message: string }

const spacingProperty =
  /^(padding|margin)(-(top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?$|^(gap|row-gap|column-gap|top|right|bottom|left|inset(-.+)?)$/
const radiusProperty = /^border(-.+)?-radius$/
const typeProperty = /^(font-size|line-height)$/
/** Properties whose whole value is one color. */
const colorProperty =
  /^(color|background-color|border(-(top|right|bottom|left|block|inline))?-color|outline-color|text-decoration-color|caret-color|accent-color|fill|stroke)$/
/** Shorthands that may carry a color among other parts. */
const colorShorthand = /^(background|border(-(top|right|bottom|left|block|inline))?|outline|box-shadow|text-shadow)$/

const colorLiteral = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i
const colorWords = new Set(['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'none'])
const lengthWords = new Set(['0', 'auto', 'inherit', 'initial', 'unset', 'normal'])
/** A number with a unit (or a bare number): a raw length, size, or line height. */
const rawLength = /(^|[\s(,*/+-])-?\d*\.?\d+(px|rem|em|pt|vh|vw|ch|ex)?(?=$|[\s),*/+])/

/** Splits a value on spaces outside parentheses: `0 var(--a) calc(1px + 2px)` → 3 parts. */
function parts(value: string): string[] {
  const result: string[] = []
  let depth = 0
  let current = ''
  for (const char of value.trim()) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (/\s/.test(char) && depth === 0) {
      if (current) result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  if (current) result.push(current)
  return result
}

/** One part of a length value: a variable, an allowed word, a percentage, or `calc()` of those. */
function isTokenLength(part: string): boolean {
  if (lengthWords.has(part) || part.endsWith('%')) return true
  if (/^-?var\(--[\w-]+(,.*)?\)$/.test(part)) return true
  if (part.startsWith('calc(')) {
    // Inside calc, variables and plain multipliers are fine; a length with a unit is not.
    const inner = part.replaceAll(/var\(--[\w-]+\)/g, 'var')
    return !/\d(px|rem|em|pt|vh|vw|ch|ex)\b/.test(inner)
  }
  return false
}

function isEscaped(declaration: Declaration): boolean {
  const previous = declaration.prev()
  return previous?.type === 'comment' && /^ui-drift-ok:\s*\S/.test(previous.text)
}

function check(declaration: Declaration): string | undefined {
  const property = declaration.prop.toLowerCase()
  const value = declaration.value.trim()
  if (property.startsWith('--')) return undefined

  if (colorProperty.test(property)) {
    const isVariable = /^var\(--[\w-]+(,.*)?\)$/.test(value)
    if (!isVariable && !colorWords.has(value.toLowerCase())) return `\`${value}\` for ${property} is not a color token`
    return undefined
  }
  if (colorShorthand.test(property) && colorLiteral.test(value)) {
    return `a literal color in ${property} (\`${value}\`) is not a color token`
  }
  if (typeProperty.test(property)) {
    if (!parts(value).every(isTokenLength)) {
      return `\`${value}\` for ${property} is not a type token`
    }
    return undefined
  }
  if (spacingProperty.test(property) || radiusProperty.test(property)) {
    const scale = radiusProperty.test(property) ? 'radius' : 'spacing'
    const offending = parts(value.replace(/\s*\/\s*/g, ' ')).find((part) => !isTokenLength(part))
    if (offending && rawLength.test(` ${offending}`)) return `\`${offending}\` in ${property} is off the ${scale} scale`
    if (offending) return `\`${offending}\` in ${property} is not a ${scale} token`
  }
  return undefined
}

/** Every finding in one CSS module's source. */
export function checkCss(css: string, file: string): CssFinding[] {
  const findings: CssFinding[] = []
  parse(css, { from: file }).walkDecls((declaration) => {
    const message = check(declaration)
    if (message && !isEscaped(declaration)) {
      findings.push({
        file,
        line: declaration.source?.start?.line ?? 0,
        message: `${message}. Use a var(--…) from tokens.css, or put /* ui-drift-ok: <reason> */ above a real one off.`,
      })
    }
  })
  return findings
}

async function main(patterns: readonly string[]): Promise<number> {
  if (patterns.length === 0) {
    console.error("Usage: node lint/css-drift.ts '<glob>' …")
    return 2
  }
  const files = new Set<string>()
  for (const pattern of patterns) {
    for await (const file of glob(pattern, { exclude: (path) => path.includes('node_modules') })) files.add(file)
  }
  const findings: CssFinding[] = []
  for (const file of [...files].toSorted()) {
    findings.push(...checkCss(await readFile(file, 'utf8'), relative(process.cwd(), file).replaceAll('\\', '/')))
  }
  for (const finding of findings) console.log(`${finding.file}:${finding.line}: ${finding.message}`)
  return findings.length > 0 ? 1 : 0
}

if (import.meta.main) {
  process.exitCode = await main(process.argv.slice(2))
}
