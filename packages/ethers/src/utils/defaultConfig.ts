import '@web3modal/polyfills'
import type { Metadata, Provider, ProviderType } from '@web3modal/scaffold-utils/ethers'
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk'
import type { SocialProvider } from '@web3modal/scaffold-utils'

export interface ConfigOptions {
  enableEIP6963?: boolean
  enableInjected?: boolean
  enableCoinbase?: boolean
  auth?: {
    email?: boolean
    socials?: SocialProvider[]
  }
  rpcUrl?: string
  defaultChainId?: number
  metadata: Metadata
}

export function defaultConfig(options: ConfigOptions) {
  const {
    enableEIP6963 = true,
    enableInjected = true,
    enableCoinbase = true,
    auth,
    metadata,
    rpcUrl,
    defaultChainId
  } = options

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  let injectedProvider: Provider | undefined = undefined
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  let coinbaseProvider: Provider | undefined = undefined

  const providers: ProviderType = { metadata }

  function getInjectedProvider() {
    if (injectedProvider) {
      return injectedProvider
    }

    if (typeof window === 'undefined') {
      return undefined
    }

    if (!window.ethereum) {
      return undefined
    }

    //  @ts-expect-error window.ethereum satisfies Provider
    injectedProvider = window.ethereum

    return injectedProvider
  }

  function getCoinbaseProvider() {
    if (coinbaseProvider) {
      return coinbaseProvider
    }

    if (typeof window === 'undefined') {
      return undefined
    }

    const coinbaseWallet = new CoinbaseWalletSDK({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
      darkMode: false,
      enableMobileWalletLink: true
    })

    coinbaseProvider = coinbaseWallet.makeWeb3Provider(rpcUrl, defaultChainId)

    return coinbaseProvider
  }

  if (enableInjected) {
    providers.injected = getInjectedProvider()
  }

  if (enableCoinbase && rpcUrl && defaultChainId) {
    providers.coinbase = getCoinbaseProvider()
  }

  if (enableEIP6963) {
    providers.EIP6963 = true
  }

  if (auth) {
    providers.auth = auth
  }

  return providers
}
