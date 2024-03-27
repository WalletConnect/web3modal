import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'
import { state } from 'lit/decorators.js'
import { NetworkController } from '@web3modal/core'

const yourItems = [
  {
    name: 'Ethereum',
    symbol: 'ETH'
  },
  {
    name: 'Avalanche',
    symbol: 'AVAX'
  },
  {
    name: 'Bitcoin',
    symbol: 'BTC'
  },
  {
    name: 'Cardano',
    symbol: 'ADA'
  },
  {
    name: 'Ripple',
    symbol: 'XRP'
  }
]

@customElement('w3m-convert-select-network-view')
export class W3mConvertSelectNetworkView extends LitElement {
  public static override styles = styles
  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private network = NetworkController.state.caipNetwork

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()
    this.unsubscribe.push(
      ...[NetworkController.subscribeKey('caipNetwork', val => (this.network = val))]
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex flexDirection="column" padding="s"> ${this.templateListNetworks()} </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private templateListNetworks() {
    return html`
      <wui-flex class="token-list" flexDirection="column">
        <wui-flex flexDirection="column" gap="xs">
          ${yourItems.map(
            item => html`${this.templateNetworkListItem(item, this.network?.name === item.name)}`
          )}
        </wui-flex>
      </wui-flex>
    `
  }

  private templateNetworkListItem(item: { name: string; symbol: string }, active?: boolean) {
    return html`<button class="network-list-item ${active ? 'active' : ''}">
      <wui-image
        src="https://explorer-api.walletconnect.com/w3m/v1/getAssetImage/692ed6ba-e569-459a-556a-776476829e00?projectId=c1781fc385454899a2b1385a2b83df3b"
      ></wui-image>
      <wui-flex flexGrow="1">
        <wui-text color="fg-100" variant="paragraph-500">${item.name}</wui-text>
      </wui-flex>
      ${active ? html`<wui-icon name="checkmarkBold" color="accent-100" size="xs"></wui-icon>` : ''}
    </button>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-convert-select-network-view': W3mConvertSelectNetworkView
  }
}
