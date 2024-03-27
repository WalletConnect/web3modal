import {
  AccountController,
  ApiController,
  ConnectionController,
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
import type { AccountControllerState } from '@web3modal/core'

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

  @state() private caipAddress = AccountController.state.caipAddress

  @state() private isSiweEnabled = OptionsController.state.isSiweEnabled

  public constructor() {
    super()
    this.initializeTheming()
    ApiController.prefetch()
    this.unsubscribe.push(
      ModalController.subscribeKey('open', val => (val ? this.onOpen() : this.onClose())),
      AccountController.subscribe(newAccountState => this.onNewAccountState(newAccountState))
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

      if (SIWEController.state.status !== 'success') {
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

  private async onClose() {
    this.onScrollUnlock()
    await this.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 200,
      easing: 'ease',
      fill: 'forwards'
    }).finished
    SnackController.hide()
    this.open = false
    this.onRemoveKeyboardListener()
  }

  private async onOpen() {
    this.onScrollLock()
    this.open = true
    await this.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 200,
      easing: 'ease',
      fill: 'forwards'
    }).finished
    this.onAddKeyboardListener()
  }

  private onScrollLock() {
    const styleTag = document.createElement('style')
    styleTag.dataset['w3m'] = SCROLL_LOCK
    styleTag.textContent = `
      html, body {
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

  private async onNewAccountState(newState: AccountControllerState) {
    const { isConnected, caipAddress: newCaipAddress } = newState

    if (this.isSiweEnabled) {
      const { SIWEController } = await import('@web3modal/siwe')

      if (isConnected && !this.caipAddress) {
        this.caipAddress = newCaipAddress
      }
      if (isConnected && newCaipAddress && this.caipAddress !== newCaipAddress) {
        await SIWEController.signOut()
        this.onSiweNavigation()
        this.caipAddress = newCaipAddress
      }

      try {
        const session = await SIWEController.getSession()
        if (session && !isConnected) {
          await SIWEController.signOut()
        } else if (isConnected && !session) {
          this.onSiweNavigation()
        }
      } catch (error) {
        if (isConnected) {
          this.onSiweNavigation()
        }
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
