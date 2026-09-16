import { isWalletAdapterCompatibleStandardWallet } from '@solana/wallet-adapter-base'
import { getWallets } from '@wallet-standard/app'
import type { Wallet } from '@wallet-standard/base'

import type { CaipNetwork } from '@reown/appkit-common'

import { WalletStandardProvider } from '../providers/WalletStandardProvider.js'

const { get, on } = getWallets()
let standardAdapters: WalletStandardProvider[] = []

export function watchStandard(
  requestedChains: CaipNetwork[],
  getActiveChain: () => CaipNetwork | undefined,
  callback: (...arg: WalletStandardProvider[]) => void
) {
  const listeners = [
    on('register', (...wallets) => {
      standardAdapters = [
        ...standardAdapters,
        ...wrapWalletsWithAdapters(wallets, requestedChains, getActiveChain)
      ]
      callback(...standardAdapters)
    }),
    on('unregister', (...wallets) => {
      standardAdapters = standardAdapters.filter(
        standardAdapter => !wallets.some(wallet => wallet.name === standardAdapter.wallet.name)
      )
      callback(...standardAdapters)
    })
  ]

  standardAdapters = wrapWalletsWithAdapters(get(), requestedChains, getActiveChain)

  callback(...standardAdapters)

  return () => listeners.forEach(off => off())
}

function wrapWalletsWithAdapters(
  wallets: readonly Wallet[],
  requestedChains: CaipNetwork[],
  getActiveChain: () => CaipNetwork | undefined
): WalletStandardProvider[] {
  return wallets
    .filter(
      wallet => wallet.name !== 'WalletConnect' && isWalletAdapterCompatibleStandardWallet(wallet)
    )
    .map(
      wallet =>
        new WalletStandardProvider({
          wallet,
          requestedChains,
          getActiveChain
        })
    )
}
