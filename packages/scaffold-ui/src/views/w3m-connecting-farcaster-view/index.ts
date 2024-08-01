import {
  AccountController,
  ConnectionController,
  ConnectorController,
  CoreHelperUtil,
  ModalController,
  RouterController,
  SnackController,
  StorageUtil,
  ThemeController
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import styles from './styles.js'

@customElement('w3m-connecting-farcaster-view')
export class W3mConnectingFarcasterView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  protected timeout?: ReturnType<typeof setTimeout> = undefined

  @state() private socialProvider = AccountController.state.socialProvider

  @state() protected uri = AccountController.state.farcasterUrl

  @state() protected ready = false

  @state() protected loading = false

  public authConnector = ConnectorController.getAuthConnector()

  public constructor() {
    super()
    this.unsubscribe.push(
      ...[
        AccountController.subscribeKey('farcasterUrl', val => {
          if (val) {
            this.uri = val
            this.connectFarcaster()
          }
        }),
        AccountController.subscribeKey('socialProvider', val => {
          if (val) {
            this.socialProvider = val
          }
        })
      ]
    )

    window.addEventListener('resize', this.forceUpdate)
  }

  public override disconnectedCallback() {
    super.disconnectedCallback()
    clearTimeout(this.timeout)
    window.removeEventListener('resize', this.forceUpdate)
  }

  // -- Render -------------------------------------------- //
  public override render() {
    this.onRenderProxy()

    return html`${this.platformTemplate()}`
  }

  // -- Private ------------------------------------------- //
  private platformTemplate() {
    if (CoreHelperUtil.isMobile()) {
      return html`${this.mobileTemplate()}`
    }

    return html`${this.desktopTemplate()}`
  }

  private desktopTemplate() {
    if (this.loading) {
      return html`${this.loadingTemplate()}`
    }

    return html`${this.qrTemplate()}`
  }

  private qrTemplate() {
    return html` <wui-flex
      flexDirection="column"
      alignItems="center"
      .padding=${['0', 'xl', 'xl', 'xl']}
      gap="xl"
    >
      <wui-shimmer borderRadius="l" width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>

      <wui-text variant="paragraph-500" color="fg-100">
        Scan this QR Code with your phone
      </wui-text>
      ${this.copyTemplate()}
    </wui-flex>`
  }

  private loadingTemplate() {
    return html`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${['xl', 'xl', 'xl', 'xl'] as const}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-logo logo="farcaster"></wui-logo>
          ${this.loaderTemplate()}
          <wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>
        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text align="center" variant="paragraph-500" color="fg-100">
            Loading user data
          </wui-text>
          <wui-text align="center" variant="small-400" color="fg-200">
            Please wait a moment while we load your data.
          </wui-text>
        </wui-flex>
      </wui-flex>
    `
  }

  private mobileTemplate() {
    return html` <wui-flex
      flexDirection="column"
      alignItems="center"
      .padding=${['3xl', 'xl', 'xl', 'xl'] as const}
      gap="xl"
    >
      <wui-flex justifyContent="center" alignItems="center">
        <wui-logo logo="farcaster"></wui-logo>
        ${this.loaderTemplate()}
        <wui-icon-box
          backgroundColor="error-100"
          background="opaque"
          iconColor="error-100"
          icon="close"
          size="sm"
          border
          borderColor="wui-color-bg-125"
        ></wui-icon-box>
      </wui-flex>
      <wui-flex flexDirection="column" alignItems="center" gap="xs">
        <wui-text align="center" variant="paragraph-500" color="fg-100"
          >Continue in Farcaster</span></wui-text
        >
        <wui-text align="center" variant="small-400" color="fg-200"
          >Accept connection request in the app</wui-text
        ></wui-flex
      >
      ${this.mobileLinkTemplate()}
    </wui-flex>`
  }

  private loaderTemplate() {
    const borderRadiusMaster = ThemeController.state.themeVariables['--w3m-border-radius-master']
    const radius = borderRadiusMaster ? parseInt(borderRadiusMaster.replace('px', ''), 10) : 4

    return html`<wui-loading-thumbnail radius=${radius * 9}></wui-loading-thumbnail>`
  }

  private async connectFarcaster() {
    if (this.authConnector) {
      try {
        await this.authConnector?.provider.connectFarcaster()

        if (this.socialProvider) {
          StorageUtil.setConnectedSocialProvider(this.socialProvider)
        }
        this.loading = true
        await ConnectionController.connectExternal(this.authConnector)
        this.loading = false
        ModalController.close()
      } catch (error) {
        RouterController.goBack()
        SnackController.showError(error)
      }
    }
  }

  private mobileLinkTemplate() {
    return html`<wui-button
      size="md"
      ?loading=${this.loading}
      ?disabled=${!this.uri || this.loading}
      @click=${() => {
        if (this.uri) {
          CoreHelperUtil.openHref(this.uri, '_blank')
        }
      }}
    >
      Open farcaster</wui-button
    >`
  }

  private onRenderProxy() {
    if (!this.ready && this.uri) {
      // This setTimeout needed to avoid the beginning of the animation from not starting to resize immediately and some weird svg errors
      this.timeout = setTimeout(() => {
        this.ready = true
      }, 0)
    }
  }

  private qrCodeTemplate() {
    if (!this.uri || !this.ready) {
      return null
    }

    const size = this.getBoundingClientRect().width - 40

    return html` <wui-qr-code
      size=${size}
      theme=${ThemeController.state.themeMode}
      uri=${this.uri}
      ?farcaster=${true}
      data-testid="wui-qr-code"
    ></wui-qr-code>`
  }

  private copyTemplate() {
    const inactive = !this.uri || !this.ready

    return html`<wui-link
      .disabled=${inactive}
      @click=${this.onCopyUri}
      color="fg-200"
      data-testid="copy-wc2-uri"
    >
      <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
      Copy link
    </wui-link>`
  }

  private forceUpdate = () => {
    this.requestUpdate()
  }

  // -- Protected ----------------------------------------- //
  protected onCopyUri() {
    try {
      if (this.uri) {
        CoreHelperUtil.copyToClopboard(this.uri)
        SnackController.showSuccess('Link copied')
      }
    } catch {
      SnackController.showError('Failed to copy')
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connecting-farcaster-view': W3mConnectingFarcasterView
  }
}
