// `collabo/ui-drift`: React Native style objects may only use values from `packages/ui/tokens`
// (AC-2). A literal color, an off scale spacing, size, or radius, or a raw font size is reported.
// Values come from expressions (`theme.spacing.lg`) or are `0`, percentages, `auto`, and
// `transparent`; a genuine one off goes under a `// ui-drift-ok: <reason>` comment.
//
// With `{ "web": true }` (the console and `packages/ui/web`, whose styles live in CSS modules
// checked by `css-drift.ts`), an inline `style` prop may only set CSS variables.

import { radius } from '../../ui/tokens/radius.ts'
import { size, spacing } from '../../ui/tokens/spacing.ts'
import { type } from '../../ui/tokens/type.ts'
import {
  calleePath,
  child,
  childNode,
  childNodes,
  children,
  nameOf,
  type AstNode,
  type Context,
  type Rule,
} from './ast.ts'

/** Every number inside a nested token object, such as `size.button.md`. */
function numbersIn(value: unknown): number[] {
  if (typeof value === 'number') return [value]
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(numbersIn)
  return []
}

const spacingScale = new Set(numbersIn(spacing))
const sizeScale = new Set([...spacingScale, ...numbersIn(size)])
const radiusScale = new Set(numbersIn(radius))
const fontSizeScale = new Set(Object.values(type).map((step) => step.size))
const lineHeightScale = new Set(Object.values(type).map((step) => step.lineHeight))

type Scale = { readonly name: string; readonly values: ReadonlySet<number>; readonly token: string }

const scales: readonly { readonly key: RegExp; readonly scale: Scale }[] = [
  {
    key: /^(padding|margin)(Top|Bottom|Left|Right|Start|End|Horizontal|Vertical|Block|BlockStart|BlockEnd|Inline|InlineStart|InlineEnd)?$|^(gap|rowGap|columnGap|top|bottom|left|right|start|end|inset\w*)$/,
    scale: { name: 'spacing', values: spacingScale, token: 'theme.spacing' },
  },
  {
    key: /^(width|height|minWidth|maxWidth|minHeight|maxHeight)$/,
    scale: { name: 'spacing or size', values: sizeScale, token: 'theme.spacing or theme.size' },
  },
  { key: /^border\w*Radius$/, scale: { name: 'radius', values: radiusScale, token: 'theme.radius' } },
  { key: /^fontSize$/, scale: { name: 'type', values: fontSizeScale, token: 'theme.text(step)' } },
  { key: /^lineHeight$/, scale: { name: 'type', values: lineHeightScale, token: 'theme.text(step)' } },
]

const colorKey = /color$/i
const allowedColorWords = new Set(['transparent', 'currentColor', 'inherit'])
const allowedSizeWords = new Set(['auto'])

const escape = /\/\/\s*ui-drift-ok:\s*\S/

/** True when the line above `node` carries `// ui-drift-ok: <reason>`. */
function isEscaped(node: AstNode, context: Context): boolean {
  const start = node.range?.[0]
  if (start === undefined) return false
  const text = context.sourceCode.text
  const lineStart = text.lastIndexOf('\n', start - 1)
  if (lineStart < 0) return false
  const previousStart = text.lastIndexOf('\n', lineStart - 1) + 1
  return escape.test(text.slice(previousStart, lineStart))
}

/** A number literal, including a negative one, or undefined. */
function numberOf(node: AstNode): number | undefined {
  if (node.type === 'Literal') {
    const value = child(node, 'value')
    return typeof value === 'number' ? value : undefined
  }
  if (node.type === 'UnaryExpression' && child(node, 'operator') === '-') {
    const argument = childNode(node, 'argument')
    const value = argument ? numberOf(argument) : undefined
    return value === undefined ? undefined : -value
  }
  return undefined
}

function stringOf(node: AstNode): string | undefined {
  if (node.type !== 'Literal') return undefined
  const value = child(node, 'value')
  return typeof value === 'string' ? value : undefined
}

function checkValue(key: string, value: AstNode, property: AstNode, context: Context): void {
  if (colorKey.test(key)) {
    const literal = stringOf(value)
    if (literal !== undefined && !allowedColorWords.has(literal)) {
      report(property, `\`${literal}\` for ${key} is not a color token. Use theme.color.…`, context)
    }
    return
  }
  const match = scales.find((entry) => entry.key.test(key))
  if (!match) return
  const number = numberOf(value)
  if (number !== undefined) {
    if (number !== 0 && !match.scale.values.has(Math.abs(number))) {
      report(property, `${number} for ${key} is off the ${match.scale.name} scale. Use ${match.scale.token}.`, context)
    }
    return
  }
  const literal = stringOf(value)
  if (literal !== undefined && !literal.endsWith('%') && !allowedSizeWords.has(literal)) {
    report(property, `\`${literal}\` for ${key} is not a token. Use ${match.scale.token}.`, context)
  }
}

function report(node: AstNode, message: string, context: Context): void {
  if (isEscaped(node, context)) return
  context.report({ node, message: `${message} A real one off needs \`// ui-drift-ok: <reason>\` above it.` })
}

/** Checks every object literal under `node`: style objects nest in arrays, ternaries, and callbacks. */
function checkStyles(node: AstNode, context: Context): void {
  if (node.type === 'ObjectExpression') {
    for (const property of childNodes(node, 'properties')) {
      if (property.type !== 'Property' || child(property, 'computed') === true) continue
      const key = nameOf(childNode(property, 'key'))
      const value = childNode(property, 'value')
      if (key && value) checkValue(key, value, property, context)
    }
  }
  for (const next of children(node)) checkStyles(next, context)
}

/** Web mode: an inline style may only set CSS variables; everything else lives in a CSS module. */
function checkCssVariablesOnly(node: AstNode, context: Context): void {
  if (node.type === 'ObjectExpression') {
    for (const property of childNodes(node, 'properties')) {
      const key = property.type === 'Property' ? nameOf(childNode(property, 'key')) : undefined
      if (key !== undefined && !key.startsWith('--')) {
        report(property, `Inline style \`${key}\` in the console. Put it in a CSS module on tokens.css.`, context)
      }
    }
    return
  }
  for (const next of children(node)) checkCssVariablesOnly(next, context)
}

const isWeb = (context: Context): boolean => {
  const [options] = context.options ?? []
  return typeof options === 'object' && options !== null && 'web' in options && options.web === true
}

export const uiDrift: Rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow style values that do not come from packages/ui/tokens' },
    schema: [{ type: 'object', properties: { web: { type: 'boolean' } }, additionalProperties: false }],
  },
  create(context) {
    const web = isWeb(context)
    return {
      CallExpression(node) {
        if (web) return
        const path = calleePath(node)
        const isStyleSheet = path.at(-2) === 'StyleSheet' && path.at(-1) === 'create'
        if (isStyleSheet || path.at(-1) === 'useAnimatedStyle') {
          for (const arg of childNodes(node, 'arguments')) checkStyles(arg, context)
        }
      },
      JSXAttribute(node) {
        const name = nameOf(childNode(node, 'name'))
        if (name === undefined || !(name === 'style' || name.endsWith('Style'))) return
        const value = childNode(node, 'value')
        const expression = value?.type === 'JSXExpressionContainer' ? childNode(value, 'expression') : undefined
        if (!expression) return
        if (web) checkCssVariablesOnly(expression, context)
        else checkStyles(expression, context)
      },
    }
  },
}
