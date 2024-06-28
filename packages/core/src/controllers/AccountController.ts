import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import { proxy, ref, subscribe as sub } from 'valtio/vanilla'
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
import { NetworkController } from './NetworkController.js'

// -- Types --------------------------------------------- //
export interface AccountControllerState {
  isConnected: boolean
  currentTab: number
  caipAddress?: CaipAddress
  address?: string
  addresses?: string[]
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
}

type StateKey = keyof AccountControllerState

// -- State --------------------------------------------- //
const state = proxy<AccountControllerState>({
  isConnected: false,
  currentTab: 0,
  tokenBalance: [],
  smartAccountDeployed: false,
  allAccounts: [],
  addressLabels: new Map()
})

// -- Controller ---------------------------------------- //
export const AccountController = {
  state,

  subscribe(callback: (newState: AccountControllerState) => void) {
    return sub(state, () => callback(state))
  },

  subscribeKey<K extends StateKey>(key: K, callback: (value: AccountControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  setIsConnected(isConnected: AccountControllerState['isConnected']) {
    state.isConnected = isConnected
  },

  setCaipAddress(caipAddress: AccountControllerState['caipAddress']) {
    state.caipAddress = caipAddress
    state.address = caipAddress ? CoreHelperUtil.getPlainAddress(caipAddress) : undefined
  },

  setAddresses(addresses: AccountControllerState['addresses']) {
    state.addresses = addresses
  },

  setBalance(
    balance: AccountControllerState['balance'],
    balanceSymbol: AccountControllerState['balanceSymbol']
  ) {
    state.balance = balance
    state.balanceSymbol = balanceSymbol
  },

  setProfileName(profileName: AccountControllerState['profileName']) {
    state.profileName = profileName
  },

  setProfileImage(profileImage: AccountControllerState['profileImage']) {
    state.profileImage = profileImage
  },

  setAddressExplorerUrl(explorerUrl: AccountControllerState['addressExplorerUrl']) {
    state.addressExplorerUrl = explorerUrl
  },

  setSmartAccountDeployed(isDeployed: boolean) {
    state.smartAccountDeployed = isDeployed
  },

  setCurrentTab(currentTab: AccountControllerState['currentTab']) {
    state.currentTab = currentTab
  },

  setTokenBalance(tokenBalance: AccountControllerState['tokenBalance']) {
    if (tokenBalance) {
      state.tokenBalance = ref(tokenBalance)
    }
  },
  setShouldUpdateToAddress(address: string) {
    state.shouldUpdateToAddress = address
  },

  setAllAccounts(accounts: AccountType[]) {
    console.log('@AccountController setAllAccounts', accounts)
    state.allAccounts = accounts
  },

  addAddressLabel(address: string, label: string) {
    state.addressLabels.set(address, label)
  },

  removeAddressLabel(address: string) {
    state.addressLabels.delete(address)
  },

  setConnectedWalletInfo(connectedWalletInfo: AccountControllerState['connectedWalletInfo']) {
    state.connectedWalletInfo = connectedWalletInfo
  },

  setPreferredAccountType(preferredAccountType: AccountControllerState['preferredAccountType']) {
    state.preferredAccountType = preferredAccountType
  },

  setSocialProvider(socialProvider: AccountControllerState['socialProvider']) {
    if (socialProvider) {
      state.socialProvider = socialProvider
    }
  },

  setSocialWindow(socialWindow: AccountControllerState['socialWindow']) {
    if (socialWindow) {
      state.socialWindow = ref(socialWindow)
    }
  },

  async fetchTokenBalance() {
    const chainId = NetworkController.state.caipNetwork?.id

    try {
      if (state.address && chainId) {
        const response = await BlockchainApiController.getBalance(state.address, chainId)

        const filteredBalances = response.balances.filter(
          balance => balance.quantity.decimals !== '0'
        )

        this.setTokenBalance(filteredBalances)
        SwapController.setBalances(SwapApiUtil.mapBalancesToSwapTokens(response.balances))
      }
    } catch (error) {
      SnackController.showError('Failed to fetch token balance')
    }
  },

  resetAccount() {
    console.log('@AccountController resetAccount')
    state.isConnected = false
    state.smartAccountDeployed = false
    state.currentTab = 0
    state.caipAddress = undefined
    state.address = undefined
    state.balance = undefined
    state.balanceSymbol = undefined
    state.profileName = undefined
    state.profileImage = undefined
    state.addressExplorerUrl = undefined
    state.tokenBalance = []
    state.shouldUpdateToAddress = undefined
    state.connectedWalletInfo = undefined
    state.preferredAccountType = undefined
    state.socialProvider = undefined
    state.socialWindow = undefined
  }
}
