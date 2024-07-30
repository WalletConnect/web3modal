import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'
import type {
  AccountType,
  CaipAddress,
  ConnectedWalletInfo,
  SocialProvider
} from '../utils/TypeUtil.js'
import type { Balance } from '@web3modal/common'
import { BlockchainApiController } from './BlockchainApiController.js'
import { SnackController } from './SnackController.js'
import { SwapController } from './SwapController.js'
import { SwapApiUtil } from '../utils/SwapApiUtil.js'
import type { W3mFrameTypes } from '@web3modal/wallet'
import { ChainController } from './ChainController.js'
import type { Chain } from '@web3modal/common'
import { NetworkController } from './NetworkController.js'
import { proxy, ref } from 'valtio'

// -- Types --------------------------------------------- //
export interface AccountControllerState {
  isConnected: boolean
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
}

// -- State --------------------------------------------- //
const state = proxy<AccountControllerState>({
  isConnected: false,
  currentTab: 0,
  tokenBalance: [],
  smartAccountDeployed: false,
  addressLabels: new Map(),
  allAccounts: []
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
    callback: (val: AccountControllerState[K]) => void
  ) {
    let prev: AccountControllerState[K] | undefined = undefined

    return ChainController.subscribeChainProp('accountState', accountState => {
      if (accountState) {
        const nextValue = accountState[property]
        if (prev !== nextValue) {
          prev = nextValue
          callback(nextValue)
        }
      }
    })
  },

  setIsConnected(isConnected: AccountControllerState['isConnected'], chain?: Chain) {
    ChainController.setAccountProp('isConnected', isConnected, chain)
  },

  getChainIsConnected(chain?: Chain) {
    return ChainController.getAccountProp('isConnected', chain)
  },

  setCaipAddress(caipAddress: AccountControllerState['caipAddress'], chain?: Chain) {
    const newCaipAddress = caipAddress ? CoreHelperUtil.getPlainAddress(caipAddress) : undefined

    ChainController.setAccountProp('caipAddress', caipAddress, chain)
    ChainController.setAccountProp('address', newCaipAddress, chain)
  },

  setBalance(
    balance: AccountControllerState['balance'],
    balanceSymbol: AccountControllerState['balanceSymbol'],
    chain?: Chain
  ) {
    ChainController.setAccountProp('balance', balance, chain)
    ChainController.setAccountProp('balanceSymbol', balanceSymbol, chain)
  },

  setProfileName(profileName: AccountControllerState['profileName'], chain?: Chain) {
    ChainController.setAccountProp('profileName', profileName, chain)
  },

  setProfileImage(profileImage: AccountControllerState['profileImage'], chain?: Chain) {
    ChainController.setAccountProp('profileImage', profileImage, chain)
  },

  setAddressExplorerUrl(explorerUrl: AccountControllerState['addressExplorerUrl'], chain?: Chain) {
    ChainController.setAccountProp('addressExplorerUrl', explorerUrl, chain)
  },

  setSmartAccountDeployed(isDeployed: boolean, chain?: Chain) {
    ChainController.setAccountProp('smartAccountDeployed', isDeployed, chain)
  },

  setCurrentTab(currentTab: AccountControllerState['currentTab']) {
    ChainController.setAccountProp('currentTab', currentTab, ChainController.state.activeChain)
  },

  setTokenBalance(tokenBalance: AccountControllerState['tokenBalance'], chain?: Chain) {
    if (tokenBalance) {
      ChainController.setAccountProp('tokenBalance', tokenBalance, chain)
    }
  },
  setShouldUpdateToAddress(address: string) {
    ChainController.setAccountProp('shouldUpdateToAddress', address)
  },

  setAllAccounts(accounts: AccountType[], chain?: Chain) {
    ChainController.setAccountProp('allAccounts', accounts, chain)
  },

  addAddressLabel(address: string, label: string, chain?: Chain) {
    const map = ChainController.getAccountProp('addressLabels', chain) || new Map()
    map.set(address, label)
    ChainController.setAccountProp('addressLabels', map, chain)
  },

  removeAddressLabel(address: string, chain?: Chain) {
    const map = ChainController.getAccountProp('addressLabels', chain) || new Map()
    map.delete(address)
    ChainController.setAccountProp('addressLabels', map, chain)
  },

  setConnectedWalletInfo(
    connectedWalletInfo: AccountControllerState['connectedWalletInfo'],
    chain?: Chain
  ) {
    ChainController.setAccountProp('connectedWalletInfo', connectedWalletInfo, chain)
  },

  setPreferredAccountType(
    preferredAccountType: AccountControllerState['preferredAccountType'],
    chain?: Chain
  ) {
    ChainController.setAccountProp('preferredAccountType', preferredAccountType, chain)
  },

  setSocialProvider(socialProvider: AccountControllerState['socialProvider'], chain?: Chain) {
    if (socialProvider) {
      ChainController.setAccountProp('socialProvider', socialProvider, chain)
    }
  },

  setSocialWindow(socialWindow: AccountControllerState['socialWindow'], chain?: Chain) {
    if (socialWindow) {
      ChainController.setAccountProp('socialWindow', ref(socialWindow), chain)
    }
  },

  setFarcasterUrl(farcasterUrl: AccountControllerState['farcasterUrl'], chain?: Chain) {
    if (farcasterUrl) {
      ChainController.setAccountProp('farcasterUrl', farcasterUrl, chain)
    }
  },

  async fetchTokenBalance() {
    const chainId = NetworkController.state.caipNetwork?.id
    const chain = NetworkController.state.caipNetwork?.chain
    const address = AccountController.state.address

    try {
      if (address && chainId) {
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

  resetAccount(chain?: Chain) {
    ChainController.resetAccount(chain)
  }
}
