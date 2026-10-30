const UNIQUE_VIOLATION = '23505'

function prop(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null && key in value ? Reflect.get(value, key) : undefined
}

/**
 * The name of the unique index a write violated, or undefined for any other
 * error. Drizzle wraps the driver error in `cause`, so the chain is walked.
 */
export function violatedUniqueIndex(err: unknown): string | undefined {
  for (let e = err, depth = 0; e !== undefined && depth < 5; e = prop(e, 'cause'), depth++) {
    if (prop(e, 'code') === UNIQUE_VIOLATION) {
      const name = prop(e, 'constraint')
      return typeof name === 'string' ? name : undefined
    }
  }
  return undefined
}

/** The Postgres error code anywhere in the cause chain (for example `P0001` from RAISE). */
export function pgErrorCode(err: unknown): string | undefined {
  for (let e = err, depth = 0; e !== undefined && depth < 5; e = prop(e, 'cause'), depth++) {
    const code = prop(e, 'code')
    if (typeof code === 'string') return code
  }
  return undefined
}

/** The Postgres error message anywhere in the cause chain. */
export function pgErrorMessage(err: unknown): string | undefined {
  for (let e = err, depth = 0; e !== undefined && depth < 5; e = prop(e, 'cause'), depth++) {
    if (typeof prop(e, 'code') === 'string') {
      const message = prop(e, 'message')
      return typeof message === 'string' ? message : undefined
    }
  }
  return undefined
}
