import type { Connection } from '@solana/web3.js'

export const SIGNATURE_CONFIRMATION_TIMEOUT_MS = 60_000
export const SIGNATURE_CONFIRMATION_POLL_MS = 1_000

export async function waitForSignatureConfirmation(
  connection: Pick<Connection, 'getSignatureStatus'>,
  signature: string,
  options: { timeoutMs?: number; pollIntervalMs?: number } = {}
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? SIGNATURE_CONFIRMATION_TIMEOUT_MS
  const pollIntervalMs = options.pollIntervalMs ?? SIGNATURE_CONFIRMATION_POLL_MS

  let settled = false
  let pollInFlight = false
  let interval: ReturnType<typeof setInterval> | undefined
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const cleanup = () => {
    if (interval !== undefined) {
      clearInterval(interval)
      interval = undefined
    }

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }

  const wait = new Promise<void>((resolve, reject) => {
    const poll = async () => {
      if (settled || pollInFlight) {
        return
      }

      pollInFlight = true

      try {
        const status = await connection.getSignatureStatus(signature)

        if (settled) {
          return
        }

        if (!status?.value) {
          return
        }

        if (status.value.err) {
          settled = true
          reject(new Error('Transaction failed on-chain'))

          return
        }

        settled = true
        resolve()
      } catch (error) {
        if (settled) {
          return
        }

        settled = true
        reject(error)
      } finally {
        pollInFlight = false
      }
    }

    void poll()
    interval = setInterval(() => {
      void poll()
    }, pollIntervalMs)
  })

  const timeout = new Promise<void>((_, reject) => {
    timeoutId = setTimeout(() => {
      settled = true
      reject(new Error('Transaction confirmation timed out'))
    }, timeoutMs)
  })

  try {
    await Promise.race([wait, timeout])
  } finally {
    settled = true
    cleanup()
  }
}
