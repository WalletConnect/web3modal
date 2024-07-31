import { proxyMap, subscribeKey as subKey } from 'valtio/utils'
import { proxy, ref, subscribe as sub } from 'valtio/vanilla'
import type { CaipNetwork, ChainAdapter, Connector } from '../utils/TypeUtil.js'

import { type Chain } from '@web3modal/common'
import { AccountController, type AccountControllerState } from './AccountController.js'
import { NetworkController, type NetworkControllerState } from './NetworkController.js'
import { PublicStateController } from './PublicStateController.js'

// -- Types --------------------------------------------- //
export interface ChainControllerState {
  multiChainEnabled: boolean
  activeChain: Chain | undefined
  activeCaipNetwork?: CaipNetwork
  chains: Map<Chain, ChainAdapter>
  activeConnector?: Connector
}

type ChainControllerStateKey = keyof ChainControllerState

type ChainsInitializerAdapter = Pick<
  ChainAdapter,
  'connectionControllerClient' | 'networkControllerClient' | 'chain'
>

// -- Constants ----------------------------------------- //
const accountState: AccountControllerState = {
  isConnected: false,
  currentTab: 0,
  tokenBalance: [],
  smartAccountDeployed: false,
  addressLabels: new Map(),
  allAccounts: []
}

const networkState: NetworkControllerState = {
  supportsAllNetworks: true,
  isDefaultCaipNetwork: false,
  smartAccountEnabledNetworks: []
}

// -- State --------------------------------------------- //
const state = proxy<ChainControllerState>({
  multiChainEnabled: false,
  chains: proxyMap<Chain, ChainAdapter>(),
  activeChain: undefined,
  activeCaipNetwork: undefined
})

// -- Controller ---------------------------------------- //
export const ChainController = {
  state,

  subscribeKey<K extends ChainControllerStateKey>(
    key: K,
    callback: (value: ChainControllerState[K]) => void
  ) {
    return subKey(state, key, callback)
  },

  subscribeChain(callback: (value: ChainAdapter | undefined) => void) {
    let prev: ChainAdapter | undefined = undefined
    const activeChain = state.activeChain

    if (activeChain) {
      return sub(state.chains, () => {
        const nextValue = state.chains.get(activeChain)
        if (!prev || prev !== nextValue) {
          prev = nextValue
          callback(nextValue)
        }
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {}
  },

  subscribeChainProp<K extends keyof ChainAdapter>(
    property: K,
    callback: (value: ChainAdapter[K] | undefined) => void
  ) {
    let prev: ChainAdapter[K] | undefined = undefined
    const activeChain = state.activeChain

    if (activeChain) {
      return sub(state.chains, () => {
        const nextValue = state.chains.get(activeChain)?.[property]
        if (prev !== nextValue) {
          prev = nextValue
          callback(nextValue)
        }
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {}
  },

  initialize(adapters: ChainsInitializerAdapter[]) {
    const firstChainToActivate = adapters?.[0]?.chain

    if (!firstChainToActivate) {
      throw new Error('Chain is required to initialize ChainController')
    }

    state.activeChain = firstChainToActivate

    adapters.forEach((adapter: ChainsInitializerAdapter) => {
      state.chains.set(adapter.chain, {
        chain: adapter.chain,
        connectionControllerClient: adapter.connectionControllerClient,
        networkControllerClient: adapter.networkControllerClient,
        accountState,
        networkState
      })
    })
  },

  setMultiChainEnabled(multiChain: boolean) {
    state.multiChainEnabled = multiChain
  },

  setChainNetworkData(chain: Chain | undefined, props: Partial<NetworkControllerState>) {
    if (!chain) {
      throw new Error('Chain is required to update chain network data')
    }

    const chainAdapter = state.chains.get(chain)

    if (chainAdapter) {
      chainAdapter.networkState = {
        ...chainAdapter.networkState,
        ...props
      } as NetworkControllerState
      state.chains.set(chain, chainAdapter)
      NetworkController.replaceState(chainAdapter.networkState)
    }
  },

  setChainAccountData(chain: Chain | undefined, accountProps: Partial<AccountControllerState>) {
    if (!chain) {
      throw new Error('Chain is required to update chain account data')
    }

    const chainAdapter = state.chains.get(chain)

    if (chainAdapter) {
      chainAdapter.accountState = {
        ...chainAdapter.accountState,
        ...accountProps
      } as AccountControllerState
      state.chains.set(chain, chainAdapter)
      AccountController.replaceState(chainAdapter.accountState)
    }
  },

  setAccountProp(
    prop: keyof AccountControllerState,
    value: AccountControllerState[keyof AccountControllerState],
    chain?: Chain
  ) {
    this.setChainAccountData(state.multiChainEnabled ? chain : state.activeChain, {
      [prop]: value
    })
  },

  setActiveChain(chain?: Chain) {
    const newAdapter = chain ? state.chains.get(chain) : undefined

    if (newAdapter) {
      state.activeChain = newAdapter.chain
      state.activeCaipNetwork = state.chains.get(newAdapter.chain)?.networkState
        ?.requestedCaipNetworks?.[0]
      PublicStateController.set({ activeChain: chain })
    }
  },

  setActiveConnector(connector: ChainControllerState['activeConnector']) {
    if (connector) {
      state.activeConnector = ref(connector)
    }
  },

  getNetworkControllerClient() {
    const chain = state.activeChain

    if (!chain) {
      throw new Error('Chain is required to get network controller client')
    }

    const chainAdapter = state.chains.get(chain)

    if (!chainAdapter) {
      throw new Error('Chain adapter not found')
    }

    if (!chainAdapter.networkControllerClient) {
      throw new Error('NetworkController client not set')
    }

    return chainAdapter.networkControllerClient
  },

  getConnectionControllerClient() {
    const chain = state.activeChain

    if (!chain) {
      throw new Error('Chain is required to get connection controller client')
    }

    const chainAdapter = state.chains.get(chain)

    if (!chainAdapter) {
      throw new Error('Chain adapter not found')
    }

    if (!chainAdapter.connectionControllerClient) {
      throw new Error('ConnectionController client not set')
    }

    return chainAdapter.connectionControllerClient
  },

  getAccountProp<K extends keyof AccountControllerState>(
    key: K
  ): AccountControllerState[K] | undefined {
    const chainToWrite = state.multiChainEnabled ? state.activeChain : state.activeChain

    if (!chainToWrite) {
      return undefined
    }

    const chainAccountState = state.chains.get(chainToWrite)?.accountState

    if (!chainAccountState) {
      return undefined
    }

    return chainAccountState[key]
  },

  getNetworkProp<K extends keyof NetworkControllerState>(
    key: K
  ): NetworkControllerState[K] | undefined {
    const chainToWrite = state.multiChainEnabled ? state.activeChain : state.activeChain

    if (!chainToWrite) {
      return undefined
    }

    const chainNetworkState = state.chains.get(chainToWrite)?.networkState

    if (!chainNetworkState) {
      return undefined
    }

    return chainNetworkState[key]
  },

  resetAccount(chain?: Chain) {
    const chainToWrite = state.multiChainEnabled ? chain : state.activeChain

    if (!chainToWrite) {
      throw new Error('Chain is required to set account prop')
    }

    this.setChainAccountData(chainToWrite, {
      isConnected: false,
      smartAccountDeployed: false,
      currentTab: 0,
      caipAddress: undefined,
      address: undefined,
      balance: undefined,
      balanceSymbol: undefined,
      profileName: undefined,
      profileImage: undefined,
      addressExplorerUrl: undefined,
      tokenBalance: [],
      connectedWalletInfo: undefined,
      preferredAccountType: undefined,
      socialProvider: undefined,
      socialWindow: undefined,
      farcasterUrl: undefined
    })
  }
}
