import { AssetUtil, ConnectionController, CoreHelperUtil } from '@web3modal/core'
import { html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { WcConnectingLitElement } from '../../utils/WcConnectingLitElement.js'

@customElement('w3m-connecting-wc-web')
export class W3mConnectingWcWeb extends WcConnectingLitElement {
  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.wallet) {
      throw new Error('w3m-connecting-wc-web: No wallet provided')
    }

    return html`
      <w3m-connecting-widget
        name=${this.wallet.name}
        secondaryBtnLabel="Open"
        secondaryLabel="Open and continue in a new browser tab"
        secondaryBtnIcon="externalLink"
        imageSrc=${ifDefined(AssetUtil.getWalletImage(this.wallet.image_id))}
        .error=${Boolean(this.error)}
        .onConnect=${this.onConnect.bind(this)}
        .onCopyUri=${this.onCopyUri.bind(this)}
        .onRetry=${this.onRetry?.bind(this)}
        .autoConnect=${false}
      ></w3m-connecting-widget>
    `
  }

  // -- Private ------------------------------------------- //
  private onConnect() {
    if (this.wallet?.webapp_link && this.uri) {
      try {
        this.error = false
        const { webapp_link, name } = this.wallet
        const { redirect, href } = CoreHelperUtil.formatUniversalUrl(webapp_link, this.uri)
        ConnectionController.setWcLinking({ name, href })
        ConnectionController.setRecentWallet(this.wallet)
        CoreHelperUtil.openHref(redirect, '_blank')
      } catch {
        this.error = true
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connecting-wc-web': W3mConnectingWcWeb
  }
}
