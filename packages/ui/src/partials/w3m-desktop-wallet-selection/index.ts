import type { DesktopConnectorData } from '@web3modal/core'
import { ConfigCtrl, ExplorerCtrl, OptionsCtrl, RouterCtrl } from '@web3modal/core'
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { InjectedId } from '../../presets/EthereumPresets'
import { DataFilterUtil } from '../../utils/DataFilterUtil'
import { SvgUtil } from '../../utils/SvgUtil'
import { ThemeUtil } from '../../utils/ThemeUtil'
import { UiUtil } from '../../utils/UiUtil'
import styles from './styles.css'

@customElement('w3m-desktop-wallet-selection')
export class W3mDesktopWalletSelection extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  // -- private ------------------------------------------------------ //
  private onDesktopWallet(data: DesktopConnectorData) {
    RouterCtrl.push('DesktopConnector', { DesktopConnector: data })
  }

  private onInjectedWallet() {
    RouterCtrl.push('InjectedConnector')
  }

  private onInstallConnector() {
    RouterCtrl.push('InstallConnector', {
      InstallConnector: {
        id: 'metaMask',
        name: 'MetaMask',
        isMobile: true,
        url: 'https://metamask.io'
      }
    })
  }

  private async onConnectorWallet(id: string) {
    if (!window.ethereum) {
      this.onInstallConnector()
    } else if (id === 'injected' || id === InjectedId.metaMask) {
      this.onInjectedWallet()
    } else {
      await UiUtil.handleConnectorConnection(id)
    }
  }

  private desktopWalletsTemplate() {
    const { desktopWallets } = ConfigCtrl.state

    return desktopWallets?.map(
      ({ id, name, links: { universal, native } }) => html`
        <w3m-wallet-button
          walletId=${id}
          name=${name}
          .onClick=${() => this.onDesktopWallet({ name, walletId: id, universal, native })}
        ></w3m-wallet-button>
      `
    )
  }

  private recomendedWalletsTemplate() {
    let wallets = DataFilterUtil.allowedExplorerListings(ExplorerCtrl.state.recomendedWallets)
    wallets = DataFilterUtil.deduplicateExplorerListingsFromConnectors(wallets)

    return wallets.map(
      ({ name, desktop: { universal, native }, homepage, image_id, id }) => html`
        <w3m-wallet-button
          src=${UiUtil.getWalletIcon({ id, image_id })}
          name=${name}
          .onClick=${() =>
            this.onDesktopWallet({
              walletId: id,
              name,
              native,
              universal: universal || homepage,
              icon: UiUtil.getWalletIcon({ id, image_id })
            })}
        ></w3m-wallet-button>
      `
    )
  }

  private connectorWalletsTemplate() {
    const wallets = DataFilterUtil.connectorWallets()

    return wallets.map(
      ({ id, name, ready }) => html`
        <w3m-wallet-button
          .installed=${['injected', 'metaMask'].includes(id) && ready}
          name=${name}
          walletId=${id}
          .onClick=${async () => this.onConnectorWallet(id)}
        ></w3m-wallet-button>
      `
    )
  }

  private recentWalletTemplate() {
    const wallet = UiUtil.getRecentWallet()

    if (!wallet) {
      return undefined
    }

    const { id, name, links, image } = wallet

    return html`
      <w3m-wallet-button
        .recent=${true}
        name=${name}
        walletId=${ifDefined(id)}
        src=${ifDefined(image)}
        .onClick=${() =>
          this.onDesktopWallet({
            name,
            walletId: id,
            universal: links?.universal,
            native: links?.native,
            icon: image
          })}
      ></w3m-wallet-button>
    `
  }

  // -- render ------------------------------------------------------- //
  protected render() {
    const { standaloneUri } = OptionsCtrl.state
    const desktopTemplate = this.desktopWalletsTemplate()
    const recomendedTemplate = this.recomendedWalletsTemplate()
    const connectorTemplate = this.connectorWalletsTemplate()
    const recentTemplate = this.recentWalletTemplate()
    const linkingWallets = [...(desktopTemplate ?? []), ...recomendedTemplate]
    const combinedWallets = [...connectorTemplate, ...linkingWallets]
    const combinedWalletsWithRecent = DataFilterUtil.walletTemplatesWithRecent(
      combinedWallets,
      recentTemplate
    )
    const linkingWalletsWithRecent = DataFilterUtil.walletTemplatesWithRecent(
      linkingWallets,
      recentTemplate
    )
    const displayWallets = standaloneUri ? linkingWalletsWithRecent : combinedWalletsWithRecent
    const isViewAll = displayWallets.length > 4
    let wallets = []

    if (isViewAll) {
      wallets = displayWallets.slice(0, 3)
    } else {
      wallets = displayWallets
    }

    const isDesktopWallets = Boolean(wallets.length)

    return html`
      <w3m-modal-header
        border=${true}
        title="Connect your wallet"
        .onAction=${UiUtil.handleUriCopy}
        .actionIcon=${SvgUtil.COPY_ICON}
      ></w3m-modal-header>

      <w3m-modal-content>
        <div class="w3m-mobile-title">
          <div class="w3m-subtitle">
            ${SvgUtil.MOBILE_ICON}
            <w3m-text variant="small-regular" color="accent">Mobile</w3m-text>
          </div>

          <div class="w3m-subtitle">
            ${SvgUtil.SCAN_ICON}
            <w3m-text variant="small-regular" color="secondary">Scan with your wallet</w3m-text>
          </div>
        </div>
        <w3m-walletconnect-qr></w3m-walletconnect-qr>
      </w3m-modal-content>

      ${isDesktopWallets
        ? html`
            <w3m-modal-footer>
              <div class="w3m-desktop-title">
                ${SvgUtil.DESKTOP_ICON}
                <w3m-text variant="small-regular" color="accent">Desktop</w3m-text>
              </div>

              <div class="w3m-grid">
                ${wallets}
                ${isViewAll
                  ? html`<w3m-view-all-wallets-button></w3m-view-all-wallets-button>`
                  : null}
              </div>
            </w3m-modal-footer>
          `
        : null}
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-desktop-wallet-selection': W3mDesktopWalletSelection
  }
}
