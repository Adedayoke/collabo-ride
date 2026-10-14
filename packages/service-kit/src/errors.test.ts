import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import express from 'express'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { AppError, errorHandler, notFound } from './errors'

let server: Server
let base = ''

beforeAll(() => {
  const app = express()
  app.use(express.json({ limit: '1kb' }))
  app.get('/rate-limited', () => {
    throw new AppError(429, 'RATE_LIMITED', 'Slow down', 12)
  })
  app.get('/conflict', () => {
    throw new AppError(409, 'OFFER_TAKEN', 'Another driver took this offer')
  })
  app.get('/boom', () => {
    throw new Error('db password=hunter2 leaked in stack')
  })
  app.get('/boom-async', async () => {
    throw new Error('async failure')
  })
  app.post('/echo', (req, res) => void res.json(req.body))
  app.use(notFound)
  app.use(errorHandler)
  server = app.listen(0)
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => void server.close())

describe('AppError', () => {
  it('carries status, code, message, and an optional retryAfter', () => {
    const err = new AppError(429, 'RATE_LIMITED', 'Slow down', 5)
    expect(err).toBeInstanceOf(Error)
    expect(err).toMatchObject({ name: 'AppError', status: 429, code: 'RATE_LIMITED', message: 'Slow down', retryAfter: 5 })
  })
})

describe('errorHandler', () => {
  it('returns an AppError as { code, message } with its status', async () => {
    const res = await fetch(`${base}/conflict`)
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ code: 'OFFER_TAKEN', message: 'Another driver took this offer' })
    expect(res.headers.get('retry-after')).toBeNull()
  })

  it('adds retryAfter to the body and the retry-after header', async () => {
    const res = await fetch(`${base}/rate-limited`)
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('12')
    expect(await res.json()).toEqual({ code: 'RATE_LIMITED', message: 'Slow down', retryAfter: 12 })
  })

  it('hides unexpected errors behind a generic 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await fetch(`${base}/boom`)
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({ code: 'INTERNAL', message: 'Something went wrong' })
    expect(text).not.toContain('hunter2')
    vi.restoreAllMocks()
  })

  it('catches errors thrown from async handlers', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await fetch(`${base}/boom-async`)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ code: 'INTERNAL', message: 'Something went wrong' })
    vi.restoreAllMocks()
  })

  it('turns a malformed JSON body into BAD_REQUEST', async () => {
    const res = await fetch(`${base}/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"fare": ',
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ code: 'BAD_REQUEST', message: 'Malformed request body' })
  })

  it('answers an oversized body with a 4xx client error, not a 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await fetch(`${base}/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pad: 'x'.repeat(4096) }),
    })
    vi.restoreAllMocks()
    expect(res.status).toBe(413)
    expect(await res.json()).toEqual({ code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' })
  })
})

describe('errorHandler with an unsupported body charset', () => {
  it('answers 415 in the error shape', async () => {
    const res = await fetch(`${base}/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=klingon' },
      body: '{}',
    })
    expect(res.status).toBe(415)
    expect(await res.json()).toEqual({ code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Unsupported request body encoding' })
  })
})

describe('notFound', () => {
  it('returns NOT_FOUND in the error shape for an unknown route', async () => {
    const res = await fetch(`${base}/nowhere`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ code: 'NOT_FOUND', message: 'Route not found' })
  })
})
