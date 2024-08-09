import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import { proxy, ref, subscribe as sub } from 'valtio/vanilla'
import type {
  SIWSClientMethods,
  SIWSSession,
  SIWSCreateMessageArgs,
  SIWSVerifyMessageArgs,
  ExtendedBaseWalletAdapter
} from '../utils/TypeUtils.js'
import { OptionsController } from '@web3modal/core'

// -- Types --------------------------------------------- //
export interface SIWSControllerClient extends SIWSClientMethods {
  signIn: (adapter?: ExtendedBaseWalletAdapter) => Promise<SIWSSession>
  options: {
    enabled: boolean
    nonceRefetchIntervalMs: number
    sessionRefetchIntervalMs: number
    signOutOnDisconnect: boolean
    signOutOnAccountChange: boolean
    signOutOnNetworkChange: boolean
  }
}

export interface SIWSControllerClientState {
  _client?: SIWSControllerClient
  nonce?: string
  session?: SIWSSession
  message?: string
  status: 'uninitialized' | 'ready' | 'loading' | 'success' | 'rejected' | 'error'
}

type StateKey = keyof SIWSControllerClientState

// -- State --------------------------------------------- //
const state = proxy<SIWSControllerClientState>({
  status: 'uninitialized'
})

// -- Controller ---------------------------------------- //
export const SIWSController = {
  state,

  subscribeKey<K extends StateKey>(
    key: K,
    callback: (value: SIWSControllerClientState[K]) => void
  ) {
    return subKey(state, key, callback)
  },

  subscribe(callback: (newState: SIWSControllerClientState) => void) {
    return sub(state, () => callback(state))
  },

  _getClient() {
    if (!state._client) {
      throw new Error('SIWSController client not set')
    }

    return state._client
  },

  async getNonce(address?: string) {
    const client = this._getClient()
    const nonce = await client.getNonce(address)
    this.setNonce(nonce)

    return nonce
  },

  async getSession() {
    try {
      const client = this._getClient()
      const session = await client.getSession()
      if (session) {
        this.setSession(session)
        this.setStatus('success')
      }

      return session
    } catch {
      return undefined
    }
  },

  createMessage(args: SIWSCreateMessageArgs) {
    const client = this._getClient()

    const message = client.createMessage(args)
    this.setMessage(message)

    return message
  },

  async verifyMessage(args: SIWSVerifyMessageArgs) {
    const client = this._getClient()
    const isValid = await client.verifyMessage(args)

    return isValid
  },

  async signIn(adapter?: ExtendedBaseWalletAdapter) {
    const client = this._getClient()
    const session = await client.signIn(adapter)

    return session
  },

  async signOut() {
    const client = this._getClient()
    await client.signOut()
    this.setStatus('ready')
    this.setSession(undefined)
    client.onSignOut?.()
  },

  onSignIn(args: SIWSSession) {
    const client = this._getClient()
    client.onSignIn?.(args)
  },

  onSignOut() {
    const client = this._getClient()
    client.onSignOut?.()
  },

  setSIWSClient(client: SIWSControllerClient) {
    state._client = ref(client)
    state.status = 'ready'
    OptionsController.setIsSiwsEnabled(client.options.enabled)
  },

  setNonce(nonce: SIWSControllerClientState['nonce']) {
    state.nonce = nonce
  },

  setStatus(status: SIWSControllerClientState['status']) {
    state.status = status
  },

  setMessage(message: SIWSControllerClientState['message']) {
    state.message = message
  },

  setSession(session: SIWSControllerClientState['session']) {
    state.session = session
    state.status = session ? 'success' : 'ready'
  }
}
