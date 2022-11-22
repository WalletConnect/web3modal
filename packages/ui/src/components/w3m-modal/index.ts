import {
  ConfigCtrl,
  CoreHelpers,
  ExplorerCtrl,
  ModalCtrl,
  OptionsCtrl,
  ToastCtrl
} from '@web3modal/core'
import { html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { animate, spring } from 'motion'
import { global } from '../../utils/Theme'
import ThemedElement from '../../utils/ThemedElement'
import {
  getChainIcon,
  getCustomImageUrls,
  getShadowRootElement,
  isMobileAnimation,
  preloadImage
} from '../../utils/UiHelpers'
import '../w3m-modal-backcard'
import '../w3m-modal-router'
import '../w3m-modal-toast'
import styles, { dynamicStyles } from './styles'

@customElement('w3m-modal')
export class W3mModal extends ThemedElement {
  public static styles = [global, styles]

  // -- state & properties ------------------------------------------- //
  @state() private open = false
  @state() private preload = true

  // -- lifecycle ---------------------------------------------------- //
  public constructor() {
    super()
    this.unsubscribeModal = ModalCtrl.subscribe(modalState => {
      if (modalState.open) {
        this.onOpenModalEvent()
      }
      if (!modalState.open) {
        this.onCloseModalEvent()
      }
    })
    this.preloadModalData()
  }

  public disconnectedCallback() {
    super.disconnectedCallback()
    this.unsubscribeModal?.()
  }

  // -- private ------------------------------------------------------ //
  private readonly unsubscribeModal?: () => void = undefined

  private get overlayEl() {
    return getShadowRootElement(this, '.w3m-modal-overlay')
  }

  private get containerEl() {
    return getShadowRootElement(this, '.w3m-modal-container')
  }

  private toggleBodyScroll(enabled: boolean) {
    const [body] = document.getElementsByTagName('body')
    if (enabled) {
      body.style.overflow = 'auto'
    } else {
      body.style.overflow = 'hidden'
    }
  }

  private onCloseModal(event: PointerEvent) {
    if (event.target === event.currentTarget) {
      ModalCtrl.close()
    }
  }

  private async preloadExplorerData() {
    const { standaloneChains, chains } = OptionsCtrl.state
    const { projectId } = ConfigCtrl.state

    if (projectId && (standaloneChains?.length || chains?.length)) {
      try {
        const chainsFilter = standaloneChains?.join(',')
        await Promise.all([
          ExplorerCtrl.getPreviewWallets({
            page: 1,
            entries: 10,
            chains: chainsFilter,
            device: CoreHelpers.isMobile() ? 'mobile' : 'desktop'
          }),
          ExplorerCtrl.getRecomendedWallets()
        ])
        const walletImgs = [
          ...ExplorerCtrl.state.previewWallets,
          ...ExplorerCtrl.state.recomendedWallets
        ].map(({ image_url }) => image_url.lg)
        const chainsImgs = chains?.map(chain => getChainIcon(chain.id)) ?? []
        await Promise.all([
          ...walletImgs.map(async url => preloadImage(url)),
          ...chainsImgs.map(async url => preloadImage(url))
        ])
      } catch {
        ToastCtrl.openToast('Failed preloading', 'error')
      }
    }
  }

  private async preloadCustomImages() {
    const images = getCustomImageUrls()
    if (images.length) {
      await Promise.all(images.map(async url => preloadImage(url)))
    }
  }

  private async preloadModalData() {
    if (this.preload) {
      this.preload = false
      await Promise.all([this.preloadExplorerData(), this.preloadCustomImages()])
    }
  }

  private async onOpenModalEvent() {
    await this.preloadModalData()
    this.toggleBodyScroll(false)
    const delay = 0.3
    animate(this.overlayEl, { opacity: [0, 1] }, { duration: 0.2, delay })
    animate(this.containerEl, isMobileAnimation() ? { y: ['50vh', 0] } : { scale: [0.98, 1] }, {
      scale: { easing: spring({ velocity: 0.4 }) },
      y: { easing: spring({ mass: 0.5 }) },
      delay
    })
    document.addEventListener('keydown', this.onKeyDown)
    this.open = true
  }

  private async onCloseModalEvent() {
    this.toggleBodyScroll(true)
    document.removeEventListener('keydown', this.onKeyDown)
    await Promise.all([
      animate(this.containerEl, isMobileAnimation() ? { y: [0, '50vh'] } : { scale: [1, 0.98] }, {
        scale: { easing: spring({ velocity: 0 }) },
        y: { easing: spring({ mass: 0.5 }) }
      }).finished,
      animate(this.overlayEl, { opacity: [1, 0] }, { duration: 0.2 }).finished
    ])
    this.open = false
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      ModalCtrl.close()
    }
  }

  // -- render ------------------------------------------------------- //
  protected render() {
    const classes = {
      'w3m-modal-overlay': true,
      'w3m-modal-open': this.open
    }

    return html`
      ${dynamicStyles()}

      <div
        class=${classMap(classes)}
        @click=${this.onCloseModal}
        role="alertdialog"
        aria-modal="true"
      >
        <div class="w3m-modal-container">
          ${this.open
            ? html`
                <w3m-modal-backcard></w3m-modal-backcard>
                <div class="w3m-modal-card">
                  <w3m-modal-router></w3m-modal-router>
                  <w3m-modal-toast></w3m-modal-toast>
                </div>
              `
            : null}
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-modal': W3mModal
  }
}
