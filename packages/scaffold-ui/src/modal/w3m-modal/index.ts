import {
  AccountController,
  ApiController,
  ConnectionController,
  CoreHelperUtil,
  EventsController,
  ModalController,
  OptionsController,
  RouterController,
  SnackController,
  ThemeController
} from '@web3modal/core'
import { UiHelperUtil, customElement, initializeTheming } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import styles from './styles.js'
import type { CaipAddress } from '@web3modal/core'

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

  @state() private connected = AccountController.state.isConnected

  @state() private loading = ModalController.state.loading

  public constructor() {
    super()
    this.initializeTheming()
    ApiController.prefetch()
    this.unsubscribe.push(
      ModalController.subscribeKey('open', val => (val ? this.onOpen() : this.onClose())),
      ModalController.subscribeKey('loading', val => {
        this.loading = val
        this.onNewAddress(AccountController.state.caipAddress)
      }),
      AccountController.subscribeKey('isConnected', val => (this.connected = val)),
      AccountController.subscribeKey('caipAddress', val => this.onNewAddress(val)),
      OptionsController.subscribeKey('isSiweEnabled', val => (this.isSiweEnabled = val))
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
          <wui-flex @click=${this.onOverlayClick.bind(this)}>
            <wui-card role="alertdialog" aria-modal="true" tabindex="0">
              <w3m-header></w3m-header>
              <w3m-router></w3m-router>
              <w3m-snackbar></w3m-snackbar>
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
    if (this.isSiweEnabled) {
      const { SIWEController } = await import('@web3modal/siwe')

      if (SIWEController.state.status !== 'success' && this.connected) {
        await ConnectionController.disconnect()
      }
    }
    ModalController.close()
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
    if (!this.connected || this.loading) {
      return
    }

    const newAddress = CoreHelperUtil.getPlainAddress(caipAddress)
    const newNetworkId = CoreHelperUtil.getNetworkId(caipAddress)

    if (this.isSiweEnabled) {
      const { SIWEController, appKitAuthConfig } = await import('@web3modal/siwe')
      if (!SIWEController.state._client) {
        SIWEController.setSIWEClient(appKitAuthConfig)
      }
      const session = await SIWEController.getSession()
      if (session?.address && session?.chainId) {
        const { chainId, address } = session

        // If the address has changed and signOnAccountChange is enabled, sign out
        if (newAddress && address !== newAddress) {
          if (SIWEController.state._client?.options.signOutOnAccountChange) {
            await SIWEController.signOut()
            this.onSiweNavigation()
          }

          return
        }

        // If the network has changed and signOnNetworkChange is enabled, sign out
        if (newNetworkId && chainId.toString() !== newNetworkId) {
          if (SIWEController.state._client?.options.signOutOnNetworkChange) {
            await SIWEController.signOut()
            this.onSiweNavigation()
          }
        }
      } else {
        this.onSiweNavigation()
      }
    }
  }

  private onSiweNavigation() {
    if (this.open) {
      RouterController.push('ConnectingSiwe')
    } else {
      ModalController.open({
        view: 'ConnectingSiwe'
      })
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-modal': W3mModal
  }
}
