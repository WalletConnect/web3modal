import { describe, expect, it, vi } from 'vitest'

import { waitForSignatureConfirmation } from '../utils/waitForSignatureConfirmation'

describe('waitForSignatureConfirmation', () => {
  it('resolves when signature status is confirmed without an error', async () => {
    const connection = {
      getSignatureStatus: vi.fn().mockResolvedValue({
        value: { confirmationStatus: 'confirmed', err: null }
      })
    }

    await expect(
      waitForSignatureConfirmation(connection, 'sig-ok', {
        timeoutMs: 100,
        pollIntervalMs: 10
      })
    ).resolves.toBeUndefined()
  })

  it('rejects when signature status includes an on-chain error', async () => {
    const connection = {
      getSignatureStatus: vi.fn().mockResolvedValue({
        value: { err: { InstructionError: [0, 'Custom'] } }
      })
    }

    await expect(
      waitForSignatureConfirmation(connection, 'sig-failed', {
        timeoutMs: 100,
        pollIntervalMs: 10
      })
    ).rejects.toThrow('Transaction failed on-chain')
  })

  it('rejects when signature status stays null', async () => {
    const connection = {
      getSignatureStatus: vi.fn().mockResolvedValue({ value: null })
    }

    await expect(
      waitForSignatureConfirmation(connection, 'sig-pending', {
        timeoutMs: 40,
        pollIntervalMs: 10
      })
    ).rejects.toThrow('Transaction confirmation timed out')
  })

  it('rejects at the timeout when getSignatureStatus never settles', async () => {
    const connection = {
      getSignatureStatus: vi.fn(() => new Promise(() => undefined))
    } as { getSignatureStatus: ReturnType<typeof vi.fn> }

    await expect(
      waitForSignatureConfirmation(connection, 'sig-hung', {
        timeoutMs: 40,
        pollIntervalMs: 10_000
      })
    ).rejects.toThrow('Transaction confirmation timed out')
  }, 500)

  it('does not resolve success from a late poll after the timeout', async () => {
    let resolveStatus: (value: unknown) => void = () => undefined
    const connection = {
      getSignatureStatus: vi.fn(
        () =>
          new Promise(resolve => {
            resolveStatus = resolve
          })
      )
    } as { getSignatureStatus: ReturnType<typeof vi.fn> }

    const confirmation = waitForSignatureConfirmation(connection, 'sig-late', {
      timeoutMs: 40,
      pollIntervalMs: 10_000
    })

    await expect(confirmation).rejects.toThrow('Transaction confirmation timed out')

    resolveStatus({ value: { confirmationStatus: 'confirmed', err: null } })
    await Promise.resolve()
    await Promise.resolve()

    await expect(confirmation).rejects.toThrow('Transaction confirmation timed out')
  }, 500)
})
