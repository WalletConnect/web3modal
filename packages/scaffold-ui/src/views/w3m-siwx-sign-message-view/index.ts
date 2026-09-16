import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

import {
  OptionsController,
  RouterController,
  SIWXUtil,
  SnackController
} from '@reown/appkit-controllers'
import { customElement } from '@reown/appkit-ui'
import '@reown/appkit-ui/wui-button'
import '@reown/appkit-ui/wui-flex'
import '@reown/appkit-ui/wui-text'

import '../../partials/w3m-siwx-sign-message-thumbnails/index.js'

@customElement('w3m-siwx-sign-message-view')
export class W3mSIWXSignMessageView extends LitElement {
  // -- Members ------------------------------------------- //
  private readonly dappName = OptionsController.state.metadata?.name

  @state() private isCancelling = false

  @state() private isSigning = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex justifyContent="center" .padding=${['8', '0', '6', '0'] as const}>
        <w3m-siwx-sign-message-thumbnails></w3m-siwx-sign-message-thumbnails>
      </wui-flex>
      <wui-flex .padding=${['0', '20', '5', '20'] as const} gap="3" justifyContent="space-between">
        <wui-text variant="lg-medium" align="center" color="primary"
          >${this.dappName ?? 'Dapp'} needs to confirm your wallet.</wui-text
        >
      </wui-flex>
      <wui-flex .padding=${['0', '10', '4', '10'] as const} gap="3" justifyContent="space-between">
        <wui-text variant="md-regular" align="center" color="secondary"
          >Sign this message to prove you own this wallet. Cancel to go back.</wui-text
        >
      </wui-flex>
      <wui-flex .padding=${['4', '5', '5', '5'] as const} gap="3" justifyContent="space-between">
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="neutral-secondary"
          ?loading=${this.isCancelling}
          @click=${this.onCancel.bind(this)}
          data-testid="w3m-connecting-siwe-cancel"
        >
          ${this.isCancelling ? 'Cancelling...' : 'Cancel'}
        </wui-button>
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="neutral-primary"
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
    try {
      await SIWXUtil.requestSignMessage()
    } catch (error) {
      if (error instanceof Error && error.message.includes('OTP is required')) {
        SnackController.showError({
          message: 'Something went wrong. We need to verify your account again.'
        })
        RouterController.replace('DataCapture')

        return
      }

      throw error
    } finally {
      this.isSigning = false
    }
  }

  private async onCancel() {
    this.isCancelling = true
    await SIWXUtil.cancelSignMessage().finally(() => (this.isCancelling = false))
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-siwx-sign-message-view': W3mSIWXSignMessageView
  }
}
