import type { Connector } from '@web3modal/core'
import {
  ApiController,
  AssetUtil,
  ChainController,
  ConnectionController,
  ConnectorController,
  CoreHelperUtil,
  RouterController
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

@customElement('w3m-connect-injected-widget')
export class W3mConnectInjectedWidget extends LitElement {
  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private connectors = ConnectorController.state.connectors

  public constructor() {
    super()
    this.unsubscribe.push(
      ConnectorController.subscribeKey('connectors', val => (this.connectors = val))
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const injectedConnectors = this.connectors.filter(connector => connector.type === 'INJECTED')

    if (
      !injectedConnectors?.length ||
      (injectedConnectors.length === 1 &&
        injectedConnectors[0]?.name === 'Browser Wallet' &&
        !CoreHelperUtil.isMobile())
    ) {
      this.style.cssText = `display: none`

      return null
    }

    return html`
      <wui-flex flexDirection="column" gap="xs">
        ${injectedConnectors.map(connector => {
          if (!CoreHelperUtil.isMobile() && connector.name === 'Browser Wallet') {
            return null
          }

          if (!ConnectionController.checkInstalled(undefined, connector.chain)) {
            this.style.cssText = `display: none`

            return null
          }

          if (connector.info?.rdns && ApiController.state.excludedRDNS) {
            if (ApiController.state.excludedRDNS.includes(connector?.info?.rdns)) {
              return null
            }
          }

          return html`
            <wui-list-wallet
              imageSrc=${ifDefined(AssetUtil.getConnectorImage(connector))}
              .installed=${true}
              name=${connector.name ?? 'Unknown'}
              tagVariant="success"
              tagLabel="installed"
              data-testid=${`wallet-selector-${connector.id}`}
              @click=${() => this.onConnector(connector)}
            >
            </wui-list-wallet>
          `
        })}
      </wui-flex>
    `
  }

  // -- Private Methods ----------------------------------- //
  private onConnector(connector: Connector) {
    ChainController.setActiveConnector(connector)
    RouterController.push('ConnectingExternal', { connector })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connect-injected-widget': W3mConnectInjectedWidget
  }
}
