import type UniversalProvider from '@walletconnect/universal-provider'

import type {
  AdapterType,
  Address,
  AppKitNetwork,
  AppKitSdkVersion,
  Balance,
  CaipAddress,
  CaipNetwork,
  CaipNetworkId,
  ChainId,
  ChainNamespace,
  Hex,
  OnRampProvider,
  SdkFramework,
  SwapProvider,
  Transaction
} from '@reown/appkit-common'
import type { W3mFrameProvider, W3mFrameTypes } from '@reown/appkit-wallet'

import type { AccountState } from '../controllers/ChainController.js'
import type { ConnectionControllerClient } from '../controllers/ConnectionController.js'
import type { ReownName } from '../controllers/EnsController.js'
import type { OnRampProviderOption } from '../controllers/OnRampController.js'
import type { RouterControllerState } from '../controllers/RouterController.js'

type InitializeAppKitConfigs = {
  showWallets?: boolean
  siweConfig?: {
    options: {
      enabled?: boolean
      nonceRefetchIntervalMs?: number
      sessionRefetchIntervalMs?: number
      signOutOnDisconnect?: boolean
      signOutOnAccountChange?: boolean
      signOutOnNetworkChange?: boolean
    }
  }
  themeMode?: 'dark' | 'light'
  themeVariables?: ThemeVariables
  allowUnsupportedChain?: boolean
  networks: (string | number)[]
  defaultNetwork?: AppKitNetwork
  chainImages?: Record<number | string, string>
  connectorImages?: Record<string, string>
  coinbasePreference?: 'all' | 'smartWalletOnly' | 'eoaOnly'
  metadata?: Metadata
}

export type CaipNetworkCoinbaseNetwork =
  | 'Ethereum'
  | 'Arbitrum One'
  | 'Polygon'
  | 'Avalanche'
  | 'OP Mainnet'
  | 'Celo'

export type ConnectedWalletInfo = {
  name: string
  icon?: string
  type?: string
  [key: string]: unknown
}

export type User = {
  email?: string | null | undefined
  username?: string | null | undefined
  accounts?: {
    type: 'eoa' | 'smartAccount'
    address: string
  }[]
}

export interface LinkingRecord {
  redirect: string
  redirectUniversalLink?: string
  href: string
  universalHref?: string
}

export type ProjectId = string

export type Platform = 'mobile' | 'desktop' | 'browser' | 'web' | 'qrcode' | 'unsupported'

export type ConnectorType =
  | 'EXTERNAL'
  | 'WALLET_CONNECT'
  | 'INJECTED'
  | 'ANNOUNCED'
  | 'AUTH'
  | 'MULTI_CHAIN'

export type SocialProvider =
  | 'google'
  | 'github'
  | 'apple'
  | 'facebook'
  | 'x'
  | 'discord'
  | 'farcaster'

export type EmailCaptureOptions = 'required'

export type Connector = {
  id: string
  type: ConnectorType
  name: string
  imageId?: string
  explorerId?: string
  imageUrl?: string
  info?: {
    uuid?: string
    name?: string
    icon?: string
    rdns?: string
  }
  provider?: Provider | W3mFrameProvider | UniversalProvider
  chain: ChainNamespace
  connectors?: Connector[]
  explorerWallet?: WcWallet
}

export interface ConnectorWithProviders extends Connector {
  connectors?: Connector[]
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

export type SdkVersion = `${SdkFramework}-${AdapterType}-${string}` | AppKitSdkVersion

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
  badge_type?: BadgeType
  description?: string
  chains?: CaipNetworkId[]
  homepage?: string
  image_id?: string
  image_url?: string
  order?: number
  link_mode?: string | null
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
  display_index?: number
  supports_wc?: boolean
  supports_wcpay?: boolean
}

export interface ApiGetWalletsRequest {
  page: number
  chains: string
  entries: number
  search?: string
  badge?: BadgeType
  include?: string[]
  exclude?: string[]
  names?: string
  rdns?: string
  /**
   * Include wallets that support WalletConnect Pay but are not v2-compatible.
   * By default the API returns only v2-compatible wallets, which filters these out.
   */
  include_pay_only?: boolean
  /** Sort mode. 'wcpay' bubbles WalletConnect Pay-supporting wallets to the top. */
  sort?: 'default' | 'wcpay'
}

export interface ApiGetWalletsResponse {
  data: WcWallet[]
  count: number
}

export interface ApiGetAllowedOriginsResponse {
  allowedOrigins: string[]
}

export interface ApiGetAnalyticsConfigResponse {
  isAnalyticsEnabled: boolean
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
  '--w3m-qr-color'?: string
  '--apkt-font-family'?: string
  '--apkt-font-family-mono'?: string
  '--apkt-accent'?: string
  '--apkt-color-mix'?: string
  '--apkt-color-mix-strength'?: number
  '--apkt-font-size-master'?: string
  '--apkt-border-radius-master'?: string
  '--apkt-z-index'?: number
  '--apkt-qr-color'?: string
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
  cursor?: string
  signal?: AbortSignal
  cache?: RequestCache
  chainId?: string
}

export interface BlockchainApiTransactionsResponse {
  data: Transaction[]
  next: string | null
}

export type SwapToken = {
  name: string
  symbol: string
  address: CaipAddress
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
  chainId?: string
}

export interface BlockchainApiGetAddressBalanceRequest {
  caipNetworkId: string
  address: string
  method?: string
  params?: unknown
}

export interface BlockchainApiGetAddressBalanceResponse<T = string> {
  ok: boolean
  result: T
  jsonrpc: string
  id: string
}

export interface BlockchainApiSwapTokensResponse {
  tokens: SwapToken[]
}

export interface BlockchainApiSwapQuoteRequest {
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
  caipNetworkId?: CaipNetworkId
  currency?: 'usd' | 'eur' | 'gbp' | 'aud' | 'cad' | 'inr' | 'jpy' | 'btc' | 'eth'
  addresses: string[]
}

export interface BlockchainApiTokenPriceResponse {
  fungibles: {
    address: string
    name: string
    symbol: string
    iconUrl: string
    price: number
  }[]
}

export interface BlockchainApiSwapAllowanceRequest {
  tokenAddress: string
  userAddress: string
}

export interface BlockchainApiSwapAllowanceResponse {
  allowance: string
}

export interface BlockchainApiGasPriceRequest {
  chainId: string
}

export interface BlockchainApiGasPriceResponse {
  standard: string
  fast: string
  instant: string
}

export interface BlockchainApiGenerateSwapCalldataRequest {
  userAddress: string
  from: string
  to: string
  amount: string
  eip155?: {
    slippage: string
    permit?: string
  }
  disableEstimate?: boolean
}

export interface BlockchainApiGenerateSwapCalldataResponse {
  tx: {
    from: CaipAddress
    to: CaipAddress
    data: Address
    amount: string
    eip155: {
      gas: string
      gasPrice: string
    }
  }
}

export interface BlockchainApiGenerateApproveCalldataRequest {
  userAddress: string
  from: string
  to: string
  amount?: number
}

export interface BlockchainApiGenerateApproveCalldataResponse {
  tx: {
    from: CaipAddress
    to: CaipAddress
    data: Address
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
  name: ReownName
  registered_at: string
  updated_at: string | undefined
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
  address: Address
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

export type WalletImpressionItem = {
  name: string
  walletRank: number | undefined
  explorerId: string
  view: string
  displayIndex?: number
  query?: string
  certified?: boolean
}

export type ConnectorImpressionItem = {
  name: string
  walletRank: number | undefined
  rdnsId?: string
  view: string
  displayIndex?: number
}

export type PendingEvent = {
  eventId: string
  url: string
  domain: string
  timestamp: number
  props: {
    type: 'track' | 'error'
    event: string
    address?: string
    properties?: unknown
    items?: Array<WalletImpressionItem | ConnectorImpressionItem>
  }
}

export type Event =
  | {
      type: 'track'
      address?: string
      event: 'MODAL_CREATED'
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
      address?: string
      event: 'MODAL_CLOSE'
      properties: {
        connected: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_ALL_WALLETS'
    }
  | {
      type: 'track'
      address?: string
      event: 'SELECT_WALLET'
      properties: {
        name: string
        platform: Platform
        displayIndex?: number
        walletRank: number | undefined
        view: RouterControllerState['view']
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CONNECT_SUCCESS'
      properties: {
        method: 'qrcode' | 'mobile' | 'browser' | 'email'
        name: string
        reconnect?: boolean
        walletRank: number | undefined
        view: RouterControllerState['view']
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CONNECT_ERROR'
      properties: {
        message: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'USER_REJECTED'
      properties: {
        message: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'DISCONNECT_SUCCESS'
      properties: {
        namespace?: ChainNamespace | 'all'
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'DISCONNECT_ERROR'
      properties: {
        message?: string
      }
    }
  | {
      type: 'error'
      event: 'INTERNAL_SDK_ERROR'
      properties: {
        errorType?: string
        errorMessage?: string
        stackTrace?: string
        uncaught?: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_WALLET_HELP'
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_NETWORK_HELP'
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_GET_WALLET_HELP'
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_TRANSACTIONS'
      properties: { isSmartAccount: boolean }
    }
  | {
      type: 'track'
      address?: string
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
      address?: string
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
      address?: string
      event: 'CLICK_SIGN_SIWX_MESSAGE'
      properties: {
        network: string
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_CANCEL_SIWX'
      properties: {
        network: string
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_NETWORKS'
    }
  | {
      type: 'track'
      address?: string
      event: 'SIWX_AUTH_SUCCESS'
      properties: {
        network: string
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SIWX_AUTH_ERROR'
      properties: {
        network: string
        isSmartAccount: boolean
        message: string | undefined
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_LOGIN_SELECTED'
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_SUBMITTED'
    }
  | {
      type: 'track'
      address?: string
      event: 'DEVICE_REGISTERED_FOR_EMAIL'
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_VERIFICATION_CODE_SENT'
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_VERIFICATION_CODE_PASS'
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_VERIFICATION_CODE_FAIL'
      properties: { message: string }
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_EDIT'
    }
  | {
      type: 'track'
      address?: string
      event: 'EMAIL_UPGRADE_FROM_MODAL'
    }
  | {
      type: 'track'
      address?: string
      event: 'SWITCH_NETWORK'
      properties: { network: string }
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_CONVERT'
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_SELECT_TOKEN_TO_SWAP'
    }
  | {
      type: 'track'
      address?: string
      event: 'CLICK_SELECT_NETWORK_TO_SWAP'
    }
  | {
      type: 'track'
      address?: string
      event: 'SELECT_BUY_CRYPTO'
      properties: { isSmartAccount: boolean }
    }
  | {
      type: 'track'
      address?: string
      event: 'SELECT_BUY_PROVIDER'
      properties: { provider: OnRampProviderOption; isSmartAccount: boolean }
    }
  | {
      type: 'track'
      address?: string
      event: 'SELECT_WHAT_IS_A_BUY'
      properties: { isSmartAccount: boolean }
    }
  | {
      type: 'track'
      address?: string
      event: 'SET_PREFERRED_ACCOUNT_TYPE'
      properties: { accountType: W3mFrameTypes.AccountType; network: string }
    }
  | {
      type: 'track'
      address?: string
      event: 'OPEN_SWAP'
      properties: { isSmartAccount: boolean; network: string }
    }
  | {
      type: 'track'
      address?: string
      event: 'INITIATE_SWAP'
      properties: {
        isSmartAccount: boolean
        network: string
        swapFromToken: string
        swapToToken: string
        swapFromAmount: string
        swapToAmount: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SWAP_SUCCESS'
      properties: {
        isSmartAccount: boolean
        network: string
        swapFromToken: string
        swapToToken: string
        swapFromAmount: string
        swapToAmount: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SWAP_ERROR'
      properties: {
        isSmartAccount: boolean
        network: string
        swapFromToken: string
        swapToToken: string
        swapFromAmount: string
        swapToAmount: string
        message: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SWAP_APPROVAL_ERROR'
      properties: {
        isSmartAccount: boolean
        network: string
        swapFromToken: string
        swapToToken: string
        swapFromAmount: string
        swapToAmount: string
        message: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SOCIAL_LOGIN_STARTED'
      properties: {
        provider: SocialProvider
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SOCIAL_LOGIN_SUCCESS'
      properties: {
        provider: SocialProvider
        reconnect?: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SOCIAL_LOGIN_ERROR'
      properties: {
        provider: SocialProvider
        message: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SOCIAL_LOGIN_REQUEST_USER_DATA'
      properties: {
        provider: SocialProvider
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SOCIAL_LOGIN_CANCELED'
      properties: {
        provider: SocialProvider
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'OPEN_ENS_FLOW'
      properties: {
        isSmartAccount: boolean
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'REGISTER_NAME_INITIATED'
      properties: {
        isSmartAccount: boolean
        ensName: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'REGISTER_NAME_SUCCESS'
      properties: {
        isSmartAccount: boolean
        ensName: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'REGISTER_NAME_ERROR'
      properties: {
        isSmartAccount: boolean
        ensName: string
        error: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'OPEN_SEND'
      properties: {
        isSmartAccount: boolean
        network: string
      }
    }
  | {
      type: 'track'
      address?: string
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
      address?: string
      event: 'SEND_SUCCESS'
      properties: {
        isSmartAccount: boolean
        network: string
        token: string
        hash: string
        amount: number
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SEND_ERROR'
      properties: {
        message: string
        isSmartAccount: boolean
        network: string
        token: string
        amount: number
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SEND_REJECTED'
      properties: {
        message: string
        isSmartAccount: boolean
        network: string
        token: string
        amount: number
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'CONNECT_PROXY_ERROR'
      properties: {
        message: string
        uri: string
        mobile_link: string
        name: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'SEARCH_WALLET'
      properties: {
        badge: string
        search: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'INITIALIZE'
      properties: InitializeAppKitConfigs
    }
  | PayEvent
  | {
      type: 'track'
      address?: string
      event: 'GET_WALLET'
      properties: {
        name: string
        walletRank: number | undefined
        explorerId: string
        type: 'chrome_store' | 'app_store' | 'play_store' | 'homepage'
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'WALLET_IMPRESSION_V2'
      items: Array<WalletImpressionItem | ConnectorImpressionItem>
    }

type PayConfiguration = {
  network: string
  asset: string
  amount: number
  recipient: string
}

type PayExchange = {
  id: string
}

type PayCurrentPayment = {
  exchangeId?: string
  sessionId?: string
  status?: string
  result?: string
  type: 'exchange' | 'wallet'
}

type PayEvent =
  | {
      type: 'track'
      address?: string
      event: 'PAY_SUCCESS'
      properties: {
        source: 'pay' | 'fund-from-exchange'
        paymentId: string
        configuration: PayConfiguration
        currentPayment: PayCurrentPayment
        caipNetworkId?: CaipNetworkId
        message?: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'PAY_ERROR'
      properties: {
        source: 'pay' | 'fund-from-exchange'
        paymentId: string
        configuration: PayConfiguration
        currentPayment: PayCurrentPayment
        caipNetworkId?: CaipNetworkId
        message?: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'PAY_INITIATED'
      properties: {
        source: 'pay' | 'fund-from-exchange'
        paymentId: string
        configuration: PayConfiguration
        currentPayment: PayCurrentPayment
        caipNetworkId?: CaipNetworkId
        message?: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'PAY_MODAL_OPEN'
      properties: {
        exchanges: PayExchange[]
        configuration: PayConfiguration
        caipNetworkId?: CaipNetworkId
        message?: string
      }
    }
  | {
      type: 'track'
      address?: string
      event: 'PAY_EXCHANGE_SELECTED'
      properties: {
        exchange: PayExchange
        configuration: PayConfiguration
        currentPayment: PayCurrentPayment
        headless: boolean
        caipNetworkId?: CaipNetworkId
        source: 'pay' | 'fund-from-exchange'
        message?: string
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
  networkFee: QuoteAmount
  quoteId: string
}

export type GetQuoteArgs = {
  purchaseCurrency: PurchaseCurrency
  paymentCurrency: PaymentCurrency
  amount: string
  network: string
}

export type NamespaceTypeMap = {
  eip155: 'eoa' | 'smartAccount'
  solana: 'eoa'
  bip122: 'payment' | 'ordinal' | 'stx'
  polkadot: 'eoa'
  cosmos: 'eoa'
  sui: 'eoa'
  stacks: 'eoa'
  ton: 'eoa'
  tron: 'eoa'
  stellar: 'eoa'
}

export type AccountTypeMap = {
  [K in ChainNamespace]: {
    namespace: K
    address: string
    chainId?: ChainId
    caipAddress?: CaipAddress
    type: NamespaceTypeMap[K]
    publicKey?: K extends 'bip122' ? string : never
    path?: K extends 'bip122' ? string : never
  }
}
export type WalletGetAssetsParams = {
  account: Address
  assetFilter?: Record<Address, (Address | 'native')[]>
  assetTypeFilter?: ('NATIVE' | 'ERC20')[]
  chainFilter?: Address[]
}

export type WalletGetAssetsResponse = Record<
  Address,
  {
    address: Address | 'native'
    balance: Hex
    type: 'NATIVE' | 'ERC20'
    metadata: Record<string, unknown>
  }[]
>
export type AccountType = AccountTypeMap[ChainNamespace]
export type SendTransactionArgs =
  | {
      chainNamespace?: undefined | 'eip155'
      to: Address
      data: Hex
      value: bigint
      gas?: bigint
      gasPrice?: bigint
      address: Address
    }
  | { chainNamespace: 'solana'; to: string; value: number; tokenMint?: string }

export type EstimateGasTransactionArgs =
  | {
      chainNamespace?: undefined | 'eip155'
      address: Address
      to: Address
      data: Hex
    }
  | {
      chainNamespace: 'solana'
    }

export type SolanaTransactionRequest = {
  instructions: Array<{
    keys: Array<{
      pubkey: string
      isSigner: boolean
      isWritable: boolean
    }>
    programId: string
    data: string
  }>
}

export interface WriteContractArgs {
  tokenAddress: Address
  fromAddress: Address
  method: 'send' | 'transfer' | 'call' | 'approve'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any
  args: unknown[]
  chainNamespace: ChainNamespace
}

export type WriteSolanaTransactionArgs = SolanaTransactionRequest

export type AdapterNetworkState = {
  supportsAllNetworks: boolean
  isUnsupportedChain?: boolean
  caipNetwork?: CaipNetwork
  requestedCaipNetworks?: CaipNetwork[]
  approvedCaipNetworkIds?: CaipNetworkId[]
  allowUnsupportedCaipNetwork?: boolean
  smartAccountEnabledNetworks?: number[]
}

export type ChainAdapter = {
  connectionControllerClient?: ConnectionControllerClient
  accountState?: AccountState
  networkState?: AdapterNetworkState
  namespace?: ChainNamespace
  caipNetworks?: CaipNetwork[]
  projectId?: string
  adapterType?: string
}

export type ProviderEventListener = {
  connect: (connectParams: { chainId: number }) => void
  disconnect: (error: Error) => void
  display_uri: (uri: string) => void
  chainChanged: (chainId: string) => void
  accountsChanged: (accounts: string[]) => void
  message: (message: { type: string; data: unknown }) => void
}

export interface RequestArguments {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

export interface Provider {
  connect: (params?: { onUri?: (uri: string) => void }) => Promise<string>
  disconnect: () => Promise<void>
  request: <T>(args: RequestArguments) => Promise<T>
  on<T extends keyof ProviderEventListener>(event: T, listener: ProviderEventListener[T]): void
  removeListener: <T>(event: string, listener: (data: T) => void) => void
  emit: (event: string, data?: unknown) => void
}

export type CombinedProvider = W3mFrameProvider & Provider

export type WalletFeature = 'swaps' | 'send' | 'receive' | 'onramp'

export type ConnectMethod = 'email' | 'social' | 'wallet'

export type ConnectorTypeOrder =
  | 'walletConnect'
  | 'recent'
  | 'injected'
  | 'featured'
  | 'custom'
  | 'external'
  | 'recommended'

export type RemoteFeatures = {
  swaps?: SwapProvider[] | false
  email?: boolean
  socials?: SocialProvider[] | false
  activity?: boolean
  reownBranding?: boolean
  multiWallet?: boolean
  emailCapture?: EmailCaptureOptions[] | boolean
  reownAuthentication?: boolean
  // Fund Wallet
  payWithExchange?: boolean
  payments?: boolean
  onramp?: OnRampProvider[] | false
  headless?: boolean
}

export type Features = {
  /**
   * @description Enable or disable the swaps feature. Enabled by default.
   * @type {boolean}
   */
  swaps?: boolean
  /**
   * @description Enable or disable the onramp feature. Enabled by default.
   * @type {boolean}
   */
  onramp?: boolean
  /**
   * @description Enable or disable the receive feature. Enabled by default.
   * This feature is only visible when connected with email/social. It's not possible to configure when connected with wallet, which is enabled by default.
   * @type {boolean}
   */
  receive?: boolean
  /**
   * @description Enable or disable the send feature. Enabled by default.
   * @type {boolean}
   */
  send?: boolean
  /**
   * @description Enable or disable the email feature. Enabled by default.
   * @type {boolean}
   */
  email?: boolean
  /**
   * @description Show or hide the regular wallet options when email is enabled. Enabled by default.
   * @type {boolean}
   */
  emailShowWallets?: boolean
  /**
   * @description Enable or disable the socials feature. Enabled by default.
   * @type {SocialProvider[]}
   */
  socials?: SocialProvider[] | false
  /**
   * @description Enable or disable the history feature. Enabled by default.
   * @type {boolean}
   */
  history?: boolean
  /**
   * @description Enable or disable the analytics feature. Enabled by default.
   * @type {boolean}
   */
  analytics?: boolean
  /**
   * @description Enable or disable the all wallets feature. Enabled by default.
   * @type {boolean}
   */
  allWallets?: boolean
  /**
   * @description Enable or disable the Smart Sessions feature. Disabled by default.
   * @type {boolean}
   */
  smartSessions?: boolean
  /**
   * Enable or disable the terms of service and/or privacy policy checkbox.
   * @default false
   */
  legalCheckbox?: boolean
  /**
   * @description The order of the connectors
   * @default ['walletConnect', 'recent', 'injected', 'featured', 'custom', 'external', 'recommended']
   * @type {('walletConnect' | 'recent' | 'injected' | 'featured' | 'custom' | 'external' | 'recommended')[]}
   */
  connectorTypeOrder?: ConnectorTypeOrder[]
  /**
   * @description The order of the connect methods. This is experimental and subject to change.
   * @default ['email', 'social', 'wallet']
   * @type {('email' | 'social' | 'wallet')[]}
   */
  connectMethodsOrder?: ConnectMethod[]
  /**
   * @
   * @description The order of the wallet features. This is experimental and subject to change.
   * @default ['receive' | 'onramp' | 'swaps' | 'send']
   * @type {('receive' | 'onramp' | 'swaps' | 'send')[]}
   */
  walletFeaturesOrder?: WalletFeature[]
  /**
   * @description Enable or disable the collapse wallets as a single "Continue with wallet" button for simple UI in connect page.
   * This can be activated when only have another connect method like email or social activated along with wallets.
   * @default false
   */
  collapseWallets?: boolean

  /**
   * @description Enable or disable the pay feature. Disabled by default.
   * @type {boolean}
   */
  pay?: boolean

  /**
   * @description Enable or disable the ReownAuthentication SIWX feature. Disabled by default.
   * @type {boolean}
   */
  reownAuthentication?: boolean
  /**
   * @description Enable or disable the AppKit Headless mode to build custom connect user interfaces.
   * @default false
   * @type {boolean}
   */
  headless?: boolean
}

export type FeaturesKeys = Exclude<
  keyof Features,
  'swaps' | 'onramp' | 'email' | 'socials' | 'history'
>

export type WalletGuideType = 'get-started' | 'explore'

export type UseAppKitAccountReturn = {
  allAccounts: AccountType[]
  caipAddress: CaipAddress | undefined
  address: string | undefined
  isConnected: boolean
  embeddedWalletInfo?: {
    user: AccountState['user']
    authProvider: AccountState['socialProvider'] | 'email'
    accountType: PreferredAccountTypes[ChainNamespace] | undefined
    isSmartAccountDeployed: boolean
  }
  status: AccountState['status']
}

export type UseAppKitNetworkReturn = {
  caipNetwork: CaipNetwork | undefined
  chainId: number | string | undefined
  caipNetworkId: CaipNetworkId | undefined
  approvedCaipNetworkIds: CaipNetworkId[] | undefined
  supportsAllNetworks: boolean
  switchNetwork: (network: AppKitNetwork) => Promise<void>
}

export type BadgeType = 'none' | 'certified'

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting'

/**
 * @description The default account types for each namespace.
 * @default
 */
export type PreferredAccountTypes = {
  [Key in keyof NamespaceTypeMap]?: NamespaceTypeMap[Key]
}

// -- Feature Configuration Types -------------------------------------------------

export type FeatureID =
  | 'multi_wallet'
  | 'activity'
  | 'onramp'
  | 'swap'
  | 'social_login'
  | 'reown_branding'
  | 'email_capture'
  | 'fund_from_exchange'
  | 'payments'
  | 'reown_authentication'
  | 'headless'
export interface BaseFeature<T extends FeatureID, C extends string[] | null> {
  id: T
  isEnabled: boolean
  config: C
}

export type TypedFeatureConfig =
  | BaseFeature<'activity', null | []>
  | BaseFeature<'onramp', OnRampProvider[]>
  | BaseFeature<'swap', SwapProvider[]>
  | BaseFeature<'social_login', (SocialProvider | 'email')[]>
  | BaseFeature<'reown_branding', null | []>
  | BaseFeature<'multi_wallet', null | []>
  | BaseFeature<'email_capture', EmailCaptureOptions[]>
  | BaseFeature<'headless', null | []>

export type ApiGetProjectConfigResponse = {
  features: TypedFeatureConfig[]
}

export type ApiGetUsageResponse = {
  planLimits: {
    tier: Tier
  } & ProjectLimits
}

export type FeatureConfigMap = {
  email: {
    apiFeatureName: 'social_login'
    localFeatureName: 'email'
    returnType: boolean
    isLegacy: false
  }
  socials: {
    apiFeatureName: 'social_login'
    localFeatureName: 'socials'
    returnType: SocialProvider[] | false
    isLegacy: false
  }
  swaps: {
    apiFeatureName: 'swap'
    localFeatureName: 'swaps'
    returnType: SwapProvider[] | false
    isLegacy: false
  }
  onramp: {
    apiFeatureName: 'onramp'
    localFeatureName: 'onramp'
    returnType: OnRampProvider[] | false
    isLegacy: false
  }
  activity: {
    apiFeatureName: 'activity'
    localFeatureName: 'history'
    returnType: boolean
    isLegacy: true
  }
  reownBranding: {
    apiFeatureName: 'reown_branding'
    localFeatureName: 'reownBranding'
    returnType: boolean
    isLegacy: false
  }
  emailCapture: {
    apiFeatureName: 'email_capture'
    localFeatureName: 'emailCapture'
    returnType: EmailCaptureOptions[] | boolean
    isLegacy: false
  }
  multiWallet: {
    apiFeatureName: 'multi_wallet'
    localFeatureName: 'multiWallet'
    returnType: boolean
    isLegacy: false
  }
  payWithExchange: {
    apiFeatureName: 'fund_from_exchange'
    localFeatureName: 'payWithExchange'
    returnType: boolean
    isLegacy: false
  }
  payments: {
    apiFeatureName: 'payments'
    localFeatureName: 'payments'
    returnType: boolean
    isLegacy: false
  }
  reownAuthentication: {
    apiFeatureName: 'reown_authentication'
    localFeatureName: 'reownAuthentication'
    returnType: boolean
    isLegacy: false
  }
  headless: {
    apiFeatureName: 'headless'
    localFeatureName: 'headless'
    returnType: boolean
    isLegacy: false
  }
}

export type FeatureKey = keyof FeatureConfigMap

export type Tier = 'none' | 'starter' | 'pro' | 'enteprise'

export type ProjectLimits = {
  isAboveRpcLimit: boolean
  isAboveMauLimit: boolean
}

export type ConnectorItemWithKind = {
  kind: 'connector'
  subtype: 'injected' | 'announced' | 'multiChain' | 'external' | 'walletConnect'
  connector: ConnectorWithProviders
}

export type WalletItemWithKind = {
  kind: 'wallet'
  subtype: 'featured' | 'recommended' | 'custom' | 'recent'
  wallet: WcWallet
}

export type ConnectorOrWalletItem = ConnectorItemWithKind | WalletItemWithKind
