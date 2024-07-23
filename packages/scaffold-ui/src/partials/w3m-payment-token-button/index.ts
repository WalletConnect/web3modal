import { ModalController, PaymasterController } from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, css, html } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

@customElement('w3m-payment-token-button')
export class W3mPaymentTokenButton extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
    }
  `

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @property() public symbol = ''

  @property() public logoUrl: string | undefined = undefined

  @property({ attribute: false }) public availableTokens: string[] = []

  public constructor() {
    super()
    PaymasterController.setAvailableTokens(this.availableTokens)
    this.unsubscribe.push(
      PaymasterController.subscribeKey('selectedToken', () => this.dispatchTokenChange())
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  async handleClick() {
    await PaymasterController.getMyTokensWithBalance()
    ModalController.open({ view: 'PaymasterSelectToken' })
  }

  private dispatchTokenChange() {
    const event = new CustomEvent('tokenchange', {
      detail: { token: PaymasterController.state.selectedToken },
      bubbles: true
    })
    this.dispatchEvent(event)
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-chip-button
        @click=${this.handleClick.bind(this)}
        .text=${this.symbol || 'Select Token'}
        icon="chevronRight"
        variant="gray"
        imageSrc=${ifDefined(this.logoUrl)}
      ></wui-chip-button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-payment-token-button': W3mPaymentTokenButton
  }
}
