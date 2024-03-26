import { subscribeKey as subKey } from 'valtio/utils'
import { proxy, ref, subscribe as sub } from 'valtio/vanilla'
import type { CaipNetwork, CaipNetworkId } from '../utils/TypeUtil.js'
import { PublicStateController } from './PublicStateController.js'
import { EventsController } from './EventsController.js'
import { ModalController } from './ModalController.js'
import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'

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
  allowUnsupportedChain?: boolean
  smartAccountEnabledNetworks?: number[]
}

type StateKey = keyof NetworkControllerState

// -- State --------------------------------------------- //
const state = proxy<NetworkControllerState>({
  supportsAllNetworks: true,
  isDefaultCaipNetwork: false
})

// -- Controller ---------------------------------------- //
export const NetworkController = {
  state,

  subscribe(callback: (newState: NetworkControllerState) => void) {
    return sub(state, () => callback(state))
  },

  subscribeKey<K extends StateKey>(key: K, callback: (value: NetworkControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  _getClient() {
    if (!state._client) {
      throw new Error('NetworkController client not set')
    }

    return state._client
  },

  setClient(client: NetworkControllerClient) {
    state._client = ref(client)
  },

  setCaipNetwork(caipNetwork: NetworkControllerState['caipNetwork']) {
    state.caipNetwork = caipNetwork
    PublicStateController.set({ selectedNetworkId: caipNetwork?.id })
    if (!this.state.allowUnsupportedChain) {
      this.checkIfSupportedNetwork()
    }
  },

  setDefaultCaipNetwork(caipNetwork: NetworkControllerState['caipNetwork']) {
    state.caipNetwork = caipNetwork
    PublicStateController.set({ selectedNetworkId: caipNetwork?.id })
    state.isDefaultCaipNetwork = true
  },

  setRequestedCaipNetworks(requestedNetworks: NetworkControllerState['requestedCaipNetworks']) {
    state.requestedCaipNetworks = requestedNetworks
  },

  setAllowUnsupportedChain(allowUnsupportedChain: NetworkControllerState['allowUnsupportedChain']) {
    state.allowUnsupportedChain = allowUnsupportedChain
  },

  setSmartAccountEnabledNetworks(
    smartAccountEnabledNetworks: NetworkControllerState['smartAccountEnabledNetworks']
  ) {
    state.smartAccountEnabledNetworks = smartAccountEnabledNetworks
  },

  getRequestedCaipNetworks() {
    const { approvedCaipNetworkIds, requestedCaipNetworks } = state

    const approvedIds = approvedCaipNetworkIds
    const requestedNetworks = requestedCaipNetworks

    return CoreHelperUtil.sortRequestedNetworks(approvedIds, requestedNetworks)
  },

  async getApprovedCaipNetworksData() {
    const data = await this._getClient().getApprovedCaipNetworksData()
    state.supportsAllNetworks = data.supportsAllNetworks
    state.approvedCaipNetworkIds = data.approvedCaipNetworkIds
  },

  async switchActiveNetwork(network: NetworkControllerState['caipNetwork']) {
    await this._getClient().switchCaipNetwork(network)
    state.caipNetwork = network
    if (network) {
      EventsController.sendEvent({
        type: 'track',
        event: 'SWITCH_NETWORK',
        properties: { network: network.id }
      })
    }
  },

  checkIfSupportedNetwork() {
    state.isUnsupportedChain = !state.requestedCaipNetworks?.some(
      network => network.id === state.caipNetwork?.id
    )

    if (state.isUnsupportedChain) {
      this.showUnsupportedChainUI()
    }
  },

  checkIfSmartAccountEnabled() {
    const networkId = Number(state.caipNetwork?.id?.split(':')?.[1])

    return Boolean(state.smartAccountEnabledNetworks?.includes(networkId))
  },

  resetNetwork() {
    if (!state.isDefaultCaipNetwork) {
      state.caipNetwork = undefined
    }
    state.approvedCaipNetworkIds = undefined
    state.supportsAllNetworks = true
  },

  showUnsupportedChainUI() {
    setTimeout(() => {
      ModalController.open({ view: 'UnsupportedChain' })
    }, 300)
  }
}
