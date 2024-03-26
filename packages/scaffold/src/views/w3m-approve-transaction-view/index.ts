import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import styles from './styles.js'
import { ModalController, ConnectorController, ThemeController } from '@web3modal/core'

@customElement('w3m-approve-transaction-view')
export class W3mApproveTransactionView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private bodyObserver?: ResizeObserver = undefined

  private unsubscribe: (() => void)[] = []

  private iframe = document.getElementById('w3m-iframe') as HTMLIFrameElement

  // -- State & Properties -------------------------------- //
  @state() ready = false

  public constructor() {
    super()
    this.unsubscribe.push(
      ModalController.subscribeKey('open', val => {
        if (!val) {
          this.onHideIframe()
        }
      })
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
    this.bodyObserver?.unobserve(window.document.body)
  }

  public override async firstUpdated() {
    const verticalPadding = 10

    await this.syncTheme()

    this.iframe.style.display = 'block'
    const blueprint = this.renderRoot.querySelector('div')
    this.bodyObserver = new ResizeObserver(() => {
      const data = blueprint?.getBoundingClientRect()
      const dimensions = data ?? { left: 0, top: 0, width: 0, height: 0 }
      this.iframe.style.width = `${dimensions.width}px`
      this.iframe.style.height = `${dimensions.height - verticalPadding}px`
      this.iframe.style.left = `${dimensions.left}px`
      this.iframe.style.top = `${dimensions.top + verticalPadding / 2}px`
      this.ready = true
    })
    this.bodyObserver.observe(window.document.body)
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (this.ready) {
      this.onShowIframe()
    }

    return html`<div data-ready=${this.ready}></div>`
  }

  // -- Private ------------------------------------------- //
  private onShowIframe() {
    const isMobile = window.innerWidth <= 430
    this.iframe.animate(
      [
        { opacity: 0, transform: isMobile ? 'translateY(50px)' : 'scale(.95)' },
        { opacity: 1, transform: isMobile ? 'translateY(0)' : 'scale(1)' }
      ],
      { duration: 200, easing: 'ease', fill: 'forwards', delay: 300 }
    )
  }

  private async onHideIframe() {
    await this.iframe.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 200,
      easing: 'ease',
      fill: 'forwards'
    }).finished
    this.iframe.style.display = 'none'
  }

  private async syncTheme() {
    const authConnector = ConnectorController.getAuthConnector()
    if (authConnector) {
      await authConnector.provider.syncTheme({
        themeVariables: ThemeController.getSnapshot().themeVariables
      })
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-approve-transaction-view': W3mApproveTransactionView
  }
}
