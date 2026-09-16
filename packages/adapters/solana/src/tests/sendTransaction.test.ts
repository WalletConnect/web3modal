import { SendTransactionError } from '@solana/web3.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SolanaAdapter } from '../client'
import { SolStoreUtil } from '../utils/SolanaStoreUtil'
import { TestConstants } from './util/TestConstants'

vi.mock('../utils/SolanaStoreUtil', () => ({
  SolStoreUtil: {
    state: {
      connection: null
    },
    setConnection: vi.fn()
  }
}))

describe('SolanaAdapter - sendTransaction error handling', () => {
  let adapter: SolanaAdapter
  let mockSendTransactionProvider: any

  beforeEach(() => {
    vi.clearAllMocks()

    adapter = new SolanaAdapter()

    const mockConnection = {
      getSignatureStatus: vi.fn().mockResolvedValue({
        value: { confirmationStatus: 'confirmed' }
      }),
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: 'EZySCpmzXRuUtM95P2JGv9SitqYph6Nv6HaYBK7a8PKJ',
        lastValidBlockHeight: 1
      })
    }
    SolStoreUtil.state.connection = mockConnection as any

    mockSendTransactionProvider = {
      publicKey: TestConstants.accounts[0].publicKey,
      sendTransaction: vi.fn()
    }
  })

  it('should throw custom error when "Transfer: insufficient lamports" pattern is found in message', async () => {
    const mockError = new Error('Transfer: insufficient lamports 12345, need 67890')
    mockError.name = 'SendTransactionError'
    Object.defineProperty(mockError, 'transactionError', {
      value: {
        message: 'Transfer: insufficient lamports 12345, need 67890'
      }
    })
    Object.setPrototypeOf(mockError, SendTransactionError.prototype)

    mockSendTransactionProvider.sendTransaction.mockRejectedValue(mockError)

    await expect(
      adapter.sendTransaction({
        provider: mockSendTransactionProvider as any,
        to: TestConstants.accounts[1].address,
        value: 1000000
      })
    ).rejects.toThrow('Not enough SOL to cover this transfer')
  })

  it('should throw custom error when "Transfer: insufficient lamports" pattern is found in logs only', async () => {
    const mockError = new Error('Transaction simulation failed')
    mockError.name = 'SendTransactionError'
    Object.defineProperty(mockError, 'transactionError', {
      value: {
        message: 'Transaction simulation failed'
      }
    })
    Object.defineProperty(mockError, 'logs', {
      value: [
        'Program log: Instruction: Transfer',
        'Program log: Transfer: insufficient lamports 12345, need 67890',
        'Program failed to complete'
      ]
    })
    Object.setPrototypeOf(mockError, SendTransactionError.prototype)

    mockSendTransactionProvider.sendTransaction.mockRejectedValue(mockError)

    await expect(
      adapter.sendTransaction({
        provider: mockSendTransactionProvider as any,
        to: TestConstants.accounts[1].address,
        value: 1000000
      })
    ).rejects.toThrow('Not enough SOL to cover this transfer')
  })

  it('should throw custom error when "Insufficient funds for fee" pattern is found', async () => {
    const mockError = new Error('Insufficient funds for fee')
    mockError.name = 'SendTransactionError'
    Object.defineProperty(mockError, 'transactionError', {
      value: {
        message: 'Insufficient funds for fee'
      }
    })
    Object.setPrototypeOf(mockError, SendTransactionError.prototype)

    mockSendTransactionProvider.sendTransaction.mockRejectedValue(mockError)

    await expect(
      adapter.sendTransaction({
        provider: mockSendTransactionProvider as any,
        to: TestConstants.accounts[1].address,
        value: 1000000
      })
    ).rejects.toThrow('Not enough SOL to cover fees or rent')
  })

  it('should throw custom error when "Attempt to debit" pattern is found', async () => {
    const mockError = new Error('Attempt to debit an account but found no record of a prior credit')
    mockError.name = 'SendTransactionError'
    Object.defineProperty(mockError, 'transactionError', {
      value: {
        message: 'Attempt to debit an account but found no record of a prior credit'
      }
    })
    Object.setPrototypeOf(mockError, SendTransactionError.prototype)

    mockSendTransactionProvider.sendTransaction.mockRejectedValue(mockError)

    await expect(
      adapter.sendTransaction({
        provider: mockSendTransactionProvider as any,
        to: TestConstants.accounts[1].address,
        value: 1000000
      })
    ).rejects.toThrow('Not enough SOL to cover fees or rent')
  })

  it('should throw custom error when pattern is found in both message and logs', async () => {
    const mockError = new Error('Transaction failed with error')
    mockError.name = 'SendTransactionError'
    Object.defineProperty(mockError, 'transactionError', {
      value: {
        message: 'Transaction failed with error'
      }
    })
    Object.defineProperty(mockError, 'logs', {
      value: [
        'Program log: Starting transfer',
        'Program log: Insufficient funds for fee payment',
        'Program failed'
      ]
    })
    Object.setPrototypeOf(mockError, SendTransactionError.prototype)

    mockSendTransactionProvider.sendTransaction.mockRejectedValue(mockError)

    await expect(
      adapter.sendTransaction({
        provider: mockSendTransactionProvider as any,
        to: TestConstants.accounts[1].address,
        value: 1000000
      })
    ).rejects.toThrow('Not enough SOL to cover fees or rent')
  })

  it('should re-throw original SendTransactionError when no pattern matches', async () => {
    const mockError = new Error('Some other transaction error')
    mockError.name = 'SendTransactionError'
    Object.defineProperty(mockError, 'transactionError', {
      value: { message: 'Some other transaction error' }
    })
    Object.setPrototypeOf(mockError, SendTransactionError.prototype)

    mockSendTransactionProvider.sendTransaction.mockRejectedValue(mockError)

    await expect(
      adapter.sendTransaction({
        provider: mockSendTransactionProvider as any,
        to: TestConstants.accounts[1].address,
        value: 1000000
      })
    ).rejects.toThrow('Some other transaction error')
  })

  it('should re-throw original error when it is not a SendTransactionError', async () => {
    const mockError = new Error('Network connection failed')

    mockSendTransactionProvider.sendTransaction.mockRejectedValue(mockError)

    await expect(
      adapter.sendTransaction({
        provider: mockSendTransactionProvider as any,
        to: TestConstants.accounts[1].address,
        value: 1000000
      })
    ).rejects.toThrow('Network connection failed')
  })

  it('should handle case-insensitive error pattern matching', async () => {
    const mockError = new Error('transfer: INSUFFICIENT LAMPORTS')
    mockError.name = 'SendTransactionError'
    Object.defineProperty(mockError, 'transactionError', {
      value: {
        message: 'transfer: INSUFFICIENT LAMPORTS'
      }
    })
    Object.setPrototypeOf(mockError, SendTransactionError.prototype)

    mockSendTransactionProvider.sendTransaction.mockRejectedValue(mockError)

    await expect(
      adapter.sendTransaction({
        provider: mockSendTransactionProvider as any,
        to: TestConstants.accounts[1].address,
        value: 1000000
      })
    ).rejects.toThrow('Not enough SOL to cover this transfer')
  })

  it('should prioritize first matching pattern when multiple patterns could match', async () => {
    const mockError = new Error('Attempt to debit an account but found no record of a prior credit')
    mockError.name = 'SendTransactionError'
    Object.defineProperty(mockError, 'transactionError', {
      value: {
        message: 'Attempt to debit an account but found no record of a prior credit'
      }
    })
    Object.setPrototypeOf(mockError, SendTransactionError.prototype)

    mockSendTransactionProvider.sendTransaction.mockRejectedValue(mockError)

    await expect(
      adapter.sendTransaction({
        provider: mockSendTransactionProvider as any,
        to: TestConstants.accounts[1].address,
        value: 1000000
      })
    ).rejects.toThrow('Not enough SOL to cover fees or rent')
  })

  it('should reject when signature status includes an on-chain error', async () => {
    mockSendTransactionProvider.sendTransaction.mockResolvedValue('sig-failed')
    ;(SolStoreUtil.state.connection as any).getSignatureStatus.mockResolvedValue({
      value: { err: { InstructionError: [0, 'Custom'] } }
    })

    await expect(
      adapter.sendTransaction({
        provider: mockSendTransactionProvider as any,
        to: TestConstants.accounts[1].address,
        value: 1
      })
    ).rejects.toThrow('Transaction failed on-chain')
  })

  it('should reject when signature confirmation times out', async () => {
    vi.useFakeTimers()
    mockSendTransactionProvider.sendTransaction.mockResolvedValue('sig-pending')
    ;(SolStoreUtil.state.connection as any).getSignatureStatus.mockResolvedValue({
      value: null
    })

    try {
      const assertion = expect(
        adapter.sendTransaction({
          provider: mockSendTransactionProvider as any,
          to: TestConstants.accounts[1].address,
          value: 1
        })
      ).rejects.toThrow('Transaction confirmation timed out')

      await vi.advanceTimersByTimeAsync(60_000)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('SolanaAdapter - writeSolanaTransaction confirmation', () => {
  let adapter: SolanaAdapter
  let mockSendTransactionProvider: any

  beforeEach(() => {
    vi.clearAllMocks()

    adapter = new SolanaAdapter()

    const mockConnection = {
      getSignatureStatus: vi.fn().mockResolvedValue({
        value: { confirmationStatus: 'confirmed' }
      }),
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: 'EZySCpmzXRuUtM95P2JGv9SitqYph6Nv6HaYBK7a8PKJ',
        lastValidBlockHeight: 1
      })
    }
    SolStoreUtil.state.connection = mockConnection as any

    mockSendTransactionProvider = {
      publicKey: TestConstants.accounts[0].publicKey,
      sendTransaction: vi.fn()
    }
  })

  function writeParams() {
    return {
      provider: mockSendTransactionProvider as any,
      instructions: [],
      caipNetwork: {} as any,
      caipAddress:
        `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${TestConstants.accounts[0].address}` as `solana:${string}:${string}`
    }
  }

  it('rejects on status.value.err', async () => {
    mockSendTransactionProvider.sendTransaction.mockResolvedValue('sig-failed')
    ;(SolStoreUtil.state.connection as any).getSignatureStatus.mockResolvedValue({
      value: { err: { InstructionError: [0, 'Custom'] } }
    })

    await expect(adapter.writeSolanaTransaction(writeParams())).rejects.toThrow(
      'Transaction failed on-chain'
    )
  })

  it('rejects on confirmation timeout', async () => {
    vi.useFakeTimers()
    mockSendTransactionProvider.sendTransaction.mockResolvedValue('sig-pending')
    ;(SolStoreUtil.state.connection as any).getSignatureStatus.mockResolvedValue({
      value: null
    })

    try {
      const assertion = expect(adapter.writeSolanaTransaction(writeParams())).rejects.toThrow(
        'Transaction confirmation timed out'
      )

      await vi.advanceTimersByTimeAsync(60_000)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })
})
