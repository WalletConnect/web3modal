import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import { proxy, ref, subscribe as sub } from 'valtio/vanilla'
import type { W3mFrameTypes } from '@web3modal/wallet'
import type { Chain, CombinedProvider, Provider } from './EthersTypesUtil.js'
import { getAddress } from 'ethers'

// -- Types --------------------------------------------- //

export interface EthersStoreUtilState {
  provider?: Provider | CombinedProvider
  providerType?: 'walletConnect' | 'injected' | 'coinbaseWallet' | 'eip6963' | 'w3mEmail'
  address?: string | undefined
  chainId?: number
  supportedChains: Chain[]
  error?: unknown
  preferredAccountType?: W3mFrameTypes.AccountType
  isConnected: boolean
}

type StateKey = keyof EthersStoreUtilState

// -- State --------------------------------------------- //
const state = proxy<EthersStoreUtilState>({
  provider: undefined,
  providerType: undefined,
  address: undefined,
  chainId: undefined,
  supportedChains: [],
  isConnected: false
})

// -- StoreUtil ---------------------------------------- //
export const EthersStoreUtil = {
  state,

  subscribeKey<K extends StateKey>(key: K, callback: (value: EthersStoreUtilState[K]) => void) {
    return subKey(state, key, callback)
  },

  subscribe(callback: (newState: EthersStoreUtilState) => void) {
    return sub(state, () => callback(state))
  },

  setProvider(provider: EthersStoreUtilState['provider']) {
    if (provider) {
      state.provider = ref(provider)
    }
  },

  setProviderType(providerType: EthersStoreUtilState['providerType']) {
    state.providerType = providerType
  },

  setAddress(address: EthersStoreUtilState['address']) {
    state.address = address ? getAddress(address) : undefined
  },

  setPreferredAccountType(preferredAccountType: EthersStoreUtilState['preferredAccountType']) {
    state.preferredAccountType = preferredAccountType
  },

  setChainId(chainId: EthersStoreUtilState['chainId']) {
    state.chainId = chainId
  },

  setSupportedChains(supportedChains: EthersStoreUtilState['supportedChains']) {
    state.supportedChains = supportedChains
  },

  setIsConnected(isConnected: EthersStoreUtilState['isConnected']) {
    state.isConnected = isConnected
  },

  setError(error: EthersStoreUtilState['error']) {
    state.error = error
  },

  reset() {
    state.provider = undefined
    state.address = undefined
    state.chainId = undefined
    state.providerType = undefined
    state.isConnected = false
    state.error = undefined
    state.preferredAccountType = undefined
  }
}
