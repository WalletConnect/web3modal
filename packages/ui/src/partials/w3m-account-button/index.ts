import { ClientCtrl } from '@web3modal/core'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { global } from '../../utils/Theme'
import { truncate } from '../../utils/UiHelpers'
import { zorbSVG } from '../../utils/Zorb'
import styles from './styles.css'

@customElement('w3m-account-button')
export class W3mAccountButton extends LitElement {
  public static styles = [global, styles]

  // -- state & properties ------------------------------------------- //
  @property() public balance?: 'hide' | 'show' = 'hide'

  // -- render ------------------------------------------------------- //
  protected render() {
    const { address } = ClientCtrl.client().getAccount()

    return html`
      <button @click=${ClientCtrl.client().disconnect}>
        ${address ? zorbSVG(address, 24) : null}
        <w3m-text variant="medium-normal" color="inverse">${truncate(address ?? '')}</w3m-text>
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-account-button': W3mAccountButton
  }
}
