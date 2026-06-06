import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({ adapter })
}

declare global {
  // Allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma

// Prisma Postgres (pooled.db.prisma.io) pauses on idle. The first query after a
// pause can fail with a transient connection error while the database wakes up;
// retrying succeeds. These are the error signals that indicate such transients —
// Prisma connection codes plus the underlying pg/socket codes surfaced by the
// driver adapter.
const TRANSIENT_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017'])
const TRANSIENT_SOCKET_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'EHOSTUNREACH',
  'ENETUNREACH',
])

function isTransientDbError(error: unknown): boolean {
  // Unwrap AggregateError (pg can throw these on connect)
  const candidates: unknown[] =
    error instanceof AggregateError ? [error, ...error.errors] : [error]

  return candidates.some((e) => {
    if (!e || typeof e !== 'object') return false
    const code = (e as { code?: unknown }).code
    if (typeof code === 'string') {
      if (TRANSIENT_PRISMA_CODES.has(code)) return true
      if (TRANSIENT_SOCKET_CODES.has(code)) return true
    }
    const message = (e as { message?: unknown }).message
    return (
      typeof message === 'string' &&
      /can't reach database server|connection (terminated|refused|closed)/i.test(
        message,
      )
    )
  })
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Runs a database operation, retrying transient connection failures with
 * exponential backoff. Use for first-hit reads that may race a cold start of
 * the (idle-paused) Prisma Postgres database. Non-transient errors (bad query,
 * unique constraint, etc.) are thrown immediately.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  { retries = 3, baseDelayMs = 250 }: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt === retries || !isTransientDbError(error)) {
        throw error
      }
      const delay = baseDelayMs * 2 ** attempt
      console.warn(
        `[withDbRetry] transient DB error, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`,
      )
      await sleep(delay)
    }
  }
  throw lastError
}