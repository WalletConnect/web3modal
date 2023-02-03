import {
  ClientCtrl,
  CoreUtil,
  ModalCtrl,
  OptionsCtrl,
  RouterCtrl,
  ToastCtrl
} from '@web3modal/core'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { SvgUtil } from '../../utils/SvgUtil'
import { ThemeUtil } from '../../utils/ThemeUtil'
import { UiUtil } from '../../utils/UiUtil'
import styles from './styles.css'

@customElement('w3m-desktop-connector-view')
export class W3mDesktopConnectorView extends LitElement {
  public static styles = [ThemeUtil.globalCss, styles]

  // -- state & properties ------------------------------------------- //
  @state() private uri = ''

  // -- lifecycle ---------------------------------------------------- //
  public constructor() {
    super()
    this.createConnectionAndWait()
  }

  // -- private ------------------------------------------------------ //
  private getRouterData() {
    const data = RouterCtrl.state.data?.DesktopConnector
    if (!data) {
      throw new Error('Missing router data')
    }

    return data
  }

  private onFormatAndRedirect(uri: string) {
    const { native, universal, name } = this.getRouterData()
    if (native) {
      const href = CoreUtil.formatNativeUrl(native, uri, name)
      CoreUtil.openHref(href)
    } else if (universal) {
      const href = CoreUtil.formatUniversalUrl(universal, uri, name)
      CoreUtil.openHref(href, '_blank')
    }
  }

  private async createConnectionAndWait(retry = 0) {
    const { standaloneUri } = OptionsCtrl.state
    const { name, walletId, native, universal, icon } = this.getRouterData()
    const recentWalletData = { name, id: walletId, links: { native, universal }, image: icon }
    if (standaloneUri) {
      UiUtil.setRecentWallet(recentWalletData)
      this.onFormatAndRedirect(standaloneUri)
    } else {
      try {
        await ClientCtrl.client().connectWalletConnect(uri => {
          this.uri = uri
          this.onFormatAndRedirect(uri)
        }, OptionsCtrl.state.selectedChain?.id)
        UiUtil.setRecentWallet(recentWalletData)
        ModalCtrl.close()
      } catch (err) {
        console.error(err)
        ToastCtrl.openToast('Connection request declined', 'error')
        if (retry < 2) {
          this.createConnectionAndWait(retry + 1)
        }
      }
    }
  }

  private onConnectWithMobile() {
    RouterCtrl.push('Qrcode')
  }

  private onGoToWallet() {
    const { universal, name } = this.getRouterData()
    if (universal) {
      const href = CoreUtil.formatUniversalUrl(universal, this.uri, name)
      CoreUtil.openHref(href, '_blank')
    }
  }

  // -- render ------------------------------------------------------- //
  protected render() {
    const { name, icon, universal, walletId } = this.getRouterData()
    const optimisticName = UiUtil.getWalletName(name)

    return html`
      <w3m-modal-header title=${optimisticName}></w3m-modal-header>

      <w3m-modal-content>
        <div class="w3m-wrapper">
          ${icon
            ? html`<w3m-wallet-image src=${icon} size="lg"></w3m-wallet-image>`
            : html`<w3m-wallet-image size="lg" walletid=${ifDefined(walletId)}></w3m-wallet-image>`}

          <div class="w3m-connecting-title">
            <w3m-spinner></w3m-spinner>
            <w3m-text variant="large-bold" color="secondary">
              ${`Continue in ${optimisticName}...`}
            </w3m-text>
          </div>

          <div class="w3m-install-actions">
            <w3m-button
              .onClick=${async () => this.createConnectionAndWait()}
              .iconRight=${SvgUtil.RETRY_ICON}
            >
              Retry
            </w3m-button>

            ${universal
              ? html`
                  <w3m-button
                    .onClick=${this.onGoToWallet.bind(this)}
                    .iconLeft=${SvgUtil.ARROW_UP_RIGHT_ICON}
                  >
                    Go to Wallet
                  </w3m-button>
                `
              : html`
                  <w3m-button .onClick=${this.onConnectWithMobile} .iconLeft=${SvgUtil.MOBILE_ICON}>
                    Connect with Mobile
                  </w3m-button>
                `}
          </div>
        </div>
      </w3m-modal-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-desktop-connector-view': W3mDesktopConnectorView
  }
}
