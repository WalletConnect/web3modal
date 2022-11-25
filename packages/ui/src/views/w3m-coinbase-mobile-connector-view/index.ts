import { ClientCtrl, CoreHelpers, ModalCtrl, OptionsCtrl, ToastCtrl } from '@web3modal/core'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { ARROW_DOWN_ICON, QRCODE_ICON } from '../../utils/Svgs'
import { global } from '../../utils/Theme'
import { getErrorMessage } from '../../utils/UiHelpers'
import styles from './styles.css'

const HORIZONTAL_PADDING = 36

@customElement('w3m-coinbase-mobile-connector-view')
export class W3mCoinbaseMobileConnectorView extends LitElement {
  public static styles = [global, styles]

  // -- state & properties ------------------------------------------- //
  @state() private uri = ''

  // -- lifecycle ---------------------------------------------------- //
  public constructor() {
    super()
    this.getConnectionUri()
  }

  // -- private ------------------------------------------------------ //
  private readonly coinbaseWalletUrl = 'https://www.coinbase.com/wallet'

  private async getConnectionUri() {
    try {
      await ClientCtrl.client().connectCoinbaseMobile(
        uri => (this.uri = uri),
        OptionsCtrl.state.selectedChainId
      )
      ModalCtrl.close()
    } catch (err) {
      ToastCtrl.openToast(getErrorMessage(err), 'error')
    }
  }

  private onInstall() {
    CoreHelpers.openHref(this.coinbaseWalletUrl, '_blank')
  }

  // -- render ------------------------------------------------------- //
  protected render() {
    const name = 'Coinbase Wallet'

    return html`
      <w3m-modal-header title=${name}></w3m-modal-header>
      <w3m-modal-content>
        <div class="w3m-qr-container">
          ${this.uri
            ? html`
                <w3m-qrcode
                  size=${this.offsetWidth - HORIZONTAL_PADDING}
                  uri=${this.uri}
                  walletId="coinbaseWallet"
                >
                </w3m-qrcode>
              `
            : null}
        </div>
      </w3m-modal-content>
      <w3m-modal-footer>
        <div class="w3m-title">
          ${QRCODE_ICON}
          <w3m-text variant="medium-normal">Scan with your phone</w3m-text>
        </div>
        <w3m-text variant="small-thin" align="center" color="secondary" class="w3m-info-text">
          Open Coinbase Wallet on your phone and scan the code to connect
        </w3m-text>
        <w3m-button
          variant="ghost"
          .iconLeft=${ARROW_DOWN_ICON}
          .onClick=${this.onInstall.bind(this)}
        >
          Install Extension
        </w3m-button>
      </w3m-modal-footer>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-coinbase-mobile-connector-view': W3mCoinbaseMobileConnectorView
  }
}
