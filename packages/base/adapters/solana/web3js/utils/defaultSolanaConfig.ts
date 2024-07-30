import '@web3modal/polyfills'

import type { Chain, Metadata, Provider, ProviderType } from './scaffold/index.js'

declare global {
  interface Window {
    originalSolana?: Record<string, unknown>
    solana?: Provider
    solflare?: { solana: Provider }
    backpack?: { solana: Provider }
    trustWallet?: { solana: Provider }
    phantom?: { solana: Provider }
    getHashedName: (name: string) => Buffer
  }
}

export interface ConfigOptions {
  projectId?: string
  chains: Chain[]
  enableInjected?: boolean
  rpcUrl?: string
  defaultChainId?: number
  metadata: Metadata
}

export function defaultSolanaConfig(options: ConfigOptions) {
  const { enableInjected = true, metadata } = options

  let injectedProvider: Provider | undefined = undefined

  const providers: ProviderType = { metadata }

  function getInjectedProvider() {
    if (injectedProvider) {
      return injectedProvider
    }

    if (typeof window === 'undefined') {
      return undefined
    }

    if (!window.solana) {
      return undefined
    }

    injectedProvider = window.solana

    return injectedProvider
  }

  if (enableInjected) {
    providers.injected = getInjectedProvider()
  }

  return providers
}
