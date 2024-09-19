import type { BaseError, Platform } from '@reown/appkit-core'
import {
  ConnectionController,
  ConstantsUtil,
  CoreHelperUtil,
  EventsController,
  ModalController,
  OptionsController,
  RouterController,
  SnackController,
  StorageUtil
} from '@reown/appkit-core'
import { customElement } from '@reown/appkit-ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'

@customElement('w3m-connecting-wc-view')
export class W3mConnectingWcView extends LitElement {
  // -- Members ------------------------------------------- //
  private interval?: ReturnType<typeof setInterval> = undefined

  private lastRetry = Date.now()

  private wallet = RouterController.state.data?.wallet

  // -- State & Properties -------------------------------- //
  @state() private platform?: Platform = undefined

  @state() private platforms: Platform[] = []

  public constructor() {
    super()
    this.initializeConnection()
    this.interval = setInterval(this.initializeConnection.bind(this), ConstantsUtil.TEN_SEC_MS)
  }

  public override disconnectedCallback() {
    clearTimeout(this.interval)
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.wallet) {
      return html`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`
    }

    this.determinePlatforms()

    return html`
      ${this.headerTemplate()}
      <div>${this.platformTemplate()}</div>
    `
  }

  // -- Private ------------------------------------------- //
  private async initializeConnection(retry = false) {
    try {
      const { wcPairingExpiry } = ConnectionController.state
      if (retry || CoreHelperUtil.isPairingExpired(wcPairingExpiry)) {
        await ConnectionController.connectWalletConnect()
        this.finalizeConnection()
        ModalController.close()
      }
    } catch (error) {
      EventsController.sendEvent({
        type: 'track',
        event: 'CONNECT_ERROR',
        properties: { message: (error as BaseError)?.message ?? 'Unknown' }
      })
      ConnectionController.setWcError(true)
      if (CoreHelperUtil.isAllowedRetry(this.lastRetry)) {
        SnackController.showError('Declined')
        this.lastRetry = Date.now()
        this.initializeConnection(true)
      }
    }
  }

  private finalizeConnection() {
    const { wcLinking, recentWallet } = ConnectionController.state

    if (wcLinking) {
      StorageUtil.setWalletConnectDeepLink(wcLinking)
    }
    if (recentWallet) {
      StorageUtil.setAppKitRecent(recentWallet)
    }

    EventsController.sendEvent({
      type: 'track',
      event: 'CONNECT_SUCCESS',
      properties: {
        method: wcLinking ? 'mobile' : 'qrcode',
        name: this.wallet?.name || 'Unknown'
      }
    })
  }

  private determinePlatforms() {
    if (!this.wallet) {
      throw new Error('w3m-connecting-wc-view:determinePlatforms No wallet')
    }

    if (this.platform) {
      return
    }

    const { mobile_link, desktop_link, webapp_link, injected, rdns } = this.wallet
    const injectedIds = injected?.map(({ injected_id }) => injected_id).filter(Boolean) as string[]
    const browserIds = rdns ? [rdns] : injectedIds ?? []
    const isBrowser = OptionsController.state.isUniversalProvider ? false : browserIds.length
    const isMobileWc = mobile_link
    const isWebWc = webapp_link
    const isBrowserInstalled = ConnectionController.checkInstalled(browserIds)
    const isBrowserWc = isBrowser && isBrowserInstalled
    const isDesktopWc = desktop_link && !CoreHelperUtil.isMobile()

    // Populate all preferences
    if (isBrowserWc) {
      this.platforms.push('browser')
    }
    if (isMobileWc) {
      this.platforms.push(CoreHelperUtil.isMobile() ? 'mobile' : 'qrcode')
    }
    if (isWebWc) {
      this.platforms.push('web')
    }
    if (isDesktopWc) {
      this.platforms.push('desktop')
    }
    if (!isBrowserWc && isBrowser) {
      this.platforms.push('unsupported')
    }

    this.platform = this.platforms[0]
  }

  private platformTemplate() {
    switch (this.platform) {
      case 'browser':
        return html`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`
      case 'desktop':
        return html`
          <w3m-connecting-wc-desktop .onRetry=${() => this.initializeConnection(true)}>
          </w3m-connecting-wc-desktop>
        `
      case 'web':
        return html`
          <w3m-connecting-wc-web .onRetry=${() => this.initializeConnection(true)}>
          </w3m-connecting-wc-web>
        `
      case 'mobile':
        return html`
          <w3m-connecting-wc-mobile isMobile .onRetry=${() => this.initializeConnection(true)}>
          </w3m-connecting-wc-mobile>
        `
      case 'qrcode':
        return html`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`
      default:
        return html`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`
    }
  }

  private headerTemplate() {
    const multiPlatform = this.platforms.length > 1

    if (!multiPlatform) {
      return null
    }

    return html`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `
  }

  private async onSelectPlatform(platform: Platform) {
    const container = this.shadowRoot?.querySelector('div')
    if (container) {
      await container.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      }).finished
      this.platform = platform
      container.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      })
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connecting-wc-view': W3mConnectingWcView
  }
}
