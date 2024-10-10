import {
  ConstantsUtil,
  type CaipAddress,
  type CaipNetwork,
  type SIWEStatus
} from '@reown/appkit-common'
import {
  AccountController,
  ApiController,
  ChainController,
  CoreHelperUtil,
  EventsController,
  ModalController,
  OptionsController,
  RouterController,
  SnackController,
  ThemeController
} from '@reown/appkit-core'
import { UiHelperUtil, customElement, initializeTheming } from '@reown/appkit-ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import styles from './styles.js'

// -- Helpers --------------------------------------------- //
const SCROLL_LOCK = 'scroll-lock'

@customElement('w3m-modal')
export class W3mModal extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  private abortController?: AbortController = undefined

  // -- State & Properties -------------------------------- //
  @state() private open = ModalController.state.open

  @state() private isSiweEnabled = OptionsController.state.isSiweEnabled

  @state() private isOneClickAuthenticating = AccountController.state.isOneClickAuthenticating

  @state() private caipAddress = ChainController.state.activeCaipAddress

  @state() private caipNetwork = ChainController.state.activeCaipNetwork

  @state() private shake = ModalController.state.shake

  public constructor() {
    super()
    this.initializeTheming()
    ApiController.prefetch()
    this.unsubscribe.push(
      ...[
        ModalController.subscribeKey('open', val => (val ? this.onOpen() : this.onClose())),
        ModalController.subscribeKey('shake', val => (this.shake = val)),
        AccountController.subscribeKey('isOneClickAuthenticating', val => {
          this.isOneClickAuthenticating = val
        }),
        AccountController.subscribeKey('siweStatus', val => this.onSiweStatusChange(val), 'eip155'),
        ChainController.subscribeKey('activeCaipNetwork', val => this.onNewNetwork(val)),
        ChainController.subscribeKey('activeCaipAddress', val => this.onNewAddress(val)),
        OptionsController.subscribeKey('isSiweEnabled', val => (this.isSiweEnabled = val))
      ]
    )
    EventsController.sendEvent({ type: 'track', event: 'MODAL_LOADED' })
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
    this.onRemoveKeyboardListener()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return this.open
      ? html`
          <wui-flex @click=${this.onOverlayClick.bind(this)} data-testid="w3m-modal-overlay">
            <wui-card
              shake="${this.shake}"
              role="alertdialog"
              aria-modal="true"
              tabindex="0"
              data-testid="w3m-modal-card"
            >
              <w3m-header></w3m-header>
              <w3m-router></w3m-router>
              <w3m-snackbar></w3m-snackbar>
              <w3m-alertbar></w3m-alertbar>
            </wui-card>
          </wui-flex>
          <w3m-tooltip></w3m-tooltip>
        `
      : null
  }

  // -- Private ------------------------------------------- //
  private async onOverlayClick(event: PointerEvent) {
    if (event.target === event.currentTarget) {
      await this.handleClose()
    }
  }

  private async handleClose() {
    const isSiweSignScreen = RouterController.state.view === 'ConnectingSiwe'
    const isApproveSignScreen = RouterController.state.view === 'ApproveTransaction'

    if (this.isSiweEnabled) {
      const { SIWEController } = await import('@reown/appkit-siwe')
      const isUnauthenticated = SIWEController.state.status !== 'success'
      if (isUnauthenticated && (isSiweSignScreen || isApproveSignScreen)) {
        ModalController.shake()
      } else {
        ModalController.close()
      }
    } else {
      ModalController.close()
    }
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

  private onSiweStatusChange(nextStatus: SIWEStatus | undefined) {
    if (nextStatus === 'success') {
      ModalController.close()
    }
  }

  private async onNewAddress(caipAddress?: CaipAddress) {
    const prevCaipAddress = this.caipAddress
    const prevConnected = prevCaipAddress
      ? CoreHelperUtil.getPlainAddress(prevCaipAddress)
      : undefined
    const nextConnected = caipAddress ? CoreHelperUtil.getPlainAddress(caipAddress) : undefined
    const isSameAddress = prevConnected === nextConnected

    if (nextConnected && !isSameAddress && this.isSiweEnabled) {
      const { SIWEController } = await import('@reown/appkit-siwe')
      const signed = AccountController.state.siweStatus === 'success'

      if (!prevConnected && nextConnected) {
        this.onSiweNavigation()
      } else if (signed && prevConnected && nextConnected && prevConnected !== nextConnected) {
        if (SIWEController.state._client?.options.signOutOnAccountChange) {
          await SIWEController.signOut()
          this.onSiweNavigation()
        }
      }
    }

    if (!nextConnected) {
      ModalController.close()
    }
  }

  private async onNewNetwork(nextCaipNetwork: CaipNetwork | undefined) {
    if (!this.caipAddress) {
      this.caipNetwork = nextCaipNetwork
      RouterController.goBack()

      return
    }

    const prevCaipNetworkId = this.caipNetwork?.caipNetworkId?.toString()
    const nextNetworkId = nextCaipNetwork?.caipNetworkId?.toString()

    if (prevCaipNetworkId && nextNetworkId && prevCaipNetworkId !== nextNetworkId) {
      if (this.isSiweEnabled) {
        const { SIWEController } = await import('@reown/appkit-siwe')

        if (SIWEController.state._client?.options.signOutOnNetworkChange) {
          await SIWEController.signOut()
          this.onSiweNavigation()
        } else {
          RouterController.goBack()
        }
      } else {
        RouterController.goBack()
      }
    }
    this.caipNetwork = nextCaipNetwork
  }

  private onSiweNavigation() {
    const isEIP155Namespace = ChainController.state.activeChain === ConstantsUtil.CHAIN.EVM
    const authenticated = AccountController.state.siweStatus === 'success'

    if (!authenticated && isEIP155Namespace && !this.isOneClickAuthenticating) {
      ModalController.open({
        view: 'ConnectingSiwe'
      })
    } else {
      RouterController.goBack()
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-modal': W3mModal
  }
}
