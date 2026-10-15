// `collabo/no-untranslated-call`: user facing strings that live outside JSX must come from
// `t()` too. `i18next/no-literal-string` (jsx-only) covers JSX text and props; this covers
// toasts, alerts, form errors, navigation titles, and `accessibilityValue.text` (AC-5).

import {
  calleePath,
  childNode,
  childNodes,
  children,
  isUserText,
  nameOf,
  properties,
  type AstNode,
  type Context,
  type Rule,
} from './ast.ts'

/** Navigation option keys whose values a person reads. */
const navigationTextKeys = new Set([
  'title',
  'headerTitle',
  'headerBackTitle',
  'tabBarLabel',
  'tabBarAccessibilityLabel',
])

/** Toast and alert option keys whose values a person reads. */
const messageKeys = new Set(['title', 'message', 'text', 'description', 'text1', 'text2'])

const message = (where: string) => `Literal text in ${where}. Put it in a catalog in packages/i18n and pass t('…').`

function reportTextIn(node: AstNode, keys: ReadonlySet<string>, where: string, context: Context): void {
  if (isUserText(node)) {
    context.report({ node, message: message(where) })
    return
  }
  if (node.type === 'ObjectExpression') {
    for (const { key, value } of properties(node)) {
      if (keys.has(key)) reportTextIn(value, keys, where, context)
    }
    return
  }
  if (node.type === 'ArrayExpression') {
    for (const element of childNodes(node, 'elements')) reportTextIn(element, keys, where, context)
  }
}

/** Every object literal under `node`, such as the one an `options` function returns. */
function reportNavigationOptions(node: AstNode, where: string, context: Context): void {
  if (node.type === 'ObjectExpression') {
    for (const { key, value } of properties(node)) {
      if (navigationTextKeys.has(key) && isUserText(value)) context.report({ node: value, message: message(where) })
    }
  }
  for (const next of children(node)) reportNavigationOptions(next, where, context)
}

export const noUntranslatedCall: Rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow literal user facing strings passed to toasts, alerts, form errors, and navigation' },
  },
  create(context) {
    return {
      CallExpression(node) {
        const path = calleePath(node)
        const method = path.at(-1)
        const owner = path.at(-2)
        const args = childNodes(node, 'arguments')

        if (
          (owner === 'Toast' && method === 'show') ||
          (owner === 'Alert' && (method === 'alert' || method === 'prompt'))
        ) {
          for (const arg of args) reportTextIn(arg, messageKeys, `${owner}.${method}`, context)
        } else if (method === 'setError') {
          // setError(field, { message }): the field name is code, the message is text.
          for (const arg of args.slice(1)) reportTextIn(arg, new Set(['message']), 'setError', context)
        } else if (method === 'setOptions') {
          for (const arg of args) reportNavigationOptions(arg, 'navigation options', context)
        }
      },
      JSXAttribute(node) {
        const name = nameOf(childNode(node, 'name'))
        const value = childNode(node, 'value')
        const expression = value?.type === 'JSXExpressionContainer' ? childNode(value, 'expression') : undefined
        if (!expression) return
        if (name === 'options' || name === 'screenOptions') {
          reportNavigationOptions(expression, `the ${name} prop`, context)
        } else if (name === 'accessibilityValue') {
          reportTextIn(expression, new Set(['text']), 'accessibilityValue', context)
        }
      },
    }
  },
}
