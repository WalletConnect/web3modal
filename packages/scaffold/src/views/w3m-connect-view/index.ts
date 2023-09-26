import type { Connector, WcWallet } from '@web3modal/core'
import {
  ApiController,
  AssetUtil,
  ConnectionController,
  ConnectorController,
  CoreHelperUtil,
  OptionsController,
  RouterController,
  StorageUtil
} from '@web3modal/core'
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import styles from './styles.js'

@customElement('w3m-connect-view')
export class W3mConnectView extends LitElement {
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
    return html`
      <wui-flex flexDirection="column" padding="s" gap="xs">
        ${this.walletConnectConnectorTemplate()} ${this.recentTemplate()}
        ${this.announcedTemplate()} ${this.injectedTemplate()} ${this.featuredTemplate()}
        ${this.customTemplate()} ${this.recommendedTemplate()} ${this.connectorsTemplate()}
        ${this.allWalletsTemplate()}
      </wui-flex>
      <w3m-legal-footer></w3m-legal-footer>
    `
  }

  // -- Private ------------------------------------------- //
  private walletConnectConnectorTemplate() {
    if (CoreHelperUtil.isMobile()) {
      return null
    }
    const connector = this.connectors.find(c => c.type === 'WALLET_CONNECT')
    if (!connector) {
      return null
    }

    return html`
      <wui-list-wallet
        imageSrc=${ifDefined(AssetUtil.getConnectorImage(connector))}
        name=${connector.name ?? 'Unknown'}
        @click=${() => this.onConnector(connector)}
        tagLabel="qr code"
        tagVariant="main"
      >
      </wui-list-wallet>
    `
  }

  private customTemplate() {
    const { customWallets } = OptionsController.state
    if (!customWallets?.length) {
      return null
    }
    const wallets = this.filterOutRecentWallets(customWallets)

    return wallets.map(
      wallet => html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getWalletImage(wallet))}
          name=${wallet.name ?? 'Unknown'}
          @click=${() => RouterController.push('ConnectingWalletConnect', { wallet })}
        >
        </wui-list-wallet>
      `
    )
  }

  private featuredTemplate() {
    const { featured } = ApiController.state
    if (!featured.length) {
      return null
    }
    const wallets = this.filterOutRecentWallets(featured)

    return wallets.map(
      wallet => html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getWalletImage(wallet))}
          name=${wallet.name ?? 'Unknown'}
          @click=${() => RouterController.push('ConnectingWalletConnect', { wallet })}
        >
        </wui-list-wallet>
      `
    )
  }

  private recentTemplate() {
    const recent = StorageUtil.getRecentWallets()

    return recent.map(
      wallet => html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getWalletImage(wallet))}
          name=${wallet.name ?? 'Unknown'}
          @click=${() => RouterController.push('ConnectingWalletConnect', { wallet })}
          tagLabel="recent"
          tagVariant="shade"
        >
        </wui-list-wallet>
      `
    )
  }

  private announcedTemplate() {
    return this.connectors.map(connector => {
      if (connector.type !== 'EIP6963') {
        return null
      }

      return html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getConnectorImage(connector))}
          name=${connector.name ?? 'Unknown'}
          @click=${() => this.onConnector(connector)}
          tagLabel="installed"
          tagVariant="success"
        >
        </wui-list-wallet>
      `
    })
  }

  private injectedTemplate() {
    const announced = this.connectors.find(c => c.type === 'EIP6963')

    return this.connectors.map(connector => {
      if (connector.type !== 'INJECTED') {
        return null
      }
      if (!ConnectionController.checkInjectedInstalled()) {
        return null
      }

      return html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getConnectorImage(connector))}
          name=${connector.name ?? 'Unknown'}
          @click=${() => this.onConnector(connector)}
          tagLabel=${ifDefined(announced ? undefined : 'installed')}
          tagVariant=${ifDefined(announced ? undefined : 'success')}
        >
        </wui-list-wallet>
      `
    })
  }

  private connectorsTemplate() {
    return this.connectors.map(connector => {
      if (['WALLET_CONNECT', 'INJECTED', 'EIP6963'].includes(connector.type)) {
        return null
      }

      return html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getConnectorImage(connector))}
          name=${connector.name ?? 'Unknown'}
          @click=${() => this.onConnector(connector)}
        >
        </wui-list-wallet>
      `
    })
  }

  private allWalletsTemplate() {
    const roundedCount = Math.floor(ApiController.state.count / 10) * 10

    return html`
      <wui-list-wallet
        name="All Wallets"
        walletIcon="allWallets"
        showAllWallets
        @click=${() => RouterController.push('AllWallets')}
        tagLabel=${`${roundedCount}+`}
        tagVariant="shade"
      ></wui-list-wallet>
    `
  }

  private recommendedTemplate() {
    const { recommended, featured } = ApiController.state
    const { customWallets } = OptionsController.state
    const { connectors } = ConnectorController.state
    const recent = StorageUtil.getRecentWallets()
    const eip6963 = connectors.filter(c => c.type === 'EIP6963')
    if (!recommended.length) {
      return null
    }
    const featuredLength = featured?.length ?? 0
    const customLength = customWallets?.length ?? 0
    const overrideLength = featuredLength + customLength + eip6963.length + recent.length
    const maxRecommended = Math.max(0, 2 - overrideLength)
    const wallets = this.filterOutRecentWallets(recommended).slice(0, maxRecommended)

    return wallets.map(
      wallet => html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getWalletImage(wallet))}
          name=${wallet?.name ?? 'Unknown'}
          @click=${() => RouterController.push('ConnectingWalletConnect', { wallet })}
        >
        </wui-list-wallet>
      `
    )
  }

  private onConnector(connector: Connector) {
    if (connector.type === 'WALLET_CONNECT') {
      if (CoreHelperUtil.isMobile()) {
        RouterController.push('AllWallets')
      } else {
        RouterController.push('ConnectingWalletConnect')
      }
    } else {
      RouterController.push('ConnectingExternal', { connector })
    }
  }

  private filterOutRecentWallets(wallets: WcWallet[]) {
    const recent = StorageUtil.getRecentWallets()
    const recentIds = recent.map(wallet => wallet.id)
    const filtered = wallets.filter(wallet => !recentIds.includes(wallet.id))

    return filtered
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connect-view': W3mConnectView
  }
}
