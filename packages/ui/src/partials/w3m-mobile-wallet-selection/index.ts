import {
  ClientCtrl,
  ConfigCtrl,
  ExplorerCtrl,
  ModalCtrl,
  OptionsCtrl,
  RouterCtrl
} from '@web3modal/core'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import '../../components/w3m-modal-content'
import '../../components/w3m-modal-header'
import '../../components/w3m-view-all-wallets-button'
import '../../components/w3m-wallet-button'
import { getOptimisticNamePreset } from '../../utils/Presets'
import { QRCODE_ICON } from '../../utils/Svgs'
import { global } from '../../utils/Theme'
import { handleMobileLinking } from '../../utils/UiHelpers'
import styles from './styles'

@customElement('w3m-mobile-wallet-selection')
export class W3mMobileWalletSelection extends LitElement {
  public static styles = [global, styles]

  // -- private ------------------------------------------------------ //
  private onGoToQrcode() {
    RouterCtrl.push('Qrcode')
  }

  private async onConnectorWallet(id: string) {
    const { selectedChainId } = OptionsCtrl.state
    if (id === 'coinbaseWallet') {
      await ClientCtrl.client().connectCoinbaseMobile(() => null, selectedChainId)
    } else {
      await ClientCtrl.client().connectConnector(id, selectedChainId)
    }

    ModalCtrl.close()
  }

  private mobileWalletsTemplate() {
    const { mobileWallets } = ConfigCtrl.state
    const wallets = [...(mobileWallets ?? [])]

    if (window.ethereum) {
      const injectedName = getOptimisticNamePreset('injected')
      const idx = wallets.findIndex(({ name }) => getOptimisticNamePreset(name) === injectedName)
      wallets.splice(idx, 1)
    }

    if (wallets.length) {
      return wallets.map(
        ({ id, name, links: { universal, native } }) => html`
          <w3m-wallet-button
            name=${name}
            walletId=${id}
            .onClick=${async () => handleMobileLinking({ native, universal }, name)}
          ></w3m-wallet-button>
        `
      )
    }

    return undefined
  }

  private previewWalletsTemplate() {
    const { previewWallets } = ExplorerCtrl.state
    const wallets = [...previewWallets]

    if (window.ethereum) {
      const injectedName = getOptimisticNamePreset('injected')
      const idx = wallets.findIndex(({ name }) => getOptimisticNamePreset(name) === injectedName)
      wallets.splice(idx, 1)
    }

    return wallets.map(
      ({ image_url, name, mobile: { native, universal } }) => html`
        <w3m-wallet-button
          name=${name}
          src=${image_url.lg}
          .onClick=${async () => handleMobileLinking({ native, universal }, name)}
        ></w3m-wallet-button>
      `
    )
  }

  private connectorWalletsTemplate() {
    const { isStandalone } = OptionsCtrl.state

    if (isStandalone) {
      return []
    }

    const connectorWallets = ClientCtrl.client().getConnectorWallets()

    if (!window.ethereum) {
      connectorWallets.filter(connector => !['injected', 'metaMask'].includes(connector.id))
    }

    return connectorWallets.map(
      ({ name, id }) => html`
        <w3m-wallet-button
          name=${name}
          walletId=${id}
          .onClick=${async () => this.onConnectorWallet(id)}
        ></w3m-wallet-button>
      `
    )
  }

  // -- render ------------------------------------------------------- //
  protected render() {
    const { standaloneUri } = OptionsCtrl.state
    const connectorTemplate = this.connectorWalletsTemplate()
    const mobileTemplate = this.mobileWalletsTemplate()
    const previewTemplate = this.previewWalletsTemplate()
    const linkingWallets = mobileTemplate ?? previewTemplate
    const combinedWallets = [...connectorTemplate, ...linkingWallets]
    const displayWallets = standaloneUri ? linkingWallets : combinedWallets
    const isViewAll = displayWallets.length > 8
    const wallets = isViewAll ? displayWallets.slice(0, 7) : displayWallets
    const row1 = wallets.slice(0, 4)
    const row2 = wallets.slice(4, 8)
    const isMobileWallets = Boolean(wallets.length)

    return html`
      <w3m-modal-header
        title="Connect your wallet"
        .onAction=${this.onGoToQrcode}
        .actionIcon=${QRCODE_ICON}
      ></w3m-modal-header>

      ${isMobileWallets
        ? html`
            <w3m-modal-content>
              <div class="w3m-view-row">${row1}</div>
              ${row2.length
                ? html`
                    <div class="w3m-view-row">
                      ${row2}
                      ${isViewAll
                        ? html`<w3m-view-all-wallets-button></w3m-view-all-wallets-button>`
                        : null}
                    </div>
                  `
                : null}
            </w3m-modal-content>
          `
        : null}
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-mobile-wallet-selection': W3mMobileWalletSelection
  }
}
