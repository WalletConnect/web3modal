import {
  ConnectionController,
  ConnectorController,
  ConstantsUtil,
  CoreHelperUtil,
  ModalController,
  Platform,
  RouterController,
  SnackController,
  StorageUtil
} from '@web3modal/core'
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { animate } from 'motion'

@customElement('w3m-connecting-wc-view')
export class W3mConnectingWcView extends LitElement {
  // -- Members ------------------------------------------- //
  private interval?: ReturnType<typeof setInterval> = undefined

  private lastRetry = Date.now()

  private listing = RouterController.state.data?.listing

  // -- State & Properties -------------------------------- //
  @state() private platform?: Platform = undefined

  @state() private platforms: Platform[] = []

  public constructor() {
    super()
    this.initializeConnection()
    this.interval = setInterval(this.initializeConnection.bind(this), ConstantsUtil.TEN_SEC_MS)
  }

  public disconnectedCallback() {
    clearTimeout(this.interval)
  }

  // -- Render -------------------------------------------- //
  public render() {
    if (!this.listing) {
      return html`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`
    }

    this.determinePlatforms()

    return html`${this.headerTemplate()} ${this.platformTemplate()}`
  }

  // -- Private ------------------------------------------- //
  private async initializeConnection(retry = false) {
    try {
      const { wcPairingExpiry } = ConnectionController.state
      if (retry || CoreHelperUtil.isPairingExpired(wcPairingExpiry)) {
        ConnectionController.connectWalletConnect()
        await ConnectionController.state.wcPromise
        const { wcLinking } = ConnectionController.state
        if (wcLinking) {
          StorageUtil.setWalletConnectDeepLink(wcLinking)
        }
        ModalController.close()
      }
    } catch {
      if (CoreHelperUtil.isAllowedRetry(this.lastRetry)) {
        SnackController.showError('Declined')
        this.lastRetry = Date.now()
        this.initializeConnection(true)
      }
    }
  }

  private determinePlatforms() {
    if (!this.listing) {
      throw new Error('w3m-connecting-wc-view:determinePlatforms No listing')
    }

    if (this.platform) {
      return
    }

    const { connectors } = ConnectorController.state
    const { mobile, desktop, injected } = this.listing
    const injectedIds = injected?.map(({ injected_id }) => injected_id) ?? []
    const isInjected = injectedIds.length
    const isMobile = CoreHelperUtil.isMobile()
    const isMobileWc = mobile?.native || mobile?.universal
    const isWebWc = desktop?.universal
    const isInjectedConnector = connectors.find(c => c.type === 'INJECTED')
    const isInjectedInstalled = ConnectionController.checkInjectedInstalled(injectedIds)
    const isInjectedWc = isInjected && isInjectedInstalled && isInjectedConnector
    const isDesktopWc = desktop?.native

    // Populate all preferences
    if (!this.platforms.length) {
      if (isInjected && isInjectedConnector) {
        this.platforms.push('injected')
      }
      if (isMobileWc) {
        this.platforms.push('mobile')
      }
      if (isWebWc) {
        this.platforms.push('web')
      }
      if (isDesktopWc) {
        this.platforms.push('desktop')
      }
    }

    // Mobile
    if (isMobile) {
      if (isInjectedWc) {
        this.platform = 'injected'
      } else if (isMobileWc) {
        this.platform = 'mobile'
      } else if (isWebWc) {
        this.platform = 'web'
      } else {
        this.platform = 'unsupported'
      }
    }

    // Desktop
    else if (isInjectedWc) {
      this.platform = 'injected'
    } else if (isDesktopWc) {
      this.platform = 'desktop'
    } else if (isWebWc) {
      this.platform = 'web'
    } else if (isMobileWc) {
      this.platform = 'qrcode'
    } else {
      this.platform = 'unsupported'
    }
  }

  private platformTemplate() {
    const multiPlatform = this.platforms.length > 1

    switch (this.platform) {
      case 'injected':
        return html`
          <w3m-connecting-wc-injected .multiPlatfrom=${multiPlatform}></w3m-connecting-wc-injected>
        `
      case 'desktop':
        return html`
          <w3m-connecting-wc-desktop .multiPlatfrom=${multiPlatform}></w3m-connecting-wc-desktop>
        `
      case 'web':
        return html`
          <w3m-connecting-wc-web .multiPlatfrom=${multiPlatform}></w3m-connecting-wc-web>
        `
      case 'mobile':
        return html`
          <w3m-connecting-wc-mobile .multiPlatfrom=${multiPlatform}></w3m-connecting-wc-mobile>
        `
      case 'qrcode':
        return html`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`
      default:
        return html`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`
    }
  }

  private headerTemplate() {
    const multiPlatform = this.platforms.length > 1

    if (!multiPlatform || this.platform === 'unsupported') {
      return null
    }

    return html`
      <w3m-connecting-header
        platform=${ifDefined(this.platform)}
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `
  }

  private async onSelectPlatform(platform: Platform) {
    await animate(this, { opacity: [1, 0] }, { duration: 0.2 }).finished
    this.platform = platform
    animate(this, { opacity: [0, 1] }, { duration: 0.2 })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connecting-wc-view': W3mConnectingWcView
  }
}
