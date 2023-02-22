import { AccountCtrl, ConfigCtrl } from '@web3modal/core'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { UiUtil } from '../../utils/UiUtil'

@customElement('w3m-core-button')
export class W3mCoreButton extends LitElement {
  // -- state & properties ------------------------------------------- //
  @state() public isConnected = false
  @property() public label? = 'Connect Wallet'
  @property() public icon?: 'hide' | 'show' = 'show'
  @property() public balance?: 'hide' | 'show' = 'hide'

  // -- lifecycle ---------------------------------------------------- //
  public constructor() {
    super()
    UiUtil.rejectStandaloneButtonComponent()
    this.isConnected = AccountCtrl.state.isConnected
    this.unsubscribeAccount = AccountCtrl.subscribe(({ isConnected }) => {
      this.isConnected = isConnected
    })
  }

  public disconnectedCallback() {
    this.unsubscribeAccount?.()
  }

  // -- private ------------------------------------------------------ //
  private readonly unsubscribeAccount?: () => void = undefined

  // -- render ------------------------------------------------------- //
  protected render() {
    const { enableAccountView } = ConfigCtrl.state

    return this.isConnected && enableAccountView
      ? html`<w3m-account-button balance=${ifDefined(this.balance)}></w3m-account-button> `
      : html`
          <w3m-connect-button
            label=${this.isConnected ? 'Disconnect' : ifDefined(this.label)}
            icon=${ifDefined(this.icon)}
          >
          </w3m-connect-button>
        `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-core-button': W3mCoreButton
  }
}
