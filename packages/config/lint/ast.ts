// The few AST shapes the `collabo` rules read, with guards. Rules see oxlint's ESTree
// compatible AST and use syntax only (oxlint gives JS plugins no type checker).

export type AstNode = { readonly type: string; readonly range?: readonly [number, number] }

export type Context = {
  readonly filename: string
  /** The rule's options from the config, such as `[{ web: true }]`. */
  readonly options?: readonly unknown[]
  readonly sourceCode: { readonly text: string; getCommentsBefore?: (node: AstNode) => readonly Comment[] }
  report(diagnostic: { node: AstNode; message: string }): void
}

export type Comment = { readonly type: string; readonly value: string; readonly range?: readonly [number, number] }

export type Rule = {
  readonly meta: {
    readonly type: 'problem' | 'suggestion'
    readonly docs: { readonly description: string }
    /** JSON Schema for the rule's options; oxlint refuses options on a rule without one. */
    readonly schema?: readonly unknown[]
  }
  create(context: Context): Record<string, (node: AstNode) => void>
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

export const isNode = (value: unknown): value is AstNode => isObject(value) && typeof value.type === 'string'

/** A field of a node, read without trusting its shape. */
export function child(node: AstNode, key: string): unknown {
  const fields: unknown = node
  return isObject(fields) ? fields[key] : undefined
}

export function childNode(node: AstNode, key: string): AstNode | undefined {
  const value = child(node, key)
  return isNode(value) ? value : undefined
}

export function childNodes(node: AstNode, key: string): AstNode[] {
  const value = child(node, key)
  return Array.isArray(value) ? value.filter(isNode) : []
}

/** Every direct child node, for a generic walk. */
export function children(node: AstNode): AstNode[] {
  const result: AstNode[] = []
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') continue
    if (isNode(value)) result.push(value)
    else if (Array.isArray(value)) result.push(...value.filter(isNode))
  }
  return result
}

/** An identifier's name or a string literal's value (property keys, member names). */
export function nameOf(node: AstNode | undefined): string | undefined {
  if (!node) return undefined
  if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
    const name = child(node, 'name')
    return typeof name === 'string' ? name : undefined
  }
  if (node.type === 'Literal') {
    const value = child(node, 'value')
    return typeof value === 'string' ? value : undefined
  }
  return undefined
}

/** A string a person would read: a non blank string literal, or a template with literal text. */
export function isUserText(node: AstNode | undefined): boolean {
  if (!node) return false
  if (node.type === 'Literal') {
    const value = child(node, 'value')
    return typeof value === 'string' && /\p{L}/u.test(value)
  }
  if (node.type === 'TemplateLiteral') {
    return childNodes(node, 'quasis').some((quasi) => {
      const value = child(quasi, 'value')
      return isObject(value) && typeof value.cooked === 'string' && /\p{L}/u.test(value.cooked)
    })
  }
  return false
}

/** `{ key: value }` pairs of an object literal, skipping spreads and computed keys. */
export function properties(node: AstNode): { key: string; value: AstNode }[] {
  if (node.type !== 'ObjectExpression') return []
  return childNodes(node, 'properties').flatMap((property) => {
    if (property.type !== 'Property' || child(property, 'computed') === true) return []
    const key = nameOf(childNode(property, 'key'))
    const value = childNode(property, 'value')
    return key && value ? [{ key, value }] : []
  })
}

/** `Toast.show` → ['Toast', 'show']; `form.setError` → ['form', 'setError']; `alert` → ['alert']. */
export function calleePath(call: AstNode): string[] {
  const path: string[] = []
  let current = childNode(call, 'callee')
  while (current?.type === 'MemberExpression') {
    const property = nameOf(childNode(current, 'property'))
    if (property) path.unshift(property)
    current = childNode(current, 'object')
  }
  const root = nameOf(current)
  if (root) path.unshift(root)
  return path
}
