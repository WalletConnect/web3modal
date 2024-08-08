import '@web3modal/polyfills'

import type { CreateConfigParameters, CreateConnectorFn, Config } from 'wagmi'
import { createConfig } from 'wagmi'
import { coinbaseWallet, walletConnect, safe, injected } from 'wagmi/connectors'
import { authConnector } from '../connectors/AuthConnector.js'
import { getTransport } from './helpers.js'
import type { SocialProvider } from '@web3modal/scaffold-utils'

export type ConfigOptions = Partial<CreateConfigParameters> & {
  chains: CreateConfigParameters['chains']
  projectId: string
  enableEIP6963?: boolean
  enableCoinbase?: boolean
  enableSafe?: boolean
  allowedDomainsSafe?: RegExp[] | undefined
  auth?: {
    email?: boolean
    socials?: SocialProvider[]
    showWallets?: boolean
    walletFeatures?: boolean
  }
  enableInjected?: boolean
  enableWalletConnect?: boolean
  metadata: {
    name: string
    description: string
    url: string
    icons: string[]
  }
  coinbasePreference?: 'all' | 'smartWalletOnly' | 'eoaOnly'
}

export function defaultWagmiConfig({
  projectId,
  chains,
  metadata,
  enableCoinbase,
  enableSafe,
  enableInjected,
  auth = {},
  enableWalletConnect,
  enableEIP6963,
  ...wagmiConfig
}: ConfigOptions): Config {
  const connectors: CreateConnectorFn[] = wagmiConfig?.connectors ?? []
  const transportsArr = chains.map(chain => [chain.id, getTransport({ chain, projectId })])
  const transports = Object.fromEntries(transportsArr)
  const defaultAuth = {
    email: true,
    showWallets: true,
    walletFeatures: true
  }

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
        version: '4',
        appName: metadata?.name ?? 'Unknown',
        appLogoUrl: metadata?.icons[0] ?? 'Unknown',
        /**
         * Determines which wallet options to display in Coinbase Wallet SDK.
         * @property preference
         *   - `all`: Show both smart wallet and EOA options.
         *   - `smartWalletOnly`: Show only smart wallet options.
         *   - `eoaOnly`: Show only EOA options.
         * @see https://www.smartwallet.dev/sdk/v3-to-v4-changes#parameters
         */
        preference: wagmiConfig.coinbasePreference || 'all'
      })
    )
  }

  if (enableSafe !== false) {
    connectors.push(
      safe({
        allowedDomains: wagmiConfig.allowedDomainsSafe
      })
    )
  }

  const mergedAuth = {
    ...defaultAuth,
    ...auth
  }

  // Disabled by default
  if (mergedAuth.email || mergedAuth.socials) {
    connectors.push(
      authConnector({
        chains: [...chains],
        options: { projectId },
        socials: mergedAuth.socials,
        email: mergedAuth.email,
        showWallets: mergedAuth.showWallets,
        walletFeatures: mergedAuth.walletFeatures
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
