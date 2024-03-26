import type { Connector, WcWallet } from '@web3modal/core'
import {
  ApiController,
  AssetUtil,
  ConnectionController,
  ConnectorController,
  ConstantsUtil,
  CoreHelperUtil,
  EventsController,
  OptionsController,
  RouterController,
  StorageUtil
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import styles from './styles.js'
@customElement('w3m-wallet-login-list')
export class W3mWalletLoginList extends LitElement {
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
      <wui-flex flexDirection="column" gap="xs">
        ${this.walletConnectConnectorTemplate()} ${this.recentTemplate()}
        ${this.announcedTemplate()} ${this.injectedTemplate()} ${this.featuredTemplate()}
        ${this.customTemplate()} ${this.recommendedTemplate()} ${this.externalTemplate()}
        ${this.allWalletsTemplate()}
      </wui-flex>
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
        data-testid="wallet-selector-walletconnect"
      >
      </wui-list-wallet>
    `
  }

  private customTemplate() {
    const { customWallets } = OptionsController.state

    if (!customWallets?.length) {
      return null
    }

    const wallets = this.filterOutDuplicateWallets(customWallets)

    return wallets.map(
      wallet => html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getWalletImage(wallet))}
          name=${wallet.name ?? 'Unknown'}
          @click=${() => this.onConnectWallet(wallet)}
        >
        </wui-list-wallet>
      `
    )
  }

  private featuredTemplate() {
    const connector = this.connectors.find(c => c.type === 'WALLET_CONNECT')
    if (!connector) {
      return null
    }
    const { featured } = ApiController.state
    if (!featured.length) {
      return null
    }
    const wallets = this.filterOutDuplicateWallets(featured)

    return wallets.map(
      wallet => html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getWalletImage(wallet))}
          name=${wallet.name ?? 'Unknown'}
          @click=${() => this.onConnectWallet(wallet)}
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
          @click=${() => this.onConnectWallet(wallet)}
          tagLabel="recent"
          tagVariant="shade"
        >
        </wui-list-wallet>
      `
    )
  }

  private announcedTemplate() {
    return this.connectors.map(connector => {
      if (connector.type !== 'ANNOUNCED') {
        return null
      }

      return html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getConnectorImage(connector))}
          name=${connector.name ?? 'Unknown'}
          @click=${() => this.onConnector(connector)}
          tagVariant="success"
          .installed=${true}
        >
        </wui-list-wallet>
      `
    })
  }

  private injectedTemplate() {
    return this.connectors.map(connector => {
      if (connector.type !== 'INJECTED') {
        return null
      }

      if (!ConnectionController.checkInstalled()) {
        return null
      }

      return html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getConnectorImage(connector))}
          .installed=${true}
          name=${connector.name ?? 'Unknown'}
          @click=${() => this.onConnector(connector)}
        >
        </wui-list-wallet>
      `
    })
  }

  private externalTemplate() {
    const announcedRdns = ConnectorController.getAnnouncedConnectorRdns()

    return this.connectors.map(connector => {
      if (['WALLET_CONNECT', 'INJECTED', 'ANNOUNCED', 'AUTH'].includes(connector.type)) {
        return null
      }

      if (announcedRdns.includes(ConstantsUtil.CONNECTOR_RDNS_MAP[connector.id])) {
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
    const connector = this.connectors.find(c => c.type === 'WALLET_CONNECT')
    const { allWallets } = OptionsController.state

    if (!connector || allWallets === 'HIDE') {
      return null
    }

    if (allWallets === 'ONLY_MOBILE' && !CoreHelperUtil.isMobile()) {
      return null
    }

    const count = ApiController.state.count
    const featuredCount = ApiController.state.featured.length
    const rawCount = count + featuredCount
    const roundedCount = rawCount < 10 ? rawCount : Math.floor(rawCount / 10) * 10
    const tagLabel = roundedCount < rawCount ? `${roundedCount}+` : `${roundedCount}`

    return html`
      <wui-list-wallet
        name="All Wallets"
        walletIcon="allWallets"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${tagLabel}
        tagVariant="shade"
        data-testid="all-wallets"
      ></wui-list-wallet>
    `
  }

  private recommendedTemplate() {
    const connector = this.connectors.find(c => c.type === 'WALLET_CONNECT')
    if (!connector) {
      return null
    }
    const { recommended } = ApiController.state
    const { customWallets, featuredWalletIds } = OptionsController.state
    const { connectors } = ConnectorController.state
    const recent = StorageUtil.getRecentWallets()
    const injected = connectors.filter(c => c.type === 'INJECTED')
    const filteredInjected = injected.filter(i => i.name !== 'Browser Wallet')

    if (featuredWalletIds || customWallets || !recommended.length) {
      return null
    }

    const overrideLength = filteredInjected.length + recent.length

    const maxRecommended = Math.max(0, 2 - overrideLength)

    const wallets = this.filterOutDuplicateWallets(recommended).slice(0, maxRecommended)

    return wallets.map(
      wallet => html`
        <wui-list-wallet
          imageSrc=${ifDefined(AssetUtil.getWalletImage(wallet))}
          name=${wallet?.name ?? 'Unknown'}
          @click=${() => this.onConnectWallet(wallet)}
        >
        </wui-list-wallet>
      `
    )
  }

  // -- Private Methods ----------------------------------- //
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

  private filterOutDuplicateWallets(wallets: WcWallet[]) {
    const recent = StorageUtil.getRecentWallets()
    const recentIds = recent.map(wallet => wallet.id)
    const filtered = wallets.filter(wallet => !recentIds.includes(wallet.id))

    return filtered
  }

  private onAllWallets() {
    EventsController.sendEvent({ type: 'track', event: 'CLICK_ALL_WALLETS' })
    RouterController.push('AllWallets')
  }

  private onConnectWallet(wallet: WcWallet) {
    RouterController.push('ConnectingWalletConnect', { wallet })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-wallet-login-list': W3mWalletLoginList
  }
}
