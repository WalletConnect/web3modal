import { proxy, ref } from 'valtio/vanilla'
import { EventsController } from './EventsController.js'
import { ModalController } from './ModalController.js'
import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'
import {
  NetworkUtil,
  SafeLocalStorage,
  SafeLocalStorageKeys,
  type CaipNetwork,
  type CaipNetworkId,
  type ChainNamespace
} from '@rerock/appkit-common'
import { ChainController } from './ChainController.js'
import { PublicStateController } from './PublicStateController.js'
import { ConstantsUtil } from '../utils/ConstantsUtil.js'

// -- Types --------------------------------------------- //
export interface NetworkControllerClient {
  switchCaipNetwork: (network: NetworkControllerState['caipNetwork']) => Promise<void>
  getApprovedCaipNetworksData: () => Promise<{
    approvedCaipNetworkIds: NetworkControllerState['approvedCaipNetworkIds']
    supportsAllNetworks: NetworkControllerState['supportsAllNetworks']
  }>
}

export interface NetworkControllerState {
  supportsAllNetworks: boolean
  isDefaultCaipNetwork: boolean
  isUnsupportedChain?: boolean
  _client?: NetworkControllerClient
  caipNetwork?: CaipNetwork
  requestedCaipNetworks?: CaipNetwork[]
  approvedCaipNetworkIds?: CaipNetworkId[]
  allowUnsupportedCaipNetwork?: boolean
  smartAccountEnabledNetworks?: number[]
}

// -- State --------------------------------------------- //
const state = proxy<NetworkControllerState>({
  supportsAllNetworks: true,
  isDefaultCaipNetwork: false,
  smartAccountEnabledNetworks: []
})

// -- Controller ---------------------------------------- //
export const NetworkController = {
  state,

  replaceState(newState: NetworkControllerState | undefined) {
    if (!newState) {
      return
    }

    Object.assign(state, ref(newState))
  },

  subscribeKey<K extends keyof NetworkControllerState>(
    property: K,
    callback: (val: NetworkControllerState[K]) => void
  ) {
    let prev: NetworkControllerState[K] | undefined = undefined

    return ChainController.subscribeChainProp('networkState', networkState => {
      if (networkState) {
        const nextValue = networkState[property]
        if (prev !== nextValue) {
          prev = nextValue
          callback(nextValue)
        }
      }
    })
  },

  _getClient() {
    return ChainController.getNetworkControllerClient()
  },

  initializeDefaultNetwork() {
    const networks = this.getRequestedCaipNetworks()

    if (networks.length > 0) {
      this.setCaipNetwork(networks[0])
    }
  },

  setDefaultCaipNetwork(caipNetwork: NetworkControllerState['caipNetwork']) {
    if (caipNetwork) {
      ChainController.setCaipNetwork(caipNetwork.chainNamespace, caipNetwork)
      ChainController.setChainNetworkData(caipNetwork.chainNamespace, {
        isDefaultCaipNetwork: true
      })
      PublicStateController.set({ selectedNetworkId: caipNetwork.id })
    }
  },

  setActiveCaipNetwork(caipNetwork: NetworkControllerState['caipNetwork']) {
    if (!caipNetwork) {
      return
    }

    ChainController.setActiveCaipNetwork(caipNetwork)
    ChainController.setChainNetworkData(caipNetwork.chainNamespace, { caipNetwork })
    PublicStateController.set({
      activeChain: caipNetwork.chainNamespace,
      selectedNetworkId: caipNetwork?.id
    })

    SafeLocalStorage.setItem(SafeLocalStorageKeys.ACTIVE_CAIP_NETWORK, JSON.stringify(caipNetwork))

    const isSupported = this.checkIfSupportedNetwork()

    if (!isSupported) {
      this.showUnsupportedChainUI()
    }
  },

  setCaipNetwork(caipNetwork: NetworkControllerState['caipNetwork']) {
    if (!caipNetwork) {
      return
    }

    if (!caipNetwork?.chainNamespace) {
      throw new Error('chain is required to set active network')
    }

    ChainController.setCaipNetwork(caipNetwork?.chainNamespace, caipNetwork)
  },

  setRequestedCaipNetworks(
    requestedNetworks: NetworkControllerState['requestedCaipNetworks'],
    chain: ChainNamespace | undefined
  ) {
    ChainController.setChainNetworkData(chain, { requestedCaipNetworks: requestedNetworks })
  },

  setAllowUnsupportedChain(
    allowUnsupportedCaipNetwork: NetworkControllerState['allowUnsupportedCaipNetwork'],
    chain: ChainNamespace | undefined
  ) {
    ChainController.setChainNetworkData(chain || ChainController.state.activeChain, {
      allowUnsupportedCaipNetwork
    })
  },

  setSmartAccountEnabledNetworks(
    smartAccountEnabledNetworks: NetworkControllerState['smartAccountEnabledNetworks'],
    chain: ChainNamespace | undefined
  ) {
    ChainController.setChainNetworkData(chain, { smartAccountEnabledNetworks })
  },

  getRequestedCaipNetworks(chainToFilter?: ChainNamespace) {
    let chainAdapters: ChainNamespace[] | undefined = undefined

    if (!ChainController.state.activeChain) {
      throw new Error('activeChain is required to get requested networks')
    }

    if (chainToFilter) {
      const chain = chainToFilter

      if (!chain) {
        throw new Error('chain is required to get requested networks')
      }

      chainAdapters = [chain]
    } else {
      const chains = [...ChainController.state.chains.keys()]

      chainAdapters = chains
    }

    const approvedIds: `${string}:${string}`[] = []
    const requestedNetworks: CaipNetwork[] = []

    chainAdapters.forEach((chn: ChainNamespace) => {
      if (ChainController.state.chains.get(chn)?.networkState?.approvedCaipNetworkIds) {
        approvedIds.push(
          ...(ChainController.state.chains.get(chn)?.networkState?.approvedCaipNetworkIds || [])
        )
      }
      if (ChainController.state.chains.get(chn)?.networkState?.requestedCaipNetworks) {
        requestedNetworks.push(
          ...(ChainController.state.chains.get(chn)?.networkState?.requestedCaipNetworks || [])
        )
      }
    })

    const sortedNetworks = CoreHelperUtil.sortRequestedNetworks(approvedIds, requestedNetworks)

    return sortedNetworks
  },

  async switchActiveNetwork(network: NetworkControllerState['caipNetwork']) {
    const sameNamespace = network?.chainNamespace === ChainController.state.activeChain

    let networkControllerClient: NetworkControllerState['_client'] = undefined
    const isWcConnector =
      SafeLocalStorage.getItem(SafeLocalStorageKeys.WALLET_ID) === 'walletConnect'
    const hasWagmiAdapter = ChainController.state.chains.get('eip155')?.adapterType === 'wagmi'

    if (isWcConnector && network?.chainNamespace === 'solana') {
      if (hasWagmiAdapter) {
        networkControllerClient = ChainController.state.chains.get(network.chainNamespace)
          ?.networkControllerClient
      } else {
        networkControllerClient = ChainController.state.universalAdapter.networkControllerClient
      }
    } else if (isWcConnector && !hasWagmiAdapter) {
      networkControllerClient = ChainController.state.universalAdapter.networkControllerClient
    } else if (sameNamespace) {
      networkControllerClient = ChainController.getNetworkControllerClient()
    } else {
      networkControllerClient = network
        ? ChainController.state.chains.get(network.chainNamespace)?.networkControllerClient
        : undefined
    }

    await networkControllerClient?.switchCaipNetwork(network)
    ChainController.setActiveCaipNetwork(network)

    if (network) {
      EventsController.sendEvent({
        type: 'track',
        event: 'SWITCH_NETWORK',
        properties: { network: network.id }
      })
    }
  },

  getApprovedCaipNetworkIds(chainToFilter?: ChainNamespace) {
    if (chainToFilter) {
      const chain = chainToFilter

      if (!chain) {
        throw new Error('chain is required to get approved network IDs')
      }

      return ChainController.state.chains.get(chain)?.networkState?.approvedCaipNetworkIds
    }

    const allCaipNetworkIds: CaipNetworkId[] = []

    Object.values(ChainController.state.chains).forEach(adapter => {
      if (adapter.networkState.approvedCaipNetworkIds) {
        allCaipNetworkIds.push(...(adapter.networkState?.approvedCaipNetworkIds || []))
      }
    })

    return allCaipNetworkIds
  },

  async setApprovedCaipNetworksData(chain: ChainNamespace | undefined) {
    const networkControllerClient = ChainController.getNetworkControllerClient()

    const data = await networkControllerClient?.getApprovedCaipNetworksData()

    if (!chain) {
      throw new Error('chain is required to set approved network data')
    }

    ChainController.setChainNetworkData(chain, {
      approvedCaipNetworkIds: data?.approvedCaipNetworkIds,
      supportsAllNetworks: data?.supportsAllNetworks
    })
  },

  checkIfSupportedNetwork() {
    const chain = ChainController.state.activeChain

    if (!chain) {
      return false
    }

    const activeCaipNetwork = ChainController.state.chains.get(chain)?.networkState?.caipNetwork
    const requestedCaipNetworks = this.getRequestedCaipNetworks()

    if (!requestedCaipNetworks.length) {
      return true
    }

    return requestedCaipNetworks?.some(network => network.id === activeCaipNetwork?.id)
  },

  checkIfSmartAccountEnabled() {
    const networkId = NetworkUtil.caipNetworkIdToNumber(state.caipNetwork?.id)
    const activeChain = ChainController.state.activeChain

    if (!activeChain) {
      throw new Error('activeChain is required to check if smart account is enabled')
    }

    if (!networkId) {
      return false
    }

    const smartAccountEnabledNetworks = ChainController.getNetworkProp(
      'smartAccountEnabledNetworks'
    )

    return Boolean(smartAccountEnabledNetworks?.includes(Number(networkId)))
  },

  resetNetwork() {
    const chain = ChainController.state.activeChain

    if (!chain) {
      throw new Error('chain is required to reset network')
    }

    if (!ChainController.state.chains.get(chain)?.networkState?.isDefaultCaipNetwork) {
      ChainController.setChainNetworkData(chain, { caipNetwork: undefined })
    }

    ChainController.setChainNetworkData(chain, {
      approvedCaipNetworkIds: undefined,
      supportsAllNetworks: true,
      smartAccountEnabledNetworks: []
    })
  },

  getSupportsAllNetworks() {
    const chain = ChainController.state.activeChain

    if (!chain) {
      throw new Error('chain is required to check if network supports all networks')
    }

    return ChainController.state.chains.get(chain)?.networkState?.supportsAllNetworks
  },

  showUnsupportedChainUI() {
    setTimeout(() => {
      ModalController.open({ view: 'UnsupportedChain' })
    }, 300)
  },

  getActiveNetworkTokenAddress() {
    const address =
      ConstantsUtil.NATIVE_TOKEN_ADDRESS[this.state.caipNetwork?.chainNamespace || 'eip155']

    return `${this.state.caipNetwork?.id || 'eip155:1'}:${address}`
  }
}
