import type { W3mFrameProvider, W3mFrameTypes } from '@web3modal/wallet'
import type { Balance, Transaction } from '@web3modal/common'
import type { OnRampProviderOption } from '../controllers/OnRampController.js'

export type CaipAddress = `${string}:${string}:${string}`

export type CaipNetworkId = `${string}:${string}`

export type CaipNetworkCoinbaseNetwork =
  | 'Ethereum'
  | 'Arbitrum One'
  | 'Polygon'
  | 'Avalanche'
  | 'OP Mainnet'
  | 'Celo'

export interface CaipNetwork {
  id: CaipNetworkId
  name?: string
  imageId?: string
  imageUrl?: string
}

export type ConnectedWalletInfo =
  | {
      name?: string
      icon?: string
      [key: string]: unknown
    }
  | undefined

export interface LinkingRecord {
  redirect: string
  href: string
}

export type ProjectId = string

export type Platform = 'mobile' | 'desktop' | 'browser' | 'web' | 'qrcode' | 'unsupported'

export type ConnectorType = 'EXTERNAL' | 'WALLET_CONNECT' | 'INJECTED' | 'ANNOUNCED' | 'AUTH'

export type SocialProvider = 'google' | 'github' | 'apple' | 'facebook' | 'x' | 'discord'

export type Connector = {
  id: string
  type: ConnectorType
  name?: string
  imageId?: string
  explorerId?: string
  imageUrl?: string
  info?: {
    uuid?: string
    name?: string
    icon?: string
    rdns?: string
  }
  provider?: unknown
  email?: boolean
  socials?: SocialProvider[]
  showWallets?: boolean
  walletFeatures?: boolean
}

export interface AuthConnector extends Connector {
  provider: W3mFrameProvider
  socials?: SocialProvider[]
  email?: boolean
}

export type CaipNamespaces = Record<
  string,
  {
    chains: CaipNetworkId[]
    methods: string[]
    events: string[]
  }
>

export type SdkVersion =
  | `${'html' | 'react' | 'vue'}-wagmi-${string}`
  | `${'html' | 'react' | 'vue'}-ethers5-${string}`
  | `${'html' | 'react' | 'vue'}-ethers-${string}`
  | `${'html' | 'react' | 'vue'}-solana-${string}`

export interface BaseError {
  message?: string
}

export type Metadata = {
  name: string
  description: string
  url: string
  icons: string[]
}

// -- ApiController Types -------------------------------------------------------
export interface WcWallet {
  id: string
  name: string
  homepage?: string
  image_id?: string
  image_url?: string
  order?: number
  mobile_link?: string | null
  desktop_link?: string | null
  webapp_link?: string | null
  app_store?: string | null
  play_store?: string | null
  chrome_store?: string | null
  rdns?: string | null
  injected?:
    | {
        namespace?: string
        injected_id?: string
      }[]
    | null
}

export interface ApiGetWalletsRequest {
  page: number
  entries: number
  search?: string
  include?: string[]
  exclude?: string[]
}

export interface ApiGetWalletsResponse {
  data: WcWallet[]
  count: number
}

export interface ApiGetProjectConfigResponse {
  isAnalyticsEnabled: boolean
  isAppKitAuthEnabled: boolean
}

export type ThemeMode = 'dark' | 'light'

export interface ThemeVariables {
  '--w3m-font-family'?: string
  '--w3m-accent'?: string
  '--w3m-color-mix'?: string
  '--w3m-color-mix-strength'?: number
  '--w3m-font-size-master'?: string
  '--w3m-border-radius-master'?: string
  '--w3m-z-index'?: number
}

// -- BlockchainApiController Types ---------------------------------------------
export interface BlockchainApiIdentityRequest {
  address: string
}

export interface BlockchainApiIdentityResponse {
  avatar: string | null
  name: string | null
}

export interface BlockchainApiTransactionsRequest {
  account: string
  projectId: string
  cursor?: string
  onramp?: 'coinbase'
  signal?: AbortSignal
}

export interface BlockchainApiTransactionsResponse {
  data: Transaction[]
  next: string | null
}

export type SwapToken = {
  name: string
  symbol: string
  address: `${string}:${string}:${string}`
  decimals: number
  logoUri: string
  eip2612?: boolean
}

export type SwapTokenWithBalance = SwapToken & {
  quantity: {
    decimals: string
    numeric: string
  }
  price: number
  value: number
}

export interface BlockchainApiSwapTokensRequest {
  projectId: string
  chainId?: string
}

export interface BlockchainApiSwapTokensResponse {
  tokens: SwapToken[]
}

export interface BlockchainApiSwapQuoteRequest {
  projectId: string
  chainId?: string
  amount: string
  userAddress: string
  from: string
  to: string
  gasPrice: string
}

export interface BlockchainApiSwapQuoteResponse {
  quotes: {
    id: string | null
    fromAmount: string
    fromAccount: string
    toAmount: string
    toAccount: string
  }[]
}

export interface BlockchainApiTokenPriceRequest {
  projectId: string
  currency?: 'usd' | 'eur' | 'gbp' | 'aud' | 'cad' | 'inr' | 'jpy' | 'btc' | 'eth'
  addresses: string[]
}

export interface BlockchainApiTokenPriceResponse {
  fungibles: {
    name: string
    symbol: string
    iconUrl: string
    price: number
  }[]
}

export interface BlockchainApiSwapAllowanceRequest {
  projectId: string
  tokenAddress: string
  userAddress: string
}

export interface BlockchainApiSwapAllowanceResponse {
  allowance: string
}

export interface BlockchainApiGasPriceRequest {
  projectId: string
  chainId: string
}

export interface BlockchainApiGasPriceResponse {
  standard: string
  fast: string
  instant: string
}

export interface BlockchainApiGenerateSwapCalldataRequest {
  projectId: string
  userAddress: string
  from: string
  to: string
  amount: string
  eip155?: {
    slippage: string
    permit?: string
  }
}

export interface BlockchainApiGenerateSwapCalldataResponse {
  tx: {
    from: `${string}:${string}:${string}`
    to: `${string}:${string}:${string}`
    data: `0x${string}`
    amount: string
    eip155: {
      gas: string
      gasPrice: string
    }
  }
}

export interface BlockchainApiGenerateApproveCalldataRequest {
  projectId: string
  userAddress: string
  from: string
  to: string
  amount?: number
}

export interface BlockchainApiGenerateApproveCalldataResponse {
  tx: {
    from: `${string}:${string}:${string}`
    to: `${string}:${string}:${string}`
    data: `0x${string}`
    value: string
    eip155: {
      gas: number
      gasPrice: string
    }
  }
}

export interface BlockchainApiBalanceResponse {
  balances: Balance[]
}

export interface BlockchainApiLookupEnsName {
  name: string
  registered: number
  updated: number
  addresses: Record<
    string,
    {
      address: string
      created: string
    }
  >
  attributes: {
    avatar?: string
    bio?: string
  }[]
}

export interface BlockchainApiRegisterNameParams {
  coinType: number
  message: string
  signature: string
  address: `0x${string}`
}

export interface BlockchainApiSuggestionResponse {
  suggestions: {
    name: string
    registered: boolean
  }[]
}

export interface BlockchainApiEnsError extends BaseError {
  status: string
  reasons: { name: string; description: string }[]
}

// -- OptionsController Types ---------------------------------------------------
export interface Token {
  address: string
  image?: string
}

export type Tokens = Record<CaipNetworkId, Token>

export type CustomWallet = Pick<
  WcWallet,
  | 'id'
  | 'name'
  | 'homepage'
  | 'image_url'
  | 'mobile_link'
  | 'desktop_link'
  | 'webapp_link'
  | 'app_store'
  | 'play_store'
>

// -- EventsController Types ----------------------------------------------------

export type Event =
  | {
      type: 'track'
      event: 'MODAL_CREATED'
    }
  | {
      type: 'track'
      event: 'MODAL_LOADED'
    }
  | {
      type: 'track'
      event: 'MODAL_OPEN'
      properties: {
        connected: boolean
      }
    }
  | {
      type: 'track'
      event: 'MODAL_CLOSE'
      properties: {
        connected: boolean
      }
    }
  | {
      type: 'track'
      event: 'CLICK_ALL_WALLETS'
    }
  | {
      type: 'track'
      event: 'SELECT_WALLET'
      properties: {
        name: string
        platform: Platform
      }
    }
  | {
      type: 'track'
      event: 'CONNECT_SUCCESS'
      properties: {
        method: 'qrcode' | 'mobile' | 'browser' | 'email'
        name: string
      }
    }
  | {
      type: 'track'
      event: 'CONNECT_ERROR'
      properties: {
        message: string
      }
    }
  | {
      type: 'track'
      event: 'DISCONNECT_SUCCESS'
    }
  | {
      type: 'track'
      event: 'DISCONNECT_ERROR'
    }
  | {
      type: 'track'
      event: 'CLICK_WALLET_HELP'
    }
  | {
      type: 'track'
      event: 'CLICK_NETWORK_HELP'
    }
  | {
      type: 'track'
      event: 'CLICK_GET_WALLET'
    }
  | {
      type: 'track'
      event: 'CLICK_TRANSACTIONS'
      properties: {
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      event: 'ERROR_FETCH_TRANSACTIONS'
      properties: {
        address: string
        projectId: string
        cursor: string | undefined
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      event: 'LOAD_MORE_TRANSACTIONS'
      properties: {
        address: string | undefined
        projectId: string
        cursor: string | undefined
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      event: 'CLICK_SIGN_SIWE_MESSAGE'
      properties: {
        network: string
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      event: 'CLICK_CANCEL_SIWE'
      properties: {
        network: string
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      event: 'CLICK_NETWORKS'
    }
  | {
      type: 'track'
      event: 'SIWE_AUTH_SUCCESS'
      properties: {
        network: string
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      event: 'SIWE_AUTH_ERROR'
      properties: {
        network: string
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      event: 'EMAIL_LOGIN_SELECTED'
    }
  | {
      type: 'track'
      event: 'EMAIL_SUBMITTED'
    }
  | {
      type: 'track'
      event: 'DEVICE_REGISTERED_FOR_EMAIL'
    }
  | {
      type: 'track'
      event: 'EMAIL_VERIFICATION_CODE_SENT'
    }
  | {
      type: 'track'
      event: 'EMAIL_VERIFICATION_CODE_PASS'
    }
  | {
      type: 'track'
      event: 'EMAIL_VERIFICATION_CODE_FAIL'
    }
  | {
      type: 'track'
      event: 'EMAIL_EDIT'
    }
  | {
      type: 'track'
      event: 'EMAIL_UPGRADE_FROM_MODAL'
    }
  | {
      type: 'track'
      event: 'SWITCH_NETWORK'
      properties: {
        network: string
      }
    }
  | {
      type: 'track'
      event: 'CLICK_CONVERT'
    }
  | {
      type: 'track'
      event: 'CLICK_SELECT_TOKEN_TO_SWAP'
    }
  | {
      type: 'track'
      event: 'CLICK_SELECT_NETWORK_TO_SWAP'
    }
  | {
      type: 'track'
      event: 'SELECT_BUY_CRYPTO'
      properties: {
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      event: 'SELECT_BUY_PROVIDER'
      properties: {
        provider: OnRampProviderOption
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      event: 'SELECT_WHAT_IS_A_BUY'
      properties: {
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      event: 'SET_PREFERRED_ACCOUNT_TYPE'
      properties: {
        accountType: W3mFrameTypes.AccountType
        network: string
      }
    }
  | {
      type: 'track'
      event: 'OPEN_SWAP'
      properties: {
        isSmartAccount: boolean
        network: string
      }
    }
  | {
      type: 'track'
      event: 'INITIATE_SWAP'
      properties: {
        isSmartAccount: boolean
        network: string
        swapFromToken: string
        swapToToken: string
        swapfromAmount: string
        swapToAmount: string
      }
    }
  | {
      type: 'track'
      event: 'SWAP_SUCCESS'
      properties: {
        isSmartAccount: boolean
        network: string
        swapFromToken: string
        swapToToken: string
        swapfromAmount: string
        swapToAmount: string
      }
    }
  | {
      type: 'track'
      event: 'SWAP_ERROR'
      properties: {
        isSmartAccount: boolean
        network: string
        swapFromToken: string
        swapToToken: string
        swapfromAmount: string
        swapToAmount: string
      }
    }
  | {
      type: 'track'
      event: 'SOCIAL_LOGIN_STARTED'
      properties: {
        provider: SocialProvider
      }
    }
  | {
      type: 'track'
      event: 'SOCIAL_LOGIN_SUCCESS'
      properties: {
        provider: SocialProvider
      }
    }
  | {
      type: 'track'
      event: 'SOCIAL_LOGIN_ERROR'
      properties: {
        provider: SocialProvider
      }
    }
  | {
      type: 'track'
      event: 'OPEN_ENS_FLOW'
      properties: {
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      event: 'REGISTER_NAME_INITIATED'
      properties: {
        isSmartAccount: boolean
        ensName: string
      }
    }
  | {
      type: 'track'
      event: 'REGISTER_NAME_SUCCESS'
      properties: {
        isSmartAccount: boolean
        ensName: string
      }
    }
  | {
      type: 'track'
      event: 'REGISTER_NAME_ERROR'
      properties: {
        isSmartAccount: boolean
        ensName: string
        error: string
      }
    }
  | {
      type: 'track'
      event: 'OPEN_SEND'
      properties: {
        isSmartAccount: boolean
        network: string
      }
    }
  | {
      type: 'track'
      event: 'SEND_INITIATED'
      properties: {
        isSmartAccount: boolean
        network: string
        token: string
        amount: number
      }
    }
  | {
      type: 'track'
      event: 'SEND_SUCCESS'
      properties: {
        isSmartAccount: boolean
        network: string
        token: string
        amount: number
      }
    }
  | {
      type: 'track'
      event: 'SEND_ERROR'
      properties: {
        isSmartAccount: boolean
        network: string
        token: string
        amount: number
      }
    }
// Onramp Types
export type DestinationWallet = {
  address: string
  blockchains: string[]
  assets: string[]
}

export type GenerateOnRampUrlArgs = {
  destinationWallets: DestinationWallet[]
  partnerUserId: string
  defaultNetwork?: string
  purchaseAmount?: number
  paymentAmount?: number
}

export type CoinbaseNetwork = {
  name: string
  display_name: string
  chain_id: string
  contract_address: string
}

export type PaymentLimits = {
  id: string
  min: string
  max: string
}

export type PaymentCurrency = {
  id: string
  payment_method_limits: PaymentLimits[]
}

export type QuoteAmount = {
  amount: string
  currency: string
}

export type PurchaseCurrency = {
  id: string
  name: string
  symbol: string
  networks: CoinbaseNetwork[]
}

export type OnrampQuote = {
  paymentTotal: QuoteAmount
  paymentSubtotal: QuoteAmount
  purchaseAmount: QuoteAmount
  coinbaseFee: QuoteAmount
  networkFee: QuoteAmount
  quoteId: string
}

export type GetQuoteArgs = {
  purchaseCurrency: PurchaseCurrency
  paymentCurrency: PaymentCurrency
  amount: string
  network: string
}

export interface SendTransactionArgs {
  to: `0x${string}`
  data: `0x${string}`
  value: bigint
  gas?: bigint
  gasPrice: bigint
  address: `0x${string}`
}

export interface EstimateGasTransactionArgs {
  address: `0x${string}`
  to: `0x${string}`
  data: `0x${string}`
}

export interface WriteContractArgs {
  receiverAddress: `0x${string}`
  tokenAmount: bigint
  tokenAddress: `0x${string}`
  fromAddress: `0x${string}`
  method: 'send' | 'transfer' | 'call'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any
}
