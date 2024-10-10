import type { SIWEStatus } from '@reown/appkit-common'
import { ChainController, OptionsController } from '@reown/appkit-core'
import { proxy, ref, subscribe as sub } from 'valtio/vanilla'
import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import type {
  SIWEClientMethods,
  SIWECreateMessageArgs,
  SIWESession,
  SIWEVerifyMessageArgs
} from '../utils/TypeUtils.js'

// -- Types --------------------------------------------- //
export interface SIWEControllerClient extends SIWEClientMethods {
  signIn: () => Promise<SIWESession>
  options: {
    enabled: boolean
    nonceRefetchIntervalMs: number
    sessionRefetchIntervalMs: number
    signOutOnDisconnect: boolean
    signOutOnAccountChange: boolean
    signOutOnNetworkChange: boolean
  }
}

export interface SIWEControllerClientState {
  _client?: SIWEControllerClient
  nonce?: string
  session?: SIWESession
  message?: string
  status: SIWEStatus
}

type StateKey = keyof SIWEControllerClientState

// -- State --------------------------------------------- //
const state = proxy<SIWEControllerClientState>({
  status: 'uninitialized'
})

// -- Controller ---------------------------------------- //
export const SIWEController = {
  state,

  subscribeKey<K extends StateKey>(
    key: K,
    callback: (value: SIWEControllerClientState[K]) => void
  ) {
    return subKey(state, key, callback)
  },

  subscribe(callback: (newState: SIWEControllerClientState) => void) {
    return sub(state, () => callback(state))
  },

  _getClient() {
    if (!state._client) {
      throw new Error('SIWEController client not set')
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
      if (session?.address && session?.chainId) {
        this.setSession(session)
      } else {
        this.setSession(undefined)
      }

      return session || undefined
    } catch {
      return undefined
    }
  },

  createMessage(args: SIWECreateMessageArgs) {
    const client = this._getClient()
    const message = client.createMessage(args)
    this.setMessage(message)

    return message
  },

  async verifyMessage(args: SIWEVerifyMessageArgs) {
    const client = this._getClient()
    const isValid = await client.verifyMessage(args)

    return isValid
  },

  async getMessageParams() {
    const client = this._getClient()
    const messageParams = await client.getMessageParams?.()

    return messageParams
  },

  async signIn() {
    const client = this._getClient()
    const session = await client.signIn()
    this.setSession(session)

    return session
  },

  async signOut() {
    const client = this._getClient()
    await client.signOut()
    this.setStatus('ready')
    this.setSession(undefined)
    this.setNonce(undefined)
  },

  async onSignIn(args: SIWESession) {
    const client = this._getClient()
    await client.onSignIn?.(args)
  },

  onSignOut() {
    const client = this._getClient()
    client.onSignOut?.()
  },

  async setSIWEClient(client: SIWEControllerClient) {
    state._client = ref(client)
    state.session = await this.getSession()
    state.status = state.session ? 'success' : 'ready'
    ChainController.setAccountProp('siweStatus', state.status, 'eip155')
    OptionsController.setIsSiweEnabled(client.options.enabled)
  },

  setNonce(nonce: SIWEControllerClientState['nonce']) {
    state.nonce = nonce
  },

  setStatus(status: SIWEControllerClientState['status']) {
    state.status = status
    ChainController.setAccountProp('siweStatus', state.status, 'eip155')
  },

  setMessage(message: SIWEControllerClientState['message']) {
    state.message = message
  },

  setSession(session: SIWEControllerClientState['session']) {
    state.session = session
    this.setStatus(session?.address && session?.chainId ? 'success' : 'ready')
    ChainController.setAccountProp('siweStatus', state.status, 'eip155')
  },

  setIsOneClickAuthenticating(isOneClickAuthenticating: boolean) {
    ChainController.setAccountProp('isOneClickAuthenticating', isOneClickAuthenticating, 'eip155')
  }
}
