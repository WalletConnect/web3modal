import type {
  SIWECreateMessageArgs,
  SIWEVerifyMessageArgs,
  SIWEConfig,
  SIWEClientMethods
} from '../core/utils/TypeUtils.js'
import type { SIWEControllerClient } from '../core/controller/SIWEController.js'

import {
  AccountController,
  NetworkController,
  ConnectionController,
  RouterUtil
} from '@web3modal/core'

import { ConstantsUtil } from '../core/utils/ConstantsUtil.js'
import { HelpersUtil } from '@web3modal/scaffold-utils'

// -- Client -------------------------------------------------------------------- //
export class Web3ModalSIWEClient {
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
    if (!session) {
      throw new Error('siweControllerClient:getSession - session is undefined')
    }

    return session
  }

  async signIn() {
    const { address } = AccountController.state
    const nonce = await this.methods.getNonce(address)
    if (!address) {
      throw new Error('An address is required to create a SIWE message.')
    }
    const chainId = HelpersUtil.caipNetworkIdToNumber(NetworkController.state.caipNetwork?.id)
    if (!chainId) {
      throw new Error('A chainId is required to create a SIWE message.')
    }
    const message = this.methods.createMessage({ address, nonce, chainId })
    const signature = await ConnectionController.signMessage(message)
    const isValid = await this.methods.verifyMessage({ message, signature })
    if (!isValid) {
      throw new Error('Error verifying SIWE signature')
    }

    const session = await this.methods.getSession()
    if (!session) {
      throw new Error('Error verifying SIWE signature')
    }
    if (this.methods.onSignIn) {
      this.methods.onSignIn(session)
    }

    RouterUtil.navigateAfterNetworkSwitch()

    return session
  }

  async signOut() {
    this.methods.onSignOut?.()
    return this.methods.signOut()
  }
}
