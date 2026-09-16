import type { Wallet } from '@wallet-standard/base'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { watchStandard } from '../utils/watchStandard'
import { mockWalletStandard } from './mocks/WalletStandard'
import { TestConstants } from './util/TestConstants'

const walletStandardApp = vi.hoisted(() => {
  const registerListeners: Array<(...wallets: Wallet[]) => void> = []
  const unregisterListeners: Array<(...wallets: Wallet[]) => void> = []
  let wallets: Wallet[] = []

  return {
    getWallets: () => wallets,
    setWallets(next: Wallet[]) {
      wallets = next
    },
    emitRegister(...next: Wallet[]) {
      registerListeners.forEach(listener => listener(...next))
    },
    emitUnregister(...next: Wallet[]) {
      unregisterListeners.forEach(listener => listener(...next))
    },
    reset() {
      registerListeners.length = 0
      unregisterListeners.length = 0
      wallets = []
    },
    on(event: string, callback: (...wallets: Wallet[]) => void) {
      if (event === 'register') {
        registerListeners.push(callback)
      } else if (event === 'unregister') {
        unregisterListeners.push(callback)
      }

      return () => {
        const list = event === 'register' ? registerListeners : unregisterListeners
        const index = list.indexOf(callback)
        if (index >= 0) {
          list.splice(index, 1)
        }
      }
    }
  }
})

vi.mock('@wallet-standard/app', () => ({
  getWallets: () => ({
    get: () => walletStandardApp.getWallets(),
    on: walletStandardApp.on
  })
}))

function createWallet(name: string): Wallet {
  return {
    ...mockWalletStandard(),
    name
  }
}

function providerNames(callback: ReturnType<typeof vi.fn>) {
  const lastCall = callback.mock.calls.at(-1) || []

  return lastCall.map((provider: { wallet: Wallet }) => provider.wallet.name)
}

describe('watchStandard', () => {
  const getActiveChain = () => TestConstants.chains[0]
  let unwatch: (() => void) | undefined

  beforeEach(() => {
    walletStandardApp.reset()
  })

  afterEach(() => {
    unwatch?.()
    unwatch = undefined
  })

  it('notifies with compatible wallets from get()', () => {
    const phantom = createWallet('Phantom')
    const solflare = createWallet('Solflare')
    walletStandardApp.setWallets([phantom, solflare])

    const callback = vi.fn()
    unwatch = watchStandard(TestConstants.chains, getActiveChain, callback)

    expect(providerNames(callback)).toEqual(['Phantom', 'Solflare'])
  })

  it('keeps other wallets when one wallet unregisters', () => {
    const phantom = createWallet('Phantom')
    const solflare = createWallet('Solflare')
    walletStandardApp.setWallets([phantom, solflare])

    const callback = vi.fn()
    unwatch = watchStandard(TestConstants.chains, getActiveChain, callback)
    callback.mockClear()

    walletStandardApp.emitUnregister(solflare)

    expect(providerNames(callback)).toEqual(['Phantom'])
  })

  it('adds a wallet that registers after watch starts', () => {
    const phantom = createWallet('Phantom')
    walletStandardApp.setWallets([phantom])

    const callback = vi.fn()
    unwatch = watchStandard(TestConstants.chains, getActiveChain, callback)
    callback.mockClear()

    const backpack = createWallet('Backpack')
    walletStandardApp.emitRegister(backpack)

    expect(providerNames(callback)).toEqual(['Phantom', 'Backpack'])
  })

  it('does not wrap wallets named WalletConnect', () => {
    walletStandardApp.setWallets([createWallet('WalletConnect'), createWallet('Phantom')])

    const callback = vi.fn()
    unwatch = watchStandard(TestConstants.chains, getActiveChain, callback)

    expect(providerNames(callback)).toEqual(['Phantom'])
  })
})
