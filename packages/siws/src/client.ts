import base58 from 'bs58'
import type {
  SIWSCreateMessageArgs,
  SIWSVerifyMessageArgs,
  SIWSConfig,
  SIWSClientMethods,
  SIWSSession,
  SIWSMessageArgs,
  ExtendedBaseWalletAdapter
} from '../core/utils/TypeUtils.js'
import type { SIWSControllerClient } from '../core/controller/SIWSController.js'

import {
  RouterUtil,
  NetworkController,
  StorageUtil,
  RouterController,
  ConnectionController,
  AccountController
} from '@web3modal/core'
import { ConstantsUtil } from '../core/utils/ConstantsUtil.js'
import { formatChainId } from '../core/utils/formatChainId.js'

// -- Client -------------------------------------------------------------------- //
export class Web3ModalSIWSClient {
  public options: SIWSControllerClient['options']

  public methods: SIWSClientMethods

  public constructor(siwsConfig: SIWSConfig) {
    const {
      enabled = true,
      nonceRefetchIntervalMs = ConstantsUtil.FIVE_MINUTES_IN_MS,
      sessionRefetchIntervalMs = ConstantsUtil.FIVE_MINUTES_IN_MS,
      signOutOnAccountChange = true,
      signOutOnDisconnect = true,
      signOutOnNetworkChange = true,
      ...siwsConfigMethods
    } = siwsConfig

    this.options = {
      // Default options
      enabled,
      nonceRefetchIntervalMs,
      sessionRefetchIntervalMs,
      signOutOnDisconnect,
      signOutOnAccountChange,
      signOutOnNetworkChange
    }

    this.methods = siwsConfigMethods
  }

  async getNonce(address?: string) {
    const nonce = await this.methods.getNonce(address)
    if (!nonce) {
      throw new Error('siwsControllerClient:getNonce - nonce is undefined')
    }

    return nonce
  }

  async getMessageParams() {
    const params = await this.methods.getMessageParams()

    return params || {}
  }

  createMessage(args: SIWSCreateMessageArgs) {
    const message = this.methods.createMessage(args)

    if (!message) {
      throw new Error('siwsControllerClient:createMessage - message is undefined')
    }

    return message
  }

  async verifyMessage(args: SIWSVerifyMessageArgs) {
    const isValid = await this.methods.verifyMessage(args)

    return isValid
  }

  async getSession() {
    const session = await this.methods.getSession()
    if (!session) {
      throw new Error('siwsControllerClient:getSession - session is undefined')
    }

    return session
  }

  async signIn(adapter?: ExtendedBaseWalletAdapter): Promise<SIWSSession> {
    const signData = await this.signConnector(adapter)

    if (!signData) {
      throw new Error('A sign is required to create a SIWS.')
    }

    const { signature, message } = signData

    const type = StorageUtil.getConnectedConnector()
    if (type === 'AUTH') {
      RouterController.pushTransactionStack({
        view: null,
        goBack: false,
        replace: true,
        onCancel() {
          RouterController.replace('ConnectingSiws')
        }
      })
    }

    const isValid = await this.methods.verifyMessage({
      message,
      signature
    })

    if (!isValid) {
      throw new Error('Error verifying SIWS signature')
    }

    const session = await this.methods.getSession()
    if (!session) {
      throw new Error('Error verifying SIWS signature')
    }

    if (this.methods.onSignIn) {
      this.methods.onSignIn(session)
    }

    RouterUtil.navigateAfterNetworkSwitch()

    return session
  }

  private async signConnector(adapter?: ExtendedBaseWalletAdapter) {
    const rawChainId = NetworkController.state.caipNetwork?.name
    const chainId = formatChainId(rawChainId)
    const nonce = await this.methods.getNonce()
    const address = AccountController.state.address

    if (!chainId) {
      throw new Error('A chainId is required to create a SIWS message.')
    }

    if (!address && !adapter) {
      throw new Error('An address is required to create a SIWS message.')
    }

    // Create main message params
    const messageParams: SIWSMessageArgs = await this.getMessageParams()
    const dataMsg = {
      chainId,
      nonce,
      version: '1' as const,
      issuedAt: messageParams.iat || new Date().toISOString(),
      ...messageParams
    }

    // If wallet supports one click auth ( phantom wallet )
    if (adapter) {
      const { signature, account } = await adapter.signIn(dataMsg)
      const message = this.methods.createMessage({
        ...dataMsg,
        address: account.address
      })

      return { signature: base58.encode(signature), message }
    }

    // If wallet not supports one click auth and was only connect to wallet without sign message
    if (address && !adapter) {
      const message = this.methods.createMessage({ ...dataMsg, address })
      const signature = await ConnectionController.signMessage(message)

      return { signature, message }
    }

    return null
  }

  async signOut() {
    this.methods.onSignOut?.()

    return this.methods.signOut()
  }
}
