import {
  AccountController,
  ConnectionController,
  EventsController,
  ModalController,
  NetworkController,
  OptionsController,
  RouterController,
  SnackController
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { SIWSController } from '../../../core/controller/SIWSController.js'
import { W3mFrameRpcConstants } from '@web3modal/wallet'

@customElement('w3m-connecting-siws-view')
export class W3mConnectingSiwsView extends LitElement {
  // -- Members ------------------------------------------- //
  private readonly dappName = OptionsController.state.metadata?.name

  @state() private isSigning = false

  // -- Render -------------------------------------------- //
  public override render() {
    this.onRender()

    return html`
      <wui-flex justifyContent="center" .padding=${['2xl', '0', 'xxl', '0'] as const}>
        <w3m-connecting-siws></w3m-connecting-siws>
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
          @click=${this.onCancel.bind(this)}
          data-testid="w3m-connecting-siws-cancel"
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
          data-testid="w3m-connecting-siws-sign"
        >
          ${this.isSigning ? 'Signing...' : 'Sign'}
        </wui-button>
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //

  private onRender() {
    if (SIWSController.state.session) {
      ModalController.close()
    }
  }

  private async onSign() {
    this.isSigning = true
    EventsController.sendEvent({
      event: 'CLICK_SIGN_SIWS_MESSAGE',
      type: 'track',
      properties: {
        network: NetworkController.state.caipNetwork?.id || '',
        isSmartAccount:
          AccountController.state.preferredAccountType ===
          W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
      }
    })
    try {
      SIWSController.setStatus('loading')
      const session = await SIWSController.signIn()
      SIWSController.setStatus('success')
      EventsController.sendEvent({
        event: 'SIWS_AUTH_SUCCESS',
        type: 'track',
        properties: {
          network: NetworkController.state.caipNetwork?.id || '',
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
        SnackController.showError('Signature declined')
      }
      SIWSController.setStatus('error')

      return EventsController.sendEvent({
        event: 'SIWS_AUTH_ERROR',
        type: 'track',
        properties: {
          network: NetworkController.state.caipNetwork?.id || '',
          isSmartAccount
        }
      })
    } finally {
      this.isSigning = false
    }
  }

  private async onCancel() {
    const isConnected = AccountController.state.isConnected
    if (isConnected) {
      await ConnectionController.disconnect()
      ModalController.close()
    } else {
      RouterController.push('Connect')
    }
    EventsController.sendEvent({
      event: 'CLICK_CANCEL_SIWS',
      type: 'track',
      properties: {
        network: NetworkController.state.caipNetwork?.id || '',
        isSmartAccount:
          AccountController.state.preferredAccountType ===
          W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
      }
    })
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'w3m-connecting-siws-view': W3mConnectingSiwsView
  }
}
