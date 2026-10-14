import { randomUUID } from 'node:crypto'
import type { Server } from 'node:http'
import express, { type Express, type RequestHandler } from 'express'
import { CONTEXT_HEADERS, type RequestContext, verifyContext } from './context'
import type { BaseEnv } from './env'
import { AppError, errorHandler, notFound } from './errors'

declare global {
  namespace Express {
    interface Request {
      requestId: string
      ctx?: RequestContext
    }
  }
}

/** Reuse the caller's `x-request-id` or start a new one, and echo it back. */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header(CONTEXT_HEADERS.requestId)
  req.requestId = incoming && incoming.length <= 128 ? incoming : randomUUID()
  res.setHeader(CONTEXT_HEADERS.requestId, req.requestId)
  next()
}

/** Reject a request whose gateway signed context is missing, stale, or forged. */
export function requireContext(key: string): RequestHandler {
  return (req, _res, next) => {
    const check = verifyContext(req.headers, key)
    if (!check.ok) {
      next(new AppError(401, 'BAD_CONTEXT', check.reason))
      return
    }
    req.ctx = check.context
    next()
  }
}

export interface ServiceOptions {
  env: BaseEnv
  /**
   * Check the gateway signed context on every route after `/health`.
   * True for every service except the gateway itself.
   */
  signedContext?: boolean
  routes?: (app: Express) => void
}

export function createService({ env, signedContext = true, routes }: ServiceOptions): Express {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', true)
  app.use(requestId)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: env.SERVICE_NAME })
  })
  app.use(express.json({ limit: '1mb' }))
  if (signedContext) app.use(requireContext(env.GATEWAY_CONTEXT_KEY))
  routes?.(app)
  app.use(notFound)
  app.use(errorHandler)
  return app
}

/** Listen on the service port and close cleanly on SIGTERM or SIGINT. */
export function startService(app: Express, env: BaseEnv): Server {
  const server = app.listen(env.PORT, () => {
    console.log(`${env.SERVICE_NAME} listening on :${env.PORT}`)
  })
  const stop = () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
  return server
}
