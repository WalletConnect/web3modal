import type { CaipNetwork, SocialProvider } from '@reown/appkit'
import type { Wallet } from '@reown/appkit-wallet-button'
import {
  abstract,
  adi,
  arbitrum,
  arc,
  arcTestnet,
  aurora,
  base,
  baseSepolia,
  berachain,
  bitcoin,
  bitcoinSignet,
  bitcoinTestnet,
  gnosis,
  hedera,
  mainnet,
  mantle,
  monad,
  monadTestnet,
  optimism,
  polygon,
  robinhood,
  robinhoodTestnet,
  rootstock,
  rootstockTestnet,
  sepolia,
  solana,
  solanaDevnet,
  solanaTestnet,
  stellar,
  stellarTestnet,
  ton,
  tonTestnet,
  tronMainnet,
  tronShastaTestnet,
  unichainSepolia,
  zkSync
} from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

import { getLocalStorageItem } from './LocalStorage'

const projectId = process.env['NEXT_PUBLIC_PROJECT_ID']
if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not set')
}
export const WALLET_URL = process.env['WALLET_URL'] || 'https://react-wallet.walletconnect.com/'
export const USEROP_BUILDER_SERVICE_BASE_URL = 'https://rpc.walletconnect.org/v1/wallet'

export const GALLERY_URL = 'https://appkit-gallery.reown.com/'
export const DOCS_URL = 'https://docs.reown.com/appkit/overview'
export const REPO_URL = 'https://github.com/reown-com/appkit'

export function getPublicUrl() {
  const isProduction = process.env['NODE_ENV'] === 'production'
  if (isProduction) {
    return 'https://appkit-lab.reown.com'
  }

  const publicUrl = process.env['NEXT_PUBLIC_PUBLIC_URL']
  if (publicUrl) {
    return publicUrl
  }

  const vercelUrl = process.env['NEXT_PUBLIC_VERCEL_URL']
  if (vercelUrl) {
    return `https://${vercelUrl}`
  }

  return 'https://appkit-lab.reown.org'
}

export const CUSTOM_WALLET = 'wc:custom_wallet'

// eslint-disable-next-line init-declarations
let storedCustomWallet
if (typeof window !== 'undefined') {
  storedCustomWallet = getLocalStorageItem(CUSTOM_WALLET)
}

const customWallet = storedCustomWallet ? [JSON.parse(storedCustomWallet)] : []

const EvmNetworks = [
  mainnet,
  optimism,
  polygon,
  zkSync,
  arbitrum,
  base,
  baseSepolia,
  unichainSepolia,
  berachain,
  sepolia,
  gnosis,
  hedera,
  aurora,
  mantle,
  abstract,
  monad,
  monadTestnet,
  rootstock,
  rootstockTestnet,
  adi,
  arc,
  arcTestnet,
  robinhood,
  robinhoodTestnet
] as [AppKitNetwork, ...AppKitNetwork[]]

export const solanaNotExist = {
  id: 'chaindoesntexist',
  caipNetworkId: 'solana:chaindoesntexist',
  chainNamespace: 'solana',
  name: 'Solana Unsupported',
  nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  blockExplorers: {
    default: { name: 'Solscan', url: 'https://explorer.solana.com/?cluster=unsupported' }
  },
  rpcUrls: { default: { http: ['https://api.unsupported.solana.com'] } }
} as CaipNetwork

const SolanaNetworks = [solana, solanaTestnet, solanaDevnet, solanaNotExist] as [
  AppKitNetwork,
  ...AppKitNetwork[]
]

const BitcoinNetworks = [bitcoin, bitcoinTestnet, bitcoinSignet] as [
  AppKitNetwork,
  ...AppKitNetwork[]
]

const TonNetworks = [ton, tonTestnet] as [AppKitNetwork, ...AppKitNetwork[]]

const TronNetworks = [tronMainnet, tronShastaTestnet] as [AppKitNetwork, ...AppKitNetwork[]]

const StellarNetworks = [stellar, stellarTestnet] as [AppKitNetwork, ...AppKitNetwork[]]

export const ConstantsUtil = {
  SigningSucceededToastTitle: 'Signing Succeeded',
  SigningFailedToastTitle: 'Signing Failed',
  TestIdSiweAuthenticationStatus: 'w3m-authentication-status',
  DisconnectingSuccessToastTitle: 'Disconnecting Succeeded',
  DisconnectingFailedToastTitle: 'Disconnecting Failed',
  Metadata: {
    name: 'AppKit Lab',
    description: 'Laboratory environment for AppKit testing',
    url: getPublicUrl(),
    icons: [`${getPublicUrl()}/metadata-icon.png`],
    verifyUrl: ''
  },
  CustomWallets: [
    ...customWallet,
    {
      id: 'react-wallet-v2',
      name: 'React Sample Wallet',
      homepage: WALLET_URL,
      webapp_link: WALLET_URL,
      image_url: '/sample-wallets/react.svg'
    },
    {
      id: 'kotlin-web3wallet',
      name: 'Kotlin Sample Wallet',
      homepage: 'https://walletconnect.com',
      mobile_link: 'kotlin-web3wallet://',
      image_url: '/sample-wallets/kotlin.svg'
    },
    {
      id: 'swift-web3wallet',
      name: 'Swift Sample Wallet',
      homepage: 'https://walletconnect.com',
      mobile_link: 'walletapp://',
      image_url: '/sample-wallets/swift.svg'
    },
    {
      id: 'flutter-web3wallet',
      name: 'Flutter Sample Wallet',
      homepage: 'https://walletconnect.com',
      mobile_link: 'wcflutterwallet://',
      image_url: '/sample-wallets/flutter.svg'
    },
    {
      id: 'rn-web3wallet',
      name: 'React Native Sample Wallet',
      homepage: 'https://walletconnect.com',
      mobile_link: 'rn-web3wallet://',
      image_url: '/sample-wallets/react-native.svg'
    }
  ],
  ProjectId: projectId,
  EvmNetworks,
  SolanaNetworks,
  BitcoinNetworks,
  TonNetworks,
  TronNetworks,
  StellarNetworks,
  AllNetworks: [
    ...EvmNetworks,
    ...SolanaNetworks,
    ...BitcoinNetworks,
    ...TonNetworks,
    ...TronNetworks,
    ...StellarNetworks
  ] as [AppKitNetwork, ...AppKitNetwork[]],
  EvmWalletButtons: [
    'walletConnect',
    'metamask',
    'trust',
    'coinbase',
    'rainbow',
    'phantom',
    'haha'
  ] as Wallet[],
  SolanaWalletButtons: [
    'walletConnect',
    'metamask',
    'trust',
    'coinbase',
    'jupiter',
    'solflare',
    'phantom',
    'coin98',
    'magic-eden',
    'backpack',
    'frontier'
  ] as Wallet[],
  BitcoinWalletButtons: ['walletConnect', 'xverse', 'leather', 'okx'] as Wallet[],
  Socials: [
    'google',
    'github',
    'apple',
    'facebook',
    'x',
    'discord',
    'farcaster'
  ] as SocialProvider[],
  Email: 'email' as const
}
