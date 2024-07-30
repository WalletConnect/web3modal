import type { CreateConfigParameters } from '@wagmi/core'
import { authConnector as authConnectorWagmi } from './AuthConnector.js'
import type { SocialProvider } from '@web3modal/scaffold-utils'

interface W3mFrameProviderOptions {
  projectId: string
}

export type AuthParameters = {
  chains?: CreateConfigParameters['chains']
  options: W3mFrameProviderOptions
  socials?: SocialProvider[]
  showWallets?: boolean
  walletFeatures?: boolean
  email?: boolean
}

export function authConnector(parameters: AuthParameters) {
  return authConnectorWagmi({
    email: true,
    showWallets: true,
    walletFeatures: true,
    ...parameters
  })
}
