import { AppKit } from '@reown/appkit'
import type { CaipNetwork } from '@reown/appkit-common'
import type { SdkVersion } from '@reown/appkit-core'
import { arbitrum, mainnet } from '@reown/appkit/networks'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { mock } from 'wagmi/connectors'
import { WagmiAdapter } from '../../client'

const privateKey = generatePrivateKey()
export const mockAccount = privateKeyToAccount(privateKey)

export const mockWagmiClient = new WagmiAdapter({
  connectors: [mock({ accounts: [mockAccount.address] })],
  networks: [mainnet, arbitrum],
  projectId: '1234'
})

export const mockWagmiConfig = mockWagmiClient.wagmiConfig

export const mockOptions = {
  adapters: [mockWagmiClient],
  networks: mockWagmiClient.caipNetworks,
  enableInjected: false,
  enableCoinbase: false,
  enableWalletConnect: false,
  features: {
    email: false,
    socials: [],
    analytics: false
  },
  metadata: {
    description: 'Desc',
    name: 'Name',
    url: 'url.com',
    icons: ['icon.png']
  },
  projectId: '1234',
  sdkVersion: `html-wagmi-5.1.6` as SdkVersion,
  enableAuth: false
}

export const mockAppKit = new AppKit(mockOptions)

export const mockChain = {
  id: 1,
  name: 'Ethereum',
  caipNetworkId: 'eip155:1',
  chainNamespace: 'eip155',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  blockExplorers: {
    default: {
      name: 'etherscan',
      url: 'https://etherscan.io',
      standard: 'EIP3091'
    }
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.example.com']
    }
  }
} as CaipNetwork
