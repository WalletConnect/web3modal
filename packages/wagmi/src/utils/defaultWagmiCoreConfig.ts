import '@web3modal/polyfills'

import type { CreateConfigParameters, CreateConnectorFn, Config } from '@wagmi/core'
import { createConfig } from '@wagmi/core'
import { coinbaseWallet, walletConnect, injected } from '@wagmi/connectors'
import { authConnector } from '../connectors/AuthConnector.js'
import { getTransport } from './helpers.js'
import type { SocialProvider } from '@web3modal/scaffold-utils'

export type ConfigOptions = Partial<CreateConfigParameters> & {
  chains: CreateConfigParameters['chains']
  projectId: string
  enableEIP6963?: boolean
  enableCoinbase?: boolean
  enableEmail?: boolean
  auth?: {
    socials?: SocialProvider[]
    showWallets?: boolean
  }
  enableInjected?: boolean
  enableWalletConnect?: boolean
  metadata: {
    name: string
    description: string
    url: string
    icons: string[]
  }
}

export function defaultWagmiConfig({
  projectId,
  chains,
  metadata,
  enableCoinbase,
  enableEmail,
  enableInjected,
  auth = {
    showWallets: true
  },
  enableWalletConnect,
  enableEIP6963,
  ...wagmiConfig
}: ConfigOptions): Config {
  const connectors: CreateConnectorFn[] = wagmiConfig?.connectors ?? []
  const transportsArr = chains.map(chain => [
    chain.id,
    getTransport({ chainId: chain.id, projectId })
  ])
  const transports = Object.fromEntries(transportsArr)

  // Enabled by default
  if (enableWalletConnect !== false) {
    connectors.push(walletConnect({ projectId, metadata, showQrModal: false }))
  }

  // Enabled by default
  if (enableInjected !== false) {
    connectors.push(injected({ shimDisconnect: true }))
  }

  // Enabled by default
  if (enableCoinbase !== false) {
    connectors.push(
      coinbaseWallet({
        appName: metadata?.name ?? 'Unknown',
        appLogoUrl: metadata?.icons[0] ?? 'Unknown',
        enableMobileWalletLink: true
      })
    )
  }

  // Disabled by default
  if (enableEmail || auth?.socials) {
    connectors.push(
      authConnector({
        chains: [...chains],
        options: { projectId },
        socials: auth?.socials,
        email: enableEmail,
        showWallets: auth.showWallets
      })
    )
  }

  return createConfig({
    chains,
    multiInjectedProviderDiscovery: enableEIP6963 !== false,
    transports,
    ...wagmiConfig,
    connectors
  })
}
