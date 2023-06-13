if (!window.global) {
  window.global = window
}

export * as WagmiCore from '@wagmi/core'
export * as WagmiCoreChains from '@wagmi/core/chains'

export { EthereumClient } from './src/client'
export { w3mConnectors, w3mProvider } from './src/utils'
