import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import { proxy, ref } from 'valtio/vanilla'
import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'
import { StorageUtil } from '../utils/StorageUtil.js'
import type {
  Connector,
  EstimateGasTransactionArgs,
  SendTransactionArgs,
  WcWallet,
  WriteContractArgs
} from '../utils/TypeUtil.js'
import { TransactionsController } from './TransactionsController.js'
import { ChainController } from './ChainController.js'
import { type W3mFrameTypes } from '@web3modal/wallet'
import { ModalController } from './ModalController.js'
import { ConnectorController } from './ConnectorController.js'
import { EventsController } from './EventsController.js'
import type { Chain } from '@web3modal/common'
import { NetworkController } from './NetworkController.js'

// -- Types --------------------------------------------- //
export interface ConnectExternalOptions {
  id: Connector['id']
  type: Connector['type']
  provider?: Connector['provider']
  info?: Connector['info']
}

export interface ConnectionControllerClient {
  connectWalletConnect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendTransaction: (args: SendTransactionArgs) => Promise<`0x${string}` | null>
  estimateGas: (args: EstimateGasTransactionArgs) => Promise<bigint>
  parseUnits: (value: string, decimals: number) => bigint
  formatUnits: (value: bigint, decimals: number) => string
  connectExternal?: (options: ConnectExternalOptions) => Promise<void>
  reconnectExternal?: (options: ConnectExternalOptions) => Promise<void>
  checkInstalled?: (ids?: string[]) => boolean
  writeContract: (args: WriteContractArgs) => Promise<`0x${string}` | null>
  getEnsAddress: (value: string) => Promise<false | string>
  getEnsAvatar: (value: string) => Promise<false | string>
}

export interface ConnectionControllerState {
  _client?: ConnectionControllerClient
  wcUri?: string
  wcPairingExpiry?: number
  wcLinking?: {
    href: string
    name: string
  }
  wcError?: boolean
  recentWallet?: WcWallet
  buffering: boolean
}

type StateKey = keyof ConnectionControllerState

// -- State --------------------------------------------- //
const state = proxy<ConnectionControllerState>({
  wcError: false,
  buffering: false
})

// -- Controller ---------------------------------------- //
export const ConnectionController = {
  state,

  subscribeKey<K extends StateKey>(
    key: K,
    callback: (value: ConnectionControllerState[K]) => void
  ) {
    return subKey(state, key, callback)
  },

  _getClient() {
    return ChainController.getConnectionControllerClient()
  },

  setClient(client: ConnectionControllerClient) {
    state._client = ref(client)
  },

  async connectWalletConnect() {
    StorageUtil.setConnectedConnector('WALLET_CONNECT')
    await this._getClient().connectWalletConnect()
  },

  setQRCodeURI(uri: string) {
    state.wcUri = uri
    state.wcPairingExpiry = CoreHelperUtil.getPairingExpiry()
  },

  async connectExternal(options: ConnectExternalOptions, chain?: Chain) {
    await this._getClient().connectExternal?.(options)
    ChainController.setActiveChain(chain)
    StorageUtil.setConnectedConnector(options.type)
  },

  async reconnectExternal(options: ConnectExternalOptions) {
    await this._getClient().reconnectExternal?.(options)
    StorageUtil.setConnectedConnector(options.type)
  },

  async setPreferredAccountType(accountType: W3mFrameTypes.AccountType) {
    ModalController.setLoading(true)
    const authConnector = ConnectorController.getAuthConnector()
    if (!authConnector) {
      return
    }
    await authConnector?.provider.setPreferredAccount(accountType)
    await this.reconnectExternal(authConnector)
    ModalController.setLoading(false)
    EventsController.sendEvent({
      type: 'track',
      event: 'SET_PREFERRED_ACCOUNT_TYPE',
      properties: { accountType, network: NetworkController.state.caipNetwork?.id || '' }
    })
  },

  async signMessage(message: string) {
    return this._getClient().signMessage(message)
  },

  parseUnits(value: string, decimals: number) {
    return this._getClient().parseUnits(value, decimals)
  },

  formatUnits(value: bigint, decimals: number) {
    return this._getClient().formatUnits(value, decimals)
  },

  async sendTransaction(args: SendTransactionArgs) {
    return this._getClient().sendTransaction(args)
  },

  async estimateGas(args: EstimateGasTransactionArgs) {
    return this._getClient().estimateGas(args)
  },

  async writeContract(args: WriteContractArgs) {
    return this._getClient().writeContract(args)
  },

  async getEnsAddress(value: string) {
    return this._getClient().getEnsAddress(value)
  },

  async getEnsAvatar(value: string) {
    return this._getClient().getEnsAvatar(value)
  },

  checkInstalled(ids?: string[]) {
    return this._getClient().checkInstalled?.(ids)
  },

  resetWcConnection() {
    state.wcUri = undefined
    state.wcPairingExpiry = undefined
    state.wcLinking = undefined
    state.recentWallet = undefined
    TransactionsController.resetTransactions()
    StorageUtil.deleteWalletConnectDeepLink()
  },

  setWcLinking(wcLinking: ConnectionControllerState['wcLinking']) {
    state.wcLinking = wcLinking
  },

  setWcError(wcError: ConnectionControllerState['wcError']) {
    state.wcError = wcError
    state.buffering = false
  },

  setRecentWallet(wallet: ConnectionControllerState['recentWallet']) {
    state.recentWallet = wallet
  },

  setBuffering(buffering: ConnectionControllerState['buffering']) {
    state.buffering = buffering
  },

  async disconnect() {
    const client = this._getClient()

    try {
      await client.disconnect()
      StorageUtil.removeConnectedWalletImageUrl()
      this.resetWcConnection()
    } catch (error) {
      throw new Error('Failed to disconnect')
    }
  }
}
