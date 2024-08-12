import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Provider } from '../src/utils/scaffold/SolanaTypesUtil'
import { WalletConnectProvider } from '../src/providers/WalletConnectProvider'
import { mockUniversalProvider } from './mocks/UniversalProvider.mock'
import { WalletStandardProvider } from '../src/providers/WalletStandardProvider'
import { mockWallet } from './mocks/Wallet.mock'
import { TestConstants } from './TestConstants'
import { PublicKey } from '@solana/web3.js'
import { mockLegacyTransaction, mockVersionedTransaction } from './mocks/Transaction.mock'

const providers: { name: string; provider: Provider }[] = [
  {
    name: 'WalletConnectProvider',
    provider: new WalletConnectProvider({
      provider: mockUniversalProvider(),
      chains: TestConstants.chains
    })
  },
  {
    name: 'WalletStandardProvider',
    provider: new WalletStandardProvider({
      wallet: mockWallet()
    })
  }
]

describe.each(providers)('Generic tests for all providers $name', ({ provider }) => {
  const events = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    accountsChanged: vi.fn(),
    chainChanged: vi.fn()
  }

  beforeAll(() => {
    provider.on('connect', events.connect)
    provider.on('disconnect', events.disconnect)
    provider.on('accountsChanged', events.accountsChanged)
    provider.on('chainChanged', events.chainChanged)
  })

  it('should connect, return address and emit event', async () => {
    const address = await provider.connect()

    expect(address).toEqual(TestConstants.accounts[0].address)
    expect(events.connect).toHaveBeenCalledWith(TestConstants.accounts[0].publicKey)
  })

  it('should disconnect and emit event', async () => {
    await provider.disconnect()

    expect(events.disconnect).toHaveBeenCalledWith(undefined)
  })

  it('should signMessage', async () => {
    await provider.signMessage(new TextEncoder().encode('test'))
  })

  it('should signTransaction with Legacy Transaction', async () => {
    await provider.signTransaction(mockLegacyTransaction())
  })

  it('should signTransaction with Versioned Transaction', async () => {
    await provider.signTransaction(mockVersionedTransaction())
  })

  it('should signAndSendTransaction with Legacy Transaction', async () => {
    await provider.signAndSendTransaction(mockLegacyTransaction())
  })

  it('should signAndSendTransaction with Versioned Transaction', async () => {
    await provider.signAndSendTransaction(mockVersionedTransaction())
  })
})
