import { ModalCtrl } from '@web3modal/core'
import { html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { WALLET_CONNECT_ICON } from '../../utils/Svgs'
import { global } from '../../utils/Theme'
import styles from './styles.css'

@customElement('w3m-connect-button')
export class W3mConnectButton extends LitElement {
  public static styles = [global, styles]

  // -- state & properties ------------------------------------------- //
  @state() public loading = false
  @property() public label? = 'Connect Wallet'
  @property() public icon? = true

  // -- lifecycle ---------------------------------------------------- //
  public constructor() {
    super()
    this.modalUnsub = ModalCtrl.subscribe(modalState => {
      if (modalState.open) {
        this.loading = true
      }
      if (!modalState.open) {
        this.loading = false
      }
    })
  }

  public disconnectedCallback() {
    this.modalUnsub?.()
  }

  // -- private ------------------------------------------------------ //
  private readonly modalUnsub?: () => void = undefined

  private iconTemplate() {
    return this.icon ? WALLET_CONNECT_ICON : null
  }

  private onOpen() {
    try {
      this.loading = true
      ModalCtrl.open()
    } catch {
      this.loading = false
    }
  }

  // -- render ------------------------------------------------------- //
  protected render() {
    const classes = {
      'w3m-button-loading': this.loading
    }

    return html`
      <button class=${classMap(classes)} .disabled=${this.loading} @click=${this.onOpen}>
        ${this.loading
          ? html`
              <w3m-spinner></w3m-spinner>
              <w3m-text variant="medium-normal" color="accent">Connecting...</w3m-text>
            `
          : html`
              ${this.iconTemplate()}
              <w3m-text variant="medium-normal" color="inverse">${this.label}</w3m-text>
            `}
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connect-button': W3mConnectButton
  }
}
