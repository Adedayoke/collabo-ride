// Smoke test 1 (spec 0009): BullMQ enqueue, delay, and retry on valkey-durable.
// Needs `pnpm infra:up`. If this fails, valkey-durable becomes a Redis container.
import { Queue, QueueEvents, Worker } from 'bullmq'

const url = new URL(process.env.VALKEY_DURABLE_URL ?? 'redis://:valkey-durable-dev-password@localhost:6380')
const connection = { host: url.hostname, port: Number(url.port), password: decodeURIComponent(url.password), maxRetriesPerRequest: null }
const name = `smoke-${Date.now()}`
const queue = new Queue(name, { connection })
const events = new QueueEvents(name, { connection })
await events.waitUntilReady()

const attempts = new Map()
const worker = new Worker(name, async (job) => {
  const n = (attempts.get(job.id) ?? 0) + 1
  attempts.set(job.id, n)
  if (job.name === 'flaky' && n < 3) throw new Error(`fail on attempt ${n}`)
  return { at: Date.now(), attempt: n }
}, { connection })

const check = (ok, label) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) process.exitCode = 1 }

try {
  const plain = await queue.add('plain', { hello: 'world' })
  check((await plain.waitUntilFinished(events, 10_000)).attempt === 1, 'enqueue: a job runs once')

  const start = Date.now()
  const delayed = await queue.add('delayed', {}, { delay: 1500 })
  const delayedResult = await delayed.waitUntilFinished(events, 10_000)
  check(delayedResult.at - start >= 1500, `delay: ran after ${delayedResult.at - start} ms (wanted at least 1500)`)

  const flaky = await queue.add('flaky', {}, { attempts: 3, backoff: { type: 'fixed', delay: 200 } })
  const flakyResult = await flaky.waitUntilFinished(events, 10_000)
  check(flakyResult.attempt === 3, `retry: succeeded on attempt ${flakyResult.attempt} of 3`)
} catch (err) {
  check(false, String(err))
} finally {
  await worker.close()
  await queue.obliterate({ force: true })
  await queue.close()
  await events.close()
}
