import type { Balance, CaipAddress, ChainNamespace } from '@reown/appkit-common'
import type { W3mFrameTypes } from '@reown/appkit-wallet'
import type UniversalProvider from '@walletconnect/universal-provider'
import { proxy, ref } from 'valtio/vanilla'
import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'
import { SwapApiUtil } from '../utils/SwapApiUtil.js'
import type {
  AccountType,
  CombinedProvider,
  ConnectedWalletInfo,
  Provider,
  SocialProvider
} from '../utils/TypeUtil.js'
import { BlockchainApiController } from './BlockchainApiController.js'
import { ChainController } from './ChainController.js'
import { SnackController } from './SnackController.js'
import { SwapController } from './SwapController.js'

// -- Types --------------------------------------------- //
export interface AccountControllerState {
  currentTab: number
  caipAddress?: CaipAddress
  address?: string
  addressLabels: Map<string, string>
  allAccounts: AccountType[]
  balance?: string
  balanceSymbol?: string
  profileName?: string | null
  profileImage?: string | null
  addressExplorerUrl?: string
  smartAccountDeployed?: boolean
  socialProvider?: SocialProvider
  tokenBalance?: Balance[]
  shouldUpdateToAddress?: string
  connectedWalletInfo?: ConnectedWalletInfo
  preferredAccountType?: W3mFrameTypes.AccountType
  socialWindow?: Window
  farcasterUrl?: string
  isOneClickAuthenticating?: boolean
  provider?: UniversalProvider | Provider | CombinedProvider
  status?: 'reconnecting' | 'connected' | 'disconnected' | 'connecting'
  siweStatus?:
    | 'uninitialized'
    | 'ready'
    | 'loading'
    | 'success'
    | 'rejected'
    | 'error'
    | 'authenticating'
}

// -- State --------------------------------------------- //
const state = proxy<AccountControllerState>({
  currentTab: 0,
  tokenBalance: [],
  smartAccountDeployed: false,
  addressLabels: new Map(),
  allAccounts: [],
  isOneClickAuthenticating: false
})

// -- Controller ---------------------------------------- //
export const AccountController = {
  state,

  replaceState(newState: AccountControllerState | undefined) {
    if (!newState) {
      return
    }

    Object.assign(state, ref(newState))
  },

  subscribe(callback: (val: AccountControllerState) => void) {
    return ChainController.subscribeChainProp('accountState', accountState => {
      if (accountState) {
        return callback(accountState)
      }

      return undefined
    })
  },

  subscribeKey<K extends keyof AccountControllerState>(
    property: K,
    callback: (val: AccountControllerState[K]) => void,
    chain?: ChainNamespace
  ) {
    let prev: AccountControllerState[K] | undefined = undefined

    return ChainController.subscribeChainProp(
      'accountState',
      accountState => {
        if (accountState) {
          const nextValue = accountState[property]
          if (prev !== nextValue) {
            prev = nextValue
            callback(nextValue)
          }
        }
      },
      chain
    )
  },

  setStatus(status: AccountControllerState['status'], chain: ChainNamespace | undefined) {
    ChainController.setAccountProp('status', status, chain)
  },

  getCaipAddress(chain: ChainNamespace | undefined) {
    return ChainController.getAccountProp('caipAddress', chain)
  },

  setProvider(provider: AccountControllerState['provider'], chain: ChainNamespace | undefined) {
    if (provider) {
      ChainController.setAccountProp('provider', provider, chain)
    }
  },

  setCaipAddress(
    caipAddress: AccountControllerState['caipAddress'],
    chain: ChainNamespace | undefined
  ) {
    const newAddress = caipAddress ? CoreHelperUtil.getPlainAddress(caipAddress) : undefined

    ChainController.state.activeCaipAddress = caipAddress
    ChainController.setAccountProp('caipAddress', caipAddress, chain)
    ChainController.setAccountProp('address', newAddress, chain)
  },

  setBalance(
    balance: AccountControllerState['balance'],
    balanceSymbol: AccountControllerState['balanceSymbol'],
    chain: ChainNamespace
  ) {
    ChainController.setAccountProp('balance', balance, chain)
    ChainController.setAccountProp('balanceSymbol', balanceSymbol, chain)
  },

  setProfileName(profileName: AccountControllerState['profileName'], chain: ChainNamespace) {
    ChainController.setAccountProp('profileName', profileName, chain)
  },

  setProfileImage(profileImage: AccountControllerState['profileImage'], chain?: ChainNamespace) {
    ChainController.setAccountProp('profileImage', profileImage, chain)
  },

  setAddressExplorerUrl(
    explorerUrl: AccountControllerState['addressExplorerUrl'],
    chain: ChainNamespace | undefined
  ) {
    ChainController.setAccountProp('addressExplorerUrl', explorerUrl, chain)
  },

  setSmartAccountDeployed(isDeployed: boolean, chain: ChainNamespace | undefined) {
    ChainController.setAccountProp('smartAccountDeployed', isDeployed, chain)
  },

  setCurrentTab(currentTab: AccountControllerState['currentTab']) {
    ChainController.setAccountProp('currentTab', currentTab, ChainController.state.activeChain)
  },

  setTokenBalance(
    tokenBalance: AccountControllerState['tokenBalance'],
    chain: ChainNamespace | undefined
  ) {
    if (tokenBalance) {
      ChainController.setAccountProp('tokenBalance', tokenBalance, chain)
    }
  },
  setShouldUpdateToAddress(address: string, chain: ChainNamespace | undefined) {
    ChainController.setAccountProp('shouldUpdateToAddress', address, chain)
  },

  setAllAccounts(accounts: AccountType[], chain: ChainNamespace | undefined) {
    ChainController.setAccountProp('allAccounts', accounts, chain)
  },

  addAddressLabel(address: string, label: string, chain: ChainNamespace | undefined) {
    const map = ChainController.getAccountProp('addressLabels', chain) || new Map()
    map.set(address, label)
    ChainController.setAccountProp('addressLabels', map, chain)
  },

  removeAddressLabel(address: string, chain: ChainNamespace | undefined) {
    const map = ChainController.getAccountProp('addressLabels', chain) || new Map()
    map.delete(address)
    ChainController.setAccountProp('addressLabels', map, chain)
  },

  setConnectedWalletInfo(
    connectedWalletInfo: AccountControllerState['connectedWalletInfo'],
    chain: ChainNamespace
  ) {
    ChainController.setAccountProp('connectedWalletInfo', connectedWalletInfo, chain, false)
  },

  setPreferredAccountType(
    preferredAccountType: AccountControllerState['preferredAccountType'],
    chain: ChainNamespace
  ) {
    ChainController.setAccountProp('preferredAccountType', preferredAccountType, chain)
  },

  setSocialProvider(
    socialProvider: AccountControllerState['socialProvider'],
    chain: ChainNamespace | undefined
  ) {
    if (socialProvider) {
      ChainController.setAccountProp('socialProvider', socialProvider, chain)
    }
  },

  setSocialWindow(
    socialWindow: AccountControllerState['socialWindow'],
    chain: ChainNamespace | undefined
  ) {
    if (socialWindow) {
      ChainController.setAccountProp('socialWindow', ref(socialWindow), chain)
    }
  },

  setFarcasterUrl(
    farcasterUrl: AccountControllerState['farcasterUrl'],
    chain: ChainNamespace | undefined
  ) {
    if (farcasterUrl) {
      ChainController.setAccountProp('farcasterUrl', farcasterUrl, chain)
    }
  },

  async fetchTokenBalance() {
    const chainId = ChainController.state.activeCaipNetwork?.caipNetworkId
    const chain = ChainController.state.activeCaipNetwork?.chainNamespace
    const caipAddress = ChainController.state.activeCaipAddress
    const address = caipAddress ? CoreHelperUtil.getPlainAddress(caipAddress) : undefined

    try {
      if (address && chainId && chain) {
        const response = await BlockchainApiController.getBalance(address, chainId)

        const filteredBalances = response.balances.filter(
          balance => balance.quantity.decimals !== '0'
        )

        this.setTokenBalance(filteredBalances, chain)
        SwapController.setBalances(SwapApiUtil.mapBalancesToSwapTokens(response.balances))
      }
    } catch (error) {
      SnackController.showError('Failed to fetch token balance')
    }
  },

  resetAccount(chain: ChainNamespace) {
    ChainController.resetAccount(chain)
  },

  setSiweStatus(status: AccountControllerState['siweStatus']) {
    ChainController.setAccountProp('siweStatus', status, ChainController.state.activeChain)
  },

  setIsOneClickAuthenticating(
    isOneClickAuthenticating: AccountControllerState['isOneClickAuthenticating']
  ) {
    ChainController.setAccountProp(
      'isOneClickAuthenticating',
      isOneClickAuthenticating,
      ChainController.state.activeChain
    )
  }
}
