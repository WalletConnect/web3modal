import '@web3modal/polyfills'

import type { CreateConfigParameters, CreateConnectorFn } from '@wagmi/core'

import { createConfig } from '@wagmi/core'
import { coinbaseWallet, walletConnect, injected } from '@wagmi/connectors'
import { getTransport } from './helpers.js'
import type { SocialProvider } from '@web3modal/scaffold-utils'
import { authConnector } from '../connectors/AuthConnector.js'

export type ConfigOptions = Partial<CreateConfigParameters> & {
  chains: CreateConfigParameters['chains']
  projectId: string
  enableInjected?: boolean
  enableEIP6963?: boolean
  enableCoinbase?: boolean
  enableWalletConnect?: boolean
  enableSmartAccounts?: boolean
  auth?: {
    email?: boolean
    socials?: SocialProvider[]
  }
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
  enableInjected,
  enableCoinbase,
  enableWalletConnect,
  enableEIP6963,
  enableSmartAccounts,
  auth,
  ...wagmiConfig
}: ConfigOptions) {
  const connectors: CreateConnectorFn[] = []
  const transportsArr = chains.map(chain => [
    chain.id,
    getTransport({ chainId: chain.id, projectId })
  ])
  const transports = Object.fromEntries(transportsArr)

  // Enabled by default
  if (enableWalletConnect !== false) {
    connectors.push(walletConnect({ projectId, metadata, showQrModal: false }))
  }

  if (enableInjected !== false) {
    connectors.push(injected({ shimDisconnect: true }))
  }

  if (enableCoinbase !== false) {
    connectors.push(
      coinbaseWallet({
        appName: metadata?.name ?? 'Unknown',
        appLogoUrl: metadata?.icons[0] ?? 'Unknown',
        enableMobileWalletLink: true
      })
    )
  }

  // Dissabled by default

  if (auth?.email || auth?.socials) {
    connectors.push(
      authConnector({
        chains: [...chains],
        options: { projectId, enableSmartAccounts },
        socials: auth.socials,
        email: auth.email
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
