import { getWallets } from '@wallet-standard/app'
import { StandardWalletAdapter } from './adapter.js'
import { isWalletAdapterCompatibleStandardWallet } from '@solana/wallet-adapter-base'
import type { Wallet } from '@wallet-standard/base'

const { get, on } = getWallets()

let standardAdapters: StandardWalletAdapter[] = [...wrapWalletsWithAdapters(get())]

export function watchStandard(callback: (arg: StandardWalletAdapter[]) => void) {
  const listeners = [
    on('register', (...wallets) => {
      if (!standardAdapters || standardAdapters.length === 0) {
        standardAdapters = [...wrapWalletsWithAdapters(wallets)]
      } else {
        standardAdapters = [...standardAdapters, ...wrapWalletsWithAdapters(wallets)]
      }
      callback(standardAdapters)
    }),
    on('unregister', (...wallets) => {
      standardAdapters = standardAdapters.filter(standardAdapter =>
        wallets.some(wallet => wallet.name === standardAdapter.wallet.name)
      )
      callback(standardAdapters)
    })
  ]

  return () => listeners.forEach(off => off())
}

function wrapWalletsWithAdapters(wallets: readonly Wallet[]): readonly StandardWalletAdapter[] {
  return wallets
    .filter(isWalletAdapterCompatibleStandardWallet)
    .map(wallet => new StandardWalletAdapter({ wallet }))
}
