import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'
import {
  RouterController,
  ConnectorController,
  SnackController,
  EventsController
} from '@web3modal/core'
import { state } from 'lit/decorators.js'

@customElement('w3m-email-verify-device-view')
export class W3mEmailVerifyDeviceView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  protected readonly email = RouterController.state.data?.email

  protected readonly authConnector = ConnectorController.getAuthConnector()

  public constructor() {
    super()
    this.listenForDeviceApproval()
  }

  // -- State & Properties -------------------------------- //
  @state() private loading = false

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.email) {
      throw new Error('w3m-email-verify-device-view: No email provided')
    }
    if (!this.authConnector) {
      throw new Error('w3m-email-verify-device-view: No email connector provided')
    }

    return html`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${['xxl', 's', 'xxl', 's'] as const}
        gap="l"
      >
        <wui-icon-box
          size="xl"
          iconcolor="accent-100"
          backgroundcolor="accent-100"
          icon="verify"
          background="opaque"
        ></wui-icon-box>

        <wui-flex flexDirection="column" alignItems="center" gap="s">
          <wui-flex flexDirection="column" alignItems="center">
            <wui-text variant="paragraph-400" color="fg-100">
              Approve the login link we sent to
            </wui-text>
            <wui-text variant="paragraph-400" color="fg-100"><b>${this.email}</b></wui-text>
          </wui-flex>

          <wui-text variant="small-400" color="fg-200" align="center">
            The code expires in 20 minutes
          </wui-text>

          <wui-flex alignItems="center" id="w3m-resend-section">
            <wui-text variant="small-400" color="fg-100" align="center">
              Didn't receive it?
            </wui-text>
            <wui-link @click=${this.onResendCode.bind(this)} .disabled=${this.loading}>
              Resend email
            </wui-link>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private async listenForDeviceApproval() {
    if (this.authConnector) {
      try {
        await this.authConnector.provider.connectDevice()
        EventsController.sendEvent({ type: 'track', event: 'DEVICE_REGISTERED_FOR_EMAIL' })
        EventsController.sendEvent({ type: 'track', event: 'EMAIL_VERIFICATION_CODE_SENT' })
        RouterController.replace('EmailVerifyOtp', { email: this.email })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        RouterController.goBack()
      }
    }
  }

  private async onResendCode() {
    try {
      if (!this.loading) {
        if (!this.authConnector || !this.email) {
          throw new Error('w3m-email-login-widget: Unable to resend email')
        }
        this.loading = true
        await this.authConnector.provider.connectEmail({ email: this.email })
        SnackController.showSuccess('Code email resent')
      }
    } catch (error) {
      SnackController.showError(error)
    } finally {
      this.loading = false
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-email-verify-device-view': W3mEmailVerifyDeviceView
  }
}
