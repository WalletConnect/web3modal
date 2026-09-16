import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import { type CaipAddress, type CaipNetwork } from '@reown/appkit-common'
import {
  ApiController,
  ChainController,
  ConnectorController,
  ModalController,
  ModalUtil,
  OptionsController,
  RouterController,
  SIWXUtil,
  SnackController,
  SwapController,
  ThemeController
} from '@reown/appkit-controllers'
import { UiHelperUtil, customElement, initializeTheming, vars } from '@reown/appkit-ui'
import '@reown/appkit-ui/wui-card'
import '@reown/appkit-ui/wui-flex'

import '../../partials/w3m-alertbar/index.js'
import { headings } from '../../partials/w3m-header/index.js'
import '../../partials/w3m-snackbar/index.js'
import '../../partials/w3m-tooltip-trigger/index.js'
import '../../partials/w3m-tooltip/index.js'
import { HelpersUtil } from '../../utils/HelpersUtil.js'
import '../w3m-footer/index.js'
import '../w3m-router/index.js'
import styles from './styles.js'

// -- Helpers --------------------------------------------- //
const SCROLL_LOCK = 'scroll-lock'

function getCardLabel() {
  const { view } = RouterController.state

  // Views without a header title, such as the account screens, fall back to the view name
  return headings()[view] || view.replace(/(?<=[a-z])(?=[A-Z])/gu, ' ')
}

// -- Constants --------------------------------------------- //
const PADDING_OVERRIDES: Record<string, string> = {
  PayWithExchange: '0',
  PayWithExchangeSelectAsset: '0',
  Pay: '0',
  PayQuote: '0',
  PayLoading: '0'
}

export class W3mModalBase extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  private abortController?: AbortController = undefined

  private hasPrefetched = false

  // -- State & Properties -------------------------------- //
  @property({ type: Boolean }) private enableEmbedded = OptionsController.state.enableEmbedded

  @state() private open = ModalController.state.open

  @state() private caipAddress = ChainController.state.activeCaipAddress

  @state() private caipNetwork = ChainController.state.activeCaipNetwork

  @state() private shake = ModalController.state.shake

  @state() private filterByNamespace = ConnectorController.state.filterByNamespace

  @state() private padding = vars.spacing[1]

  @state() private cardLabel = getCardLabel()

  @state() private mobileFullScreen = OptionsController.state.enableMobileFullScreen

  public constructor() {
    super()
    this.initializeTheming()
    ApiController.prefetchAnalyticsConfig()
    this.unsubscribe.push(
      ...[
        ModalController.subscribeKey('open', val => (val ? this.onOpen() : this.onClose())),
        ModalController.subscribeKey('shake', val => (this.shake = val)),
        ChainController.subscribeKey('activeCaipNetwork', val => this.onNewNetwork(val)),
        ChainController.subscribeKey('activeCaipAddress', val => this.onNewAddress(val)),
        OptionsController.subscribeKey('enableEmbedded', val => (this.enableEmbedded = val)),
        ConnectorController.subscribeKey('filterByNamespace', val => {
          if (this.filterByNamespace !== val && !ChainController.getAccountData(val)?.caipAddress) {
            ApiController.fetchRecommendedWallets()
            this.filterByNamespace = val
          }
        }),
        RouterController.subscribeKey('view', () => {
          this.dataset['border'] = HelpersUtil.hasFooter() ? 'true' : 'false'
          this.padding = PADDING_OVERRIDES[RouterController.state.view] ?? vars.spacing[1]
          this.cardLabel = getCardLabel()
        })
      ]
    )
  }

  public override firstUpdated() {
    this.dataset['border'] = HelpersUtil.hasFooter() ? 'true' : 'false'

    if (this.mobileFullScreen) {
      this.setAttribute('data-mobile-fullscreen', 'true')
    }

    if (this.caipAddress) {
      if (this.enableEmbedded) {
        ModalController.close()
        this.prefetch()

        return
      }

      this.onNewAddress(this.caipAddress)
    }

    if (this.open) {
      this.onOpen()
    }

    if (this.enableEmbedded) {
      this.prefetch()
    }
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
    this.onRemoveKeyboardListener()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    this.style.setProperty('--local-modal-padding', this.padding)

    if (this.enableEmbedded) {
      return html`${this.contentTemplate()}
        <w3m-tooltip></w3m-tooltip> `
    }

    return this.open
      ? html`
          <wui-flex @click=${this.onOverlayClick.bind(this)} data-testid="w3m-modal-overlay">
            ${this.contentTemplate()}
          </wui-flex>
          <w3m-tooltip></w3m-tooltip>
        `
      : null
  }

  // -- Private ------------------------------------------- //
  private contentTemplate() {
    return html` <wui-card
      shake="${this.shake}"
      data-embedded="${ifDefined(this.enableEmbedded)}"
      role="alertdialog"
      aria-modal="true"
      aria-label=${this.cardLabel}
      tabindex="0"
      data-testid="w3m-modal-card"
    >
      <w3m-header></w3m-header>
      <w3m-router></w3m-router>
      <w3m-footer></w3m-footer>
      <w3m-snackbar></w3m-snackbar>
      <w3m-alertbar></w3m-alertbar>
    </wui-card>`
  }

  private async onOverlayClick(event: PointerEvent) {
    if (event.target === event.currentTarget) {
      if (this.mobileFullScreen) {
        return
      }
      await this.handleClose()
    }
  }

  private async handleClose() {
    await ModalUtil.safeClose()
  }

  private initializeTheming() {
    const { themeVariables, themeMode } = ThemeController.state
    const defaultThemeMode = UiHelperUtil.getColorTheme(themeMode)
    initializeTheming(themeVariables, defaultThemeMode)
  }

  private onClose() {
    this.open = false
    this.classList.remove('open')
    this.onScrollUnlock()
    SnackController.hide()
    this.onRemoveKeyboardListener()
  }

  private onOpen() {
    this.open = true
    this.classList.add('open')
    this.onScrollLock()
    this.onAddKeyboardListener()
  }

  private onScrollLock() {
    const styleTag = document.createElement('style')
    styleTag.dataset['w3m'] = SCROLL_LOCK
    styleTag.textContent = `
      body {
        touch-action: none;
        overflow: hidden;
        overscroll-behavior: contain;
      }
      w3m-modal {
        pointer-events: auto;
      }
    `
    document.head.appendChild(styleTag)
  }

  private onScrollUnlock() {
    const styleTag = document.head.querySelector(`style[data-w3m="${SCROLL_LOCK}"]`)
    if (styleTag) {
      styleTag.remove()
    }
  }

  private onAddKeyboardListener() {
    this.abortController = new AbortController()
    const card = this.shadowRoot?.querySelector('wui-card')
    card?.focus()
    window.addEventListener(
      'keydown',
      event => {
        if (event.key === 'Escape') {
          this.handleClose()
        } else if (event.key === 'Tab') {
          const { tagName } = event.target as HTMLElement
          if (tagName && !tagName.includes('W3M-') && !tagName.includes('WUI-')) {
            card?.focus()
          }
        }
      },
      this.abortController
    )
  }

  private onRemoveKeyboardListener() {
    this.abortController?.abort()
    this.abortController = undefined
  }

  private async onNewAddress(caipAddress?: CaipAddress) {
    // Capture current state
    const isSwitchingNamespace = ChainController.state.isSwitchingNamespace
    const isInProfileView = RouterController.state.view === 'ProfileWallets'

    const shouldClose = !caipAddress && !isSwitchingNamespace && !isInProfileView
    if (shouldClose) {
      ModalController.close()
    }

    await SIWXUtil.initializeIfEnabled(caipAddress)
    this.caipAddress = caipAddress
    ChainController.setIsSwitchingNamespace(false)
  }

  private onNewNetwork(nextCaipNetwork: CaipNetwork | undefined) {
    // Previous network information
    const prevCaipNetwork = this.caipNetwork
    const prevCaipNetworkId = prevCaipNetwork?.caipNetworkId?.toString()

    const nextNetworkId = nextCaipNetwork?.caipNetworkId?.toString()
    const didNetworkChange = prevCaipNetworkId !== nextNetworkId
    // If user is *currently* on the unsupported network screen
    const isUnsupportedNetworkScreen = RouterController.state.view === 'UnsupportedChain'
    const isModalOpen = ModalController.state.open

    let shouldGoBack = false

    if (this.enableEmbedded && RouterController.state.view === 'SwitchNetwork') {
      shouldGoBack = true
    }

    if (didNetworkChange) {
      SwapController.resetState()
    }

    if (isModalOpen && isUnsupportedNetworkScreen) {
      // If on the unsupported screen, any network change should likely go back
      shouldGoBack = true
    }
    // Don't go back if the user is on the SIWXSignMessage view
    if (shouldGoBack && RouterController.state.view !== 'SIWXSignMessage') {
      RouterController.goBack()
    }
    // Update the component's state *after* potential goBack()
    this.caipNetwork = nextCaipNetwork
  }

  /*
   * This will only be called if enableEmbedded is true. Since embedded
   * mode doesn't set the modal open state to true to do prefetching
   */
  private prefetch() {
    if (!this.hasPrefetched) {
      ApiController.prefetch()
      ApiController.fetchWalletsByPage({ page: 1 })
      this.hasPrefetched = true
    }
  }
}

@customElement('w3m-modal')
export class W3mModal extends W3mModalBase {}

@customElement('appkit-modal')
export class AppKitModal extends W3mModalBase {}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-modal': W3mModal
    'appkit-modal': AppKitModal
  }
}
