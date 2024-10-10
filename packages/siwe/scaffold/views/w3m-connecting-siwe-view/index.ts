import {
  AccountController,
  ChainController,
  ConnectionController,
  EventsController,
  ModalController,
  OptionsController,
  RouterController,
  SnackController
} from '@reown/appkit-core'
import { customElement } from '@reown/appkit-ui'
import { W3mFrameRpcConstants } from '@reown/appkit-wallet'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { SIWEController } from '../../../core/controller/SIWEController.js'

@customElement('w3m-connecting-siwe-view')
export class W3mConnectingSiweView extends LitElement {
  // -- Members ------------------------------------------- //
  private readonly dappName = OptionsController.state.metadata?.name

  @state() private isSigning = false

  @state() private isCancelling = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex justifyContent="center" .padding=${['2xl', '0', 'xxl', '0'] as const}>
        <w3m-connecting-siwe></w3m-connecting-siwe>
      </wui-flex>
      <wui-flex
        .padding=${['0', '4xl', 'l', '4xl'] as const}
        gap="s"
        justifyContent="space-between"
      >
        <wui-text variant="paragraph-500" align="center" color="fg-100"
          >${this.dappName ?? 'Dapp'} needs to connect to your wallet</wui-text
        >
      </wui-flex>
      <wui-flex
        .padding=${['0', '3xl', 'l', '3xl'] as const}
        gap="s"
        justifyContent="space-between"
      >
        <wui-text variant="small-400" align="center" color="fg-200"
          >Sign this message to prove you own this wallet and proceed. Canceling will disconnect
          you.</wui-text
        >
      </wui-flex>
      <wui-flex .padding=${['l', 'xl', 'xl', 'xl'] as const} gap="s" justifyContent="space-between">
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="neutral"
          ?loading=${this.isCancelling}
          @click=${this.onCancel.bind(this)}
          data-testid="w3m-connecting-siwe-cancel"
        >
          Cancel
        </wui-button>
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="main"
          @click=${this.onSign.bind(this)}
          ?loading=${this.isSigning}
          data-testid="w3m-connecting-siwe-sign"
        >
          ${this.isSigning ? 'Signing...' : 'Sign'}
        </wui-button>
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private async onSign() {
    this.isSigning = true
    EventsController.sendEvent({
      event: 'CLICK_SIGN_SIWE_MESSAGE',
      type: 'track',
      properties: {
        network: ChainController.state.activeCaipNetwork?.caipNetworkId || '',
        isSmartAccount:
          AccountController.state.preferredAccountType ===
          W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
      }
    })
    try {
      SIWEController.setStatus('loading')
      const session = await SIWEController.signIn()
      SIWEController.setStatus('success')
      EventsController.sendEvent({
        event: 'SIWE_AUTH_SUCCESS',
        type: 'track',
        properties: {
          network: ChainController.state.activeCaipNetwork?.caipNetworkId || '',
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
        }
      })

      return session
    } catch (error) {
      const preferredAccountType = AccountController.state.preferredAccountType
      const isSmartAccount =
        preferredAccountType === W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
      if (isSmartAccount) {
        SnackController.showError('This application might not support Smart Accounts')
      } else {
        SnackController.showError(error instanceof Error ? error.message : 'Signature declined')
      }
      SIWEController.setStatus('error')

      return EventsController.sendEvent({
        event: 'SIWE_AUTH_ERROR',
        type: 'track',
        properties: {
          network: ChainController.state.activeCaipNetwork?.caipNetworkId || '',
          isSmartAccount
        }
      })
    } finally {
      this.isSigning = false
    }
  }

  private async onCancel() {
    this.isCancelling = true
    const caipAddress = ChainController.state.activeCaipAddress
    if (caipAddress) {
      await ConnectionController.disconnect()
      ModalController.close()
    } else {
      RouterController.push('Connect')
    }
    this.isCancelling = false
    EventsController.sendEvent({
      event: 'CLICK_CANCEL_SIWE',
      type: 'track',
      properties: {
        network: ChainController.state.activeCaipNetwork?.caipNetworkId || '',
        isSmartAccount:
          AccountController.state.preferredAccountType ===
          W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
      }
    })
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'w3m-connecting-siwe-view': W3mConnectingSiweView
  }
}
