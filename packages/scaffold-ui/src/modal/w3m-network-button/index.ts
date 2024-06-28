import {
  AccountController,
  AssetUtil,
  EventsController,
  ModalController,
  NetworkController
} from '@web3modal/core'
import type { WuiNetworkButton } from '@web3modal/ui'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import styles from './styles.js'

@customElement('w3m-network-button')
export class W3mNetworkButton extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @property({ type: Boolean }) public disabled?: WuiNetworkButton['disabled'] = false

  @property({ type: String }) public label?: string

  @state() private network = NetworkController.state.caipNetwork

  @state() private connected = AccountController.state.isConnected

  @state() private loading = ModalController.state.loading

  @state() private isUnsupportedChain = NetworkController.state.isUnsupportedChain

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()
    this.unsubscribe.push(
      ...[
        NetworkController.subscribeKey('caipNetwork', val => (this.network = val)),
        AccountController.subscribeKey('isConnected', val => (this.connected = val)),
        ModalController.subscribeKey('loading', val => (this.loading = val)),
        NetworkController.subscribeKey('isUnsupportedChain', val => (this.isUnsupportedChain = val))
      ]
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-network-button
        .disabled=${Boolean(this.disabled || this.loading)}
        .isUnsupportedChain=${this.isUnsupportedChain}
        imageSrc=${ifDefined(AssetUtil.getNetworkImage(this.network))}
        @click=${this.onClick.bind(this)}
      >
        ${this.getLabel()}
        <slot></slot>
      </wui-network-button>
    `
  }

  // -- Private ------------------------------------------- //
  private getLabel() {
    if (this.label) {
      return this.label
    }

    if (this.isUnsupportedChain) {
      return 'Switch Network'
    }
    if (this.network) {
      return this.network.name
    }
    if (this.connected) {
      return 'Unknown Network'
    }

    return 'Select Network'
  }

  private onClick() {
    if (!this.loading) {
      EventsController.sendEvent({ type: 'track', event: 'CLICK_NETWORKS' })
      ModalController.open({ view: 'SelectAddresses' })
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-network-button': W3mNetworkButton
  }
}
