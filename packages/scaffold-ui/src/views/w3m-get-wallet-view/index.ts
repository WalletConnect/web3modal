import { LitElement, html } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'

import {
  ApiController,
  AssetUtil,
  CoreHelperUtil,
  type CustomWallet,
  EventsController,
  OptionsController
} from '@reown/appkit-controllers'
import { customElement } from '@reown/appkit-ui'
import '@reown/appkit-ui/wui-flex'
import '@reown/appkit-ui/wui-list-item'

const EXPLORER = 'https://walletguide.walletconnect.com'

@customElement('w3m-get-wallet-view')
export class W3mGetWalletView extends LitElement {
  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex flexDirection="column" .padding=${['0', '3', '3', '3'] as const} gap="2">
        ${this.recommendedWalletsTemplate()}
        <w3m-list-wallet
          name="Explore all"
          showAllWallets
          walletIcon="allWallets"
          icon="externalLink"
          size="sm"
          @click=${() => {
            CoreHelperUtil.openHref('https://walletguide.walletconnect.com/', '_blank')
          }}
        ></w3m-list-wallet>
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private recommendedWalletsTemplate() {
    const { recommended, featured } = ApiController.state
    const { customWallets } = OptionsController.state
    const wallets = [...featured, ...(customWallets ?? []), ...recommended].slice(0, 4)

    return wallets.map(
      (wallet, index) => html`
        <w3m-list-wallet
          displayIndex=${index}
          name=${wallet.name ?? 'Unknown'}
          tagVariant="accent"
          size="sm"
          imageSrc=${ifDefined(AssetUtil.getWalletImage(wallet))}
          @click=${() => {
            this.onWalletClick(wallet)
          }}
        ></w3m-list-wallet>
      `
    )
  }

  private onWalletClick(wallet: CustomWallet) {
    EventsController.sendEvent({
      type: 'track',
      event: 'GET_WALLET',
      properties: {
        name: wallet.name,
        walletRank: undefined,
        explorerId: wallet.id,
        type: 'homepage'
      }
    })
    CoreHelperUtil.openHref(wallet.homepage ?? EXPLORER, '_blank')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-get-wallet-view': W3mGetWalletView
  }
}
