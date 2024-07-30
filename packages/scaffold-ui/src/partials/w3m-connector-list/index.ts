import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'

import styles from './styles.js'
import {
  ApiController,
  ChainController,
  ConnectorController,
  OptionsController,
  StorageUtil
} from '@web3modal/core'
import { ConstantsUtil as CommonConstantsUtil } from '@web3modal/common'
import { state } from 'lit/decorators.js'
import { ConstantsUtil } from '@web3modal/scaffold-utils'
import { WalletUtil } from '../../utils/WalletUtil.js'
@customElement('w3m-connector-list')
export class W3mConnectorList extends LitElement {
  public static override styles = styles

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
    const {
      custom,
      recent,
      announced,
      coinbase,
      injected,
      multiChain,
      recommended,
      featured,
      external
    } = this.getConnectorsByType()

    return html`
      <wui-flex flexDirection="column" gap="xs">
        <w3m-connect-walletconnect-widget></w3m-connect-walletconnect-widget>
        ${recent.length ? html`<w3m-connect-recent-widget></w3m-connect-recent-widget>` : null}
        ${multiChain.length
          ? html`<w3m-connect-multi-chain-widget></w3m-connect-multi-chain-widget>`
          : null}
        ${announced.length
          ? html`<w3m-connect-announced-widget></w3m-connect-announced-widget>`
          : null}
        ${injected.length
          ? html`<w3m-connect-injected-widget></w3m-connect-injected-widget>`
          : null}
        ${featured.length
          ? html`<w3m-connect-featured-widget></w3m-connect-featured-widget>`
          : null}
        ${custom?.length ? html`<w3m-connect-custom-widget></w3m-connect-custom-widget>` : null}
        ${coinbase ? html`<w3m-connect-coinbase-widget></w3m-connect-coinbase-widget>` : null}
        ${external.length
          ? html`<w3m-connect-external-widget></w3m-connect-external-widget>`
          : null}
        ${recommended.length
          ? html`<w3m-connect-recommended-widget></w3m-connect-recommended-widget>`
          : null}
      </wui-flex>
    `
  }

  private getConnectorsByType() {
    const { featured, recommended } = ApiController.state
    const { customWallets: custom } = OptionsController.state
    const recent = StorageUtil.getRecentWallets()

    const filteredRecommended = WalletUtil.filterOutDuplicateWallets(recommended)
    const filteredFeatured = WalletUtil.filterOutDuplicateWallets(featured)

    const multiChain = this.connectors.filter(connector => connector.type === 'MULTI_CHAIN')
    const announced = this.connectors.filter(connector => connector.type === 'ANNOUNCED')
    const injected = this.connectors.filter(connector => connector.type === 'INJECTED')
    const external = this.connectors.filter(connector => connector.type === 'EXTERNAL')
    const coinbase = this.connectors.find(
      connector => connector.id === ConstantsUtil.COINBASE_SDK_CONNECTOR_ID
    )
    const isEVM = ChainController.state.activeChain === CommonConstantsUtil.CHAIN.EVM
    const includeAnnouncedAndInjected = isEVM ? OptionsController.state.enableEIP6963 : true

    return {
      custom,
      recent,
      coinbase,
      external,
      multiChain,
      announced: includeAnnouncedAndInjected ? announced : [],
      injected: includeAnnouncedAndInjected ? injected : [],
      recommended: filteredRecommended,
      featured: filteredFeatured
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connector-list': W3mConnectorList
  }
}
