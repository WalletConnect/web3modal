import { ClientCtrl, CoreUtil, ModalCtrl, OptionsCtrl, ToastCtrl } from '@web3modal/core'
import { LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ThemeUtil } from '../../utils/ThemeUtil'
import { UiUtil } from '../../utils/UiUtil'
import styles from './styles.css'

@customElement('w3m-walletconnect-qr')
export class W3mWalletConnectQr extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  // -- state & properties ------------------------------------------- //
  @property() public walletId? = ''
  @property() public imageId? = ''
  @state() private uri = ''

  // -- lifecycle ---------------------------------------------------- //
  public constructor() {
    super()
    this.createConnectionAndWait()
  }

  // -- private ------------------------------------------------------ //
  private get overlayEl(): HTMLDivElement {
    return UiUtil.getShadowRootElement(this, '.w3m-qr-container') as HTMLDivElement
  }

  private async createConnectionAndWait(retry = 0) {
    CoreUtil.removeWalletConnectDeepLink()
    try {
      const { standaloneUri } = OptionsCtrl.state
      if (standaloneUri) {
        setTimeout(() => (this.uri = standaloneUri), 0)
      } else {
        await ClientCtrl.client().connectWalletConnect(uri => {
          setTimeout(() => (this.uri = uri), 0)
        }, OptionsCtrl.state.selectedChain?.id)
        ModalCtrl.close()
      }
    } catch (err) {
      console.error(err)
      ToastCtrl.openToast('Connection request declined', 'error')
      if (retry < 2) {
        this.createConnectionAndWait(retry + 1)
      }
    }
  }

  // -- render ------------------------------------------------------- //
  protected render() {
    return html`
      <div class="w3m-qr-container">
        ${this.uri
          ? html`<w3m-qrcode
              size="${this.overlayEl.offsetWidth}"
              uri=${this.uri}
              walletId=${this.walletId}
              imageId=${this.imageId}
            ></w3m-qrcode>`
          : html`<w3m-spinner></w3m-spinner>`}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-walletconnect-qr': W3mWalletConnectQr
  }
}
