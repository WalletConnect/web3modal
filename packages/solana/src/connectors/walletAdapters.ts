import {
  PhantomWalletAdapter,
  BackpackWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter
} from './walletAdapters/index.js'

import type { BaseWalletAdapter } from '@solana/wallet-adapter-base'
import type { Connector } from '@web3modal/scaffold'

export type AdapterKey = 'phantom' | 'solflare' | 'trustWallet' | 'backpack'
export const supportedWallets: AdapterKey[] = ['phantom', 'solflare', 'trustWallet', 'backpack']

export function createWalletAdapters() {
  return {
    phantom: new PhantomWalletAdapter(),
    trustWallet: new TrustWalletAdapter(),
    backpack: new BackpackWalletAdapter(),
    solflare: new SolflareWalletAdapter()
  }
}

export function syncInjectedWallets(
  w3mConnectors: Connector[],
  adapters: Record<AdapterKey, BaseWalletAdapter>
) {
  supportedWallets.forEach(wallet => {
    if (window[wallet as keyof Window]) {
      w3mConnectors.push({
        id: adapters[wallet].name,
        type: 'ANNOUNCED',
        imageUrl: adapters[wallet].icon,
        name: adapters[wallet].name,
        provider: adapters[wallet]
      })
    }
  })
}
