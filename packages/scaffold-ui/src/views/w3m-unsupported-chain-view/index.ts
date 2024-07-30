import {
  AccountController,
  AssetUtil,
  ConnectionController,
  ConstantsUtil,
  CoreHelperUtil,
  EventsController,
  ModalController,
  NetworkController,
  RouterController,
  SnackController
} from '@web3modal/core'

import type { CaipNetwork } from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import styles from './styles.js'
import { NetworkUtil } from '../../utils/NetworkUtil.js'

@customElement('w3m-unsupported-chain-view')
export class W3mUnsupportedChainView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  protected readonly swapUnsupportedChain = RouterController.state.data?.swapUnsupportedChain

  // -- State & Properties --------------------------------- //
  @state() private disconecting = false

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex class="container" flexDirection="column" gap="0">
        <wui-flex
          class="container"
          flexDirection="column"
          .padding=${['m', 'xl', 'xs', 'xl'] as const}
          alignItems="center"
          gap="xl"
        >
          ${this.descriptionTemplate()}
        </wui-flex>

        <wui-flex flexDirection="column" padding="s" gap="xs">
          ${this.networksTemplate()}
        </wui-flex>

        <wui-separator text="or"></wui-separator>
        <wui-flex flexDirection="column" padding="s" gap="xs">
          <wui-list-item
            variant="icon"
            iconVariant="overlay"
            icon="disconnect"
            ?chevron=${false}
            .loading=${this.disconecting}
            @click=${this.onDisconnect.bind(this)}
            data-testid="disconnect-button"
          >
            <wui-text variant="paragraph-500" color="fg-200">Disconnect</wui-text>
          </wui-list-item>
        </wui-flex>
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private descriptionTemplate() {
    if (this.swapUnsupportedChain) {
      return html`
        <wui-text variant="small-400" color="fg-200" align="center">
          The swap feature doesn’t support your current network. Switch to an available option to
          continue.
        </wui-text>
      `
    }

    return html`
      <wui-text variant="small-400" color="fg-200" align="center">
        This app doesn’t support your current network. Switch to an available option to continue.
      </wui-text>
    `
  }

  private networksTemplate() {
    const requestedCaipNetworks = NetworkController.getRequestedCaipNetworks()
    const approvedCaipNetworkIds = NetworkController.state.approvedCaipNetworkIds

    const sortedNetworks = CoreHelperUtil.sortRequestedNetworks(
      approvedCaipNetworkIds,
      requestedCaipNetworks
    )

    const filteredNetworks = this.swapUnsupportedChain
      ? sortedNetworks.filter(network => ConstantsUtil.SWAP_SUPPORTED_NETWORKS.includes(network.id))
      : sortedNetworks

    return filteredNetworks.map(
      network => html`
        <wui-list-network
          imageSrc=${ifDefined(AssetUtil.getNetworkImage(network))}
          name=${network.name ?? 'Unknown'}
          @click=${() => this.onSwitchNetwork(network)}
        >
        </wui-list-network>
      `
    )
  }

  private async onDisconnect() {
    try {
      this.disconecting = true
      await ConnectionController.disconnect()
      EventsController.sendEvent({
        type: 'track',
        event: 'DISCONNECT_SUCCESS'
      })
      ModalController.close()
    } catch {
      EventsController.sendEvent({ type: 'track', event: 'DISCONNECT_ERROR' })
      SnackController.showError('Failed to disconnect')
    } finally {
      this.disconecting = false
    }
  }

  private async onSwitchNetwork(network: CaipNetwork) {
    const isConnected = AccountController.state.isConnected
    const approvedCaipNetworkIds = NetworkController.state.approvedCaipNetworkIds
    const supportsAllNetworks = NetworkController.state.supportsAllNetworks
    const caipNetwork = NetworkController.state.caipNetwork
    const routerData = RouterController.state.data

    if (isConnected && caipNetwork?.id !== network.id) {
      if (approvedCaipNetworkIds?.includes(network.id)) {
        await NetworkController.switchActiveNetwork(network)
        await NetworkUtil.onNetworkChange()
      } else if (supportsAllNetworks) {
        RouterController.push('SwitchNetwork', { ...routerData, network })
      }
    } else if (!isConnected) {
      NetworkController.setActiveCaipNetwork(network)
      RouterController.push('Connect')
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-unsupported-chain-view': W3mUnsupportedChainView
  }
}
