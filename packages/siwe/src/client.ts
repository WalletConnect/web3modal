import { SIWEController, type SIWEControllerClient } from '../core/controller/SIWEController.js'
import type {
  SIWEClientMethods,
  SIWEConfig,
  SIWECreateMessageArgs,
  SIWEMessageArgs,
  SIWESession,
  SIWEVerifyMessageArgs
} from '../core/utils/TypeUtils.js'

import { type CaipAddress } from '@reown/appkit-common'
import {
  ChainController,
  ConnectionController,
  CoreHelperUtil,
  ModalController,
  RouterController,
  StorageUtil
} from '@reown/appkit-core'
import { ConstantsUtil } from '../core/utils/ConstantsUtil.js'

// -- Client -------------------------------------------------------------------- //
export class AppKitSIWEClient {
  public options: SIWEControllerClient['options']

  public methods: SIWEClientMethods

  public constructor(siweConfig: SIWEConfig) {
    const {
      enabled = true,
      nonceRefetchIntervalMs = ConstantsUtil.FIVE_MINUTES_IN_MS,
      sessionRefetchIntervalMs = ConstantsUtil.FIVE_MINUTES_IN_MS,
      signOutOnAccountChange = true,
      signOutOnDisconnect = true,
      signOutOnNetworkChange = true,
      ...siweConfigMethods
    } = siweConfig

    this.options = {
      // Default options
      enabled,
      nonceRefetchIntervalMs,
      sessionRefetchIntervalMs,
      signOutOnDisconnect,
      signOutOnAccountChange,
      signOutOnNetworkChange
    }

    this.methods = siweConfigMethods
  }

  async getNonce(address?: string) {
    const nonce = await this.methods.getNonce(address)
    if (!nonce) {
      throw new Error('siweControllerClient:getNonce - nonce is undefined')
    }

    return nonce
  }

  async getMessageParams?() {
    return ((await this.methods.getMessageParams?.()) || {}) as SIWEMessageArgs
  }

  createMessage(args: SIWECreateMessageArgs) {
    const message = this.methods.createMessage(args)

    if (!message) {
      throw new Error('siweControllerClient:createMessage - message is undefined')
    }

    return message
  }

  async verifyMessage(args: SIWEVerifyMessageArgs) {
    const isValid = await this.methods.verifyMessage(args)

    return isValid
  }

  async getSession() {
    const session = await this.methods.getSession()

    return session
  }

  async signIn(): Promise<SIWESession> {
    if (!SIWEController.state._client) {
      throw new Error('SIWE client needs to be initialized before calling signIn')
    }

    const caipAddress = ChainController.state.activeCaipAddress
    const address = caipAddress ? CoreHelperUtil.getPlainAddress(caipAddress) : ''

    const nonce = await SIWEController.getNonce()

    if (!address) {
      throw new Error('An address is required to create a SIWE message.')
    }

    const caipNetwork = ChainController.state.activeCaipNetwork

    if (!caipNetwork?.id) {
      throw new Error('A chainId is required to create a SIWE message.')
    }

    const chainId = caipNetwork.id

    if (!chainId) {
      throw new Error('A chainId is required to create a SIWE message.')
    }

    const signOutOnNetworkChange = SIWEController.state._client?.options.signOutOnNetworkChange
    // Sign out if signOutOnNetworkChange is enabled to avoid re-prompting the user for a signature
    if (signOutOnNetworkChange) {
      SIWEController.state._client.options.signOutOnNetworkChange = false
    }

    // Enable the signOutOnNetworkChange option if it was previously enabled
    if (signOutOnNetworkChange) {
      SIWEController.state._client.options.signOutOnNetworkChange = true
    }

    const messageParams = await this.getMessageParams?.()
    const message = this.methods.createMessage({
      address: caipAddress as CaipAddress,
      chainId: Number(chainId),
      nonce,
      version: '1',
      iat: messageParams?.iat || new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ...messageParams!
    })

    const type = StorageUtil.getConnectedConnector()

    if (type === 'AUTH') {
      RouterController.pushTransactionStack({
        view: null,
        goBack: false,
        replace: true,
        onSuccess() {
          ModalController.close()
        }
      })
    }
    const clientId = ConnectionController.state.wcClientId
    const signature = await ConnectionController.signMessage(message)
    const isValid = await this.methods.verifyMessage({ message, signature, clientId })
    if (!isValid) {
      throw new Error('Error verifying SIWE signature')
    }

    const session = await this.methods.getSession()

    if (!session) {
      throw new Error('Error verifying SIWE signature')
    }

    if (this.methods.onSignIn) {
      await this.methods.onSignIn(session)
    }

    return session
  }

  async signOut() {
    this.methods.onSignOut?.()

    return this.methods.signOut()
  }

  async onSignIn(session?: SIWESession) {
    await this.methods.onSignIn?.(session)
  }
}
