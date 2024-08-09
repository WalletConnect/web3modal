import '@web3modal/polyfills'

import type { Metadata, Provider, ProviderType } from './scaffold/index.js'

declare global {
  interface Navigator {
    brave?: {
      isBrave(): boolean
    }
  }
  interface Window {
    originalSolana?: Record<string, unknown>
    solana?: Provider
    solflare?: { solana: Provider & { isSoflare: boolean } }
    backpack?: { solana: Provider }
    trustWallet?: { solana: Provider }
    phantom?: { solana: Provider & { isPhantom: boolean } }
    getHashedName: (name: string) => Buffer
  }
}

export interface ConfigOptions {
  projectId?: string
  enableInjected?: boolean
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
