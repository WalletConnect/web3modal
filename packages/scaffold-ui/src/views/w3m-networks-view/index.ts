import type { CaipNetwork } from '@web3modal/core'
import {
  AccountController,
  AssetUtil,
  CoreHelperUtil,
  EventsController,
  NetworkController,
  RouterController
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import styles from './styles.js'
import { NetworkUtil } from '../../utils/NetworkUtil.js'

@customElement('w3m-networks-view')
export class W3mNetworksView extends LitElement {
  public static override styles = styles
  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() public caipNetwork = NetworkController.state.caipNetwork

  public constructor() {
    super()
    this.unsubscribe.push(
      NetworkController.subscribeKey('caipNetwork', val => (this.caipNetwork = val))
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-grid padding="s" gridTemplateColumns="repeat(4, 1fr)" rowGap="l" columnGap="xs">
        ${this.networksTemplate()}
      </wui-grid>

      <wui-separator></wui-separator>

      <wui-flex padding="s" flexDirection="column" gap="m" alignItems="center">
        <wui-text variant="small-400" color="fg-300" align="center">
          Your connected wallet may not support some of the networks available for this dApp
        </wui-text>
        <wui-link @click=${this.onNetworkHelp.bind(this)}>
          <wui-icon size="xs" color="accent-100" slot="iconLeft" name="helpCircle"></wui-icon>
          What is a network
        </wui-link>
      </wui-flex>
    `
  }

  // Private Methods ------------------------------------- //
  private onNetworkHelp() {
    EventsController.sendEvent({ type: 'track', event: 'CLICK_NETWORK_HELP' })
    RouterController.push('WhatIsANetwork')
  }

  private networksTemplate() {
    const { approvedCaipNetworkIds, requestedCaipNetworks, supportsAllNetworks } =
      NetworkController.state

    const sortedNetworks = CoreHelperUtil.sortRequestedNetworks(
      approvedCaipNetworkIds,
      requestedCaipNetworks
    )

    return sortedNetworks?.map(
      network => html`
        <wui-card-select
          .selected=${this.caipNetwork?.id === network.id}
          imageSrc=${ifDefined(AssetUtil.getNetworkImage(network))}
          type="network"
          name=${network.name ?? network.id}
          @click=${() => this.onSwitchNetwork(network)}
          .disabled=${!supportsAllNetworks && !approvedCaipNetworkIds?.includes(network.id)}
          data-testid=${`w3m-network-switch-${network.name ?? network.id}`}
        ></wui-card-select>
      `
    )
  }

  private async onSwitchNetwork(network: CaipNetwork) {
    const { isConnected } = AccountController.state
    const { approvedCaipNetworkIds, supportsAllNetworks, caipNetwork } = NetworkController.state
    const { data } = RouterController.state
    if (isConnected && caipNetwork?.id !== network.id) {
      console.log('Switching network isConnected', network)
      if (approvedCaipNetworkIds?.includes(network.id)) {
        await NetworkController.switchActiveNetwork(network)
        await NetworkUtil.onNetworkChange()
      } else if (supportsAllNetworks) {
        RouterController.push('SwitchNetwork', { ...data, network })
      }
    } else if (!isConnected) {
      console.log('Switching network !isConnected', network)
      NetworkController.setCaipNetwork(network)
      RouterController.push('Connect')
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-networks-view': W3mNetworksView
  }
}
