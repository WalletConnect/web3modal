import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { getOptimisticWalletIdPreset } from '../../utils/Presets'
import { WALLET_PLACEHOLDER } from '../../utils/Svgs'
import { global } from '../../utils/Theme'
import { getWalletIcon } from '../../utils/UiHelpers'
import styles from './styles.css'

@customElement('w3m-wallet-image')
export class W3mWalletImage extends LitElement {
  public static styles = [global, styles]

  // -- state & properties ------------------------------------------- //
  @property() public walletId?: string = undefined
  @property() public src?: string = undefined

  // -- render ------------------------------------------------------- //
  protected render() {
    const walletId = this.walletId ?? 'injected'
    const optimisticId = getOptimisticWalletIdPreset(walletId)
    const src = this.src ? this.src : getWalletIcon(optimisticId)

    return html`
      ${src.length
        ? html`
            <div class="w3m-wallet-image">
              <img src=${src} alt=${this.id} />
            </div>
          `
        : WALLET_PLACEHOLDER}
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-wallet-image': W3mWalletImage
  }
}
