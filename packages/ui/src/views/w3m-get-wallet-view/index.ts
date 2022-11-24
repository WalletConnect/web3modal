import { CoreHelpers, ExplorerCtrl } from '@web3modal/core'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { ARROW_RIGHT_ICON, ARROW_UP_RIGHT_ICON } from '../../utils/Svgs'
import { global } from '../../utils/Theme'
import { getCustomWallets } from '../../utils/UiHelpers'
import styles, { dynamicStyles } from './styles'

@customElement('w3m-get-wallet-view')
export class W3mGetWalletView extends LitElement {
  public static styles = [global, styles]

  // -- private ------------------------------------------------------ //
  private readonly explorerUrl = 'https://explorer.walletconnect.com/'

  private onGet(url: string) {
    CoreHelpers.openHref(url, '_blank')
  }

  private onExplore() {
    CoreHelpers.openHref(this.explorerUrl, '_blank')
  }

  // -- render ------------------------------------------------------- //
  protected render() {
    const { recomendedWallets } = ExplorerCtrl.state
    const customWallets = getCustomWallets().slice(0, 6)
    const isRecomendedWallets = recomendedWallets.length
    const isCustomWallets = customWallets.length

    return html`
      ${dynamicStyles()}

      <w3m-modal-header title="Get a wallet"></w3m-modal-header>
      <w3m-modal-content>
        ${isRecomendedWallets
          ? recomendedWallets.map(
              ({ name, image_url, homepage }) =>
                html`
                  <div class="w3m-wallet-item">
                    <w3m-wallet-image src=${image_url.lg}></w3m-wallet-image>
                    <div class="w3m-wallet-content">
                      <w3m-text variant="medium-normal">${name}</w3m-text>
                      <w3m-button
                        .iconRight=${ARROW_RIGHT_ICON}
                        variant="ghost"
                        .onClick=${() => this.onGet(homepage)}
                      >
                        Get
                      </w3m-button>
                    </div>
                  </div>
                `
            )
          : null}
        ${isCustomWallets
          ? customWallets.map(
              ({ name, id, links }) =>
                html`
                  <div class="w3m-wallet-item">
                    <w3m-wallet-image walletId=${id}></w3m-wallet-image>
                    <div class="w3m-wallet-content">
                      <w3m-text variant="medium-normal">${name}</w3m-text>
                      <w3m-button
                        .iconRight=${ARROW_RIGHT_ICON}
                        variant="ghost"
                        .onClick=${() => this.onGet(links.universal)}
                      >
                        Get
                      </w3m-button>
                    </div>
                  </div>
                `
            )
          : null}
      </w3m-modal-content>
      <w3m-modal-footer>
        <div class="w3m-footer-actions">
          <w3m-text variant="medium-normal">Not what you're looking for?</w3m-text>
          <w3m-text variant="small-thin" align="center" color="secondary" class="w3m-info-text">
            With hundreds of wallets out there, there's something for everyone
          </w3m-text>
          <w3m-button .onClick=${this.onExplore.bind(this)} .iconRight=${ARROW_UP_RIGHT_ICON}>
            Explore Wallets
          </w3m-button>
        </div>
      </w3m-modal-footer>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-get-wallet-view': W3mGetWalletView
  }
}
