import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import {
  RouterController,
  SnackController,
  ConnectorController,
  CoreHelperUtil
} from '@web3modal/core'
import { state } from 'lit/decorators.js'
import styles from './styles.js'
import { W3mFrameHelpers } from '@web3modal/wallet'

// -- Types --------------------------------------------- //
export type OnOtpSubmitFn = (otp: string) => Promise<void>
export type OnOtpResendFn = (email: string) => Promise<void>
export type OnStartOverFn = () => void

// -- Helpers ------------------------------------------- //
const OTP_LENGTH = 6

@customElement('w3m-email-otp-widget')
export class W3mEmailOtpWidget extends LitElement {
  public static override styles = styles

  // -- State & Properties -------------------------------- //
  @state() private loading = false

  @state() private timeoutTimeLeft = W3mFrameHelpers.getTimeToNextEmailLogin()

  @state() private error = ''

  private otp = ''

  private OTPTimeout: NodeJS.Timeout | undefined

  public email = RouterController.state.data?.email

  public onOtpSubmit: OnOtpSubmitFn | undefined

  public onOtpResend: OnOtpResendFn | undefined

  public onStartOver: OnStartOverFn | undefined

  public authConnector = ConnectorController.getAuthConnector()

  public override firstUpdated() {
    this.startOTPTimeout()
  }

  public override disconnectedCallback() {
    clearTimeout(this.OTPTimeout)
  }

  public constructor() {
    super()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.email) {
      throw new Error('w3m-email-otp-widget: No email provided')
    }
    const isResendDisabled = Boolean(this.timeoutTimeLeft)
    const footerLabels = this.getFooterLabels(isResendDisabled)

    return html`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${['l', '0', 'l', '0'] as const}
        gap="l"
      >
        <wui-flex flexDirection="column" alignItems="center">
          <wui-text variant="paragraph-400" color="fg-100">Enter the code we sent to</wui-text>
          <wui-text variant="paragraph-500" color="fg-100">${this.email}</wui-text>
        </wui-flex>

        <wui-text variant="small-400" color="fg-200">The code expires in 10 minutes</wui-text>

        ${this.loading
          ? html`<wui-loading-spinner size="xl" color="accent-100"></wui-loading-spinner>`
          : html` <wui-flex flexDirection="column" alignItems="center" gap="xs">
              <wui-otp
                dissabled
                length="6"
                @inputChange=${this.onOtpInputChange.bind(this)}
                .otp=${this.otp}
              ></wui-otp>
              ${this.error
                ? html`
                    <wui-text variant="small-400" color="error-100">
                      ${this.error}. Try Again
                    </wui-text>
                  `
                : null}
            </wui-flex>`}

        <wui-flex alignItems="center">
          <wui-text variant="small-400" color="fg-200">${footerLabels.title}</wui-text>
          <wui-link @click=${this.onResendCode.bind(this)} .disabled=${isResendDisabled}>
            ${footerLabels.action}
          </wui-link>
        </wui-flex>
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private startOTPTimeout() {
    this.timeoutTimeLeft = W3mFrameHelpers.getTimeToNextEmailLogin()
    this.OTPTimeout = setInterval(() => {
      if (this.timeoutTimeLeft > 0) {
        this.timeoutTimeLeft = W3mFrameHelpers.getTimeToNextEmailLogin()
      } else {
        clearInterval(this.OTPTimeout)
      }
    }, 1000)
  }

  private async onOtpInputChange(event: CustomEvent<string>) {
    try {
      if (!this.loading) {
        this.otp = event.detail
        if (this.authConnector && this.otp.length === OTP_LENGTH) {
          this.loading = true
          await this.onOtpSubmit?.(this.otp)
        }
      }
    } catch (error) {
      this.error = CoreHelperUtil.parseError(error)
      this.loading = false
    }
  }

  private async onResendCode() {
    try {
      if (this.onOtpResend) {
        if (!this.loading && !this.timeoutTimeLeft) {
          this.error = ''
          this.otp = ''
          const authConnector = ConnectorController.getAuthConnector()
          if (!authConnector || !this.email) {
            throw new Error('w3m-email-otp-widget: Unable to resend email')
          }
          this.loading = true
          await this.onOtpResend(this.email)
          this.startOTPTimeout()
          SnackController.showSuccess('Code email resent')
        }
      } else if (this.onStartOver) {
        this.onStartOver()
      }
    } catch (error) {
      SnackController.showError(error)
    } finally {
      this.loading = false
    }
  }

  private getFooterLabels(isResendDisabled: boolean) {
    if (this.onStartOver) {
      return {
        title: 'Something wrong?',
        action: `Try again ${isResendDisabled ? `in ${this.timeoutTimeLeft}s` : ''}`
      }
    }

    return {
      title: `Didn't receive it?`,
      action: `Resend ${isResendDisabled ? `in ${this.timeoutTimeLeft}s` : 'Code'}`
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-email-otp-widget': W3mEmailOtpWidget
  }
}
