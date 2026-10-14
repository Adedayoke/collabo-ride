import type { ErrorRequestHandler, RequestHandler } from 'express'

/** The error body every service returns: `{ code, message, retryAfter? }`. */
export interface ErrorBody {
  code: string
  message: string
  retryAfter?: number
}

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfter?: number,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

const BODY_ERRORS: Record<number, ErrorBody> = {
  400: { code: 'BAD_REQUEST', message: 'Malformed request body' },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' },
  415: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Unsupported request body encoding' },
}

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'))
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    const body: ErrorBody = { code: err.code, message: err.message }
    if (err.retryAfter !== undefined) {
      body.retryAfter = err.retryAfter
      res.setHeader('retry-after', String(err.retryAfter))
    }
    res.status(err.status).json(body)
    return
  }
  // express.json() rejects bad bodies with a client status: 400 malformed,
  // 413 too large, 415 unsupported charset or encoding.
  const status = typeof err === 'object' && err !== null && 'status' in err ? err.status : undefined
  const body = typeof status === 'number' ? BODY_ERRORS[status] : undefined
  if (typeof status === 'number' && body) {
    res.status(status).json(body)
    return
  }
  console.error(err)
  res.status(500).json({ code: 'INTERNAL', message: 'Something went wrong' } satisfies ErrorBody)
}
