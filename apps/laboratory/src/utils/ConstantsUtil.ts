const projectId = process.env['NEXT_PUBLIC_PROJECT_ID']
if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not set')
}
export const WALLET_URL = process.env['WALLET_URL'] || 'https://react-wallet.walletconnect.com/'
export const PUBLIC_URL = 'https://lab.web3modal.com'

export const CUSTOM_WALLET = 'wc:custom_wallet'

// eslint-disable-next-line init-declarations
let storedCustomWallet
if (typeof window !== 'undefined') {
  storedCustomWallet = localStorage.getItem(CUSTOM_WALLET)
}

const customWallet = storedCustomWallet ? [JSON.parse(storedCustomWallet)] : []

export const ConstantsUtil = {
  SigningSucceededToastTitle: 'Signing Succeeded',
  SigningFailedToastTitle: 'Signing Failed',
  TestIdSiweAuthenticationStatus: 'w3m-authentication-status',
  Metadata: {
    name: 'Web3Modal',
    description: 'Web3Modal Laboratory',
    url: PUBLIC_URL,
    icons: [`${PUBLIC_URL}/metadata-icon.png`],
    verifyUrl: ''
  },
  CustomWallets: [
    ...customWallet,
    {
      id: 'react-wallet-v2',
      name: 'react-wallet-v2',
      homepage: WALLET_URL,
      mobile_link: WALLET_URL,
      desktop_link: WALLET_URL,
      webapp_link: WALLET_URL
    },
    {
      id: 'kotlin-web3wallet',
      name: 'kotlin-web3wallet',
      homepage: 'https://walletconnect.com',
      mobile_link: 'kotlin-web3wallet://'
    },
    {
      id: 'swift-web3wallet',
      name: 'swift-web3wallet',
      homepage: 'https://walletconnect.com',
      mobile_link: 'walletapp://'
    },
    {
      id: 'flutter-web3wallet',
      name: 'flutter-web3wallet',
      homepage: 'https://walletconnect.com',
      mobile_link: 'wcflutterwallet://'
    },
    {
      id: 'rn-web3wallet',
      name: 'rn-web3wallet',
      homepage: 'https://walletconnect.com',
      mobile_link: 'rn-web3wallet://'
    }
  ],
  ProjectId: projectId
}
