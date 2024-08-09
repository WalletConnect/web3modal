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
import type { ICheckNewAddressGeneric, SignControlSiwXType } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import styles from './styles.js'
import type { CaipAddress, RouterControllerState } from '@web3modal/core'
import type { SIWESession } from '@web3modal/siwe'
import type { SIWSSession } from '@web3modal/siws'

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

  @state() private isSiwsEnabled = OptionsController.state.isSiwsEnabled

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
      OptionsController.subscribeKey('isSiweEnabled', val => (this.isSiweEnabled = val)),
      OptionsController.subscribeKey('isSiwsEnabled', val => (this.isSiwsEnabled = val))
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

    if (this.isSiwsEnabled) {
      const { SIWSController } = await import('@web3modal/siws')

      if (SIWSController.state.status !== 'success' && this.connected) {
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

    const previousAddress = CoreHelperUtil.getPlainAddress(this.caipAddress)
    const newAddress = CoreHelperUtil.getPlainAddress(caipAddress)
    const previousNetworkId = CoreHelperUtil.getNetworkId(this.caipAddress)
    const newNetworkId = CoreHelperUtil.getNetworkId(caipAddress)
    this.caipAddress = caipAddress

    const dataAddressGeneric = {
      previousAddress,
      newAddress,
      previousNetworkId,
      newNetworkId
    }

    if (this.isSiweEnabled) {
      await this.checkNewAddressGeneric({
        typeSignControlSiwX: 'Siwe',
        ...dataAddressGeneric
      })
    }

    if (this.isSiwsEnabled) {
      await this.checkNewAddressGeneric({
        typeSignControlSiwX: 'Siws',
        ...dataAddressGeneric
      })
    }
  }

  private async checkNewAddressGeneric({
    typeSignControlSiwX,
    previousAddress,
    newAddress,
    previousNetworkId,
    newNetworkId
  }: ICheckNewAddressGeneric) {
    const { SIWEController } = await import('@web3modal/siwe')
    const { SIWSController } = await import('@web3modal/siws')

    const moduleMap = {
      Siwe: SIWEController,
      Siws: SIWSController
    }

    const controller = moduleMap[typeSignControlSiwX]

    const session: SIWESession | SIWSSession | null | undefined = await controller.getSession()

    // If the address has changed and signOnAccountChange is enabled, sign out
    if (session && previousAddress && newAddress && previousAddress !== newAddress) {
      if (controller.state._client?.options.signOutOnAccountChange) {
        await controller.signOut()

        this.onNavigationGeneric(typeSignControlSiwX)
      }

      return
    }

    /*
     * If the network has changed and signOnNetworkChange is enabled, sign out
     * Covers case where network is switched wallet-side
     */
    if (session && previousNetworkId && newNetworkId && previousNetworkId !== newNetworkId) {
      if (controller.state._client?.options.signOutOnNetworkChange) {
        await controller.signOut()
        this.onNavigationGeneric(typeSignControlSiwX)
      }

      return
    }

    this.onNavigationGeneric(typeSignControlSiwX)
  }

  private onNavigationGeneric(typeSignControlSiwX: SignControlSiwXType) {
    const nameToNavigation = `Connecting${typeSignControlSiwX}` as RouterControllerState['view']

    if (this.open) {
      RouterController.push(nameToNavigation)
    } else {
      ModalController.open({
        view: nameToNavigation
      })
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-modal': W3mModal
  }
}
