import type { WcWallet } from '@web3modal/core'
import {
  ApiController,
  AssetUtil,
  ConnectorController,
  OptionsController,
  RouterController
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import styles from './styles.js'
import { markWalletsAsInstalled } from '../../utils/markWalletsAsInstalled.js'
import { filterWalletsWithUniversalLink } from '../../utils/filterWalletsWithUniversalLink.js'

// -- Helpers --------------------------------------------- //
const PAGINATOR_ID = 'local-paginator'

@customElement('w3m-all-wallets-list')
export class W3mAllWalletsList extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  private paginationObserver?: IntersectionObserver = undefined

  // -- State & Properties -------------------------------- //
  @state() private initial = !ApiController.state.wallets.length

  @state() private wallets = ApiController.state.wallets

  @state() private recommended = ApiController.state.recommended

  @state() private featured = ApiController.state.featured

  public constructor() {
    super()
    this.unsubscribe.push(
      ...[
        ApiController.subscribeKey('wallets', val => (this.wallets = val)),
        ApiController.subscribeKey('recommended', val => (this.recommended = val)),
        ApiController.subscribeKey('featured', val => (this.featured = val))
      ]
    )
  }

  public override firstUpdated() {
    this.initialFetch()
    this.createPaginationObserver()
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
    this.paginationObserver?.disconnect()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-grid
        data-scroll=${!this.initial}
        .padding=${['0', 's', 's', 's'] as const}
        columnGap="xxs"
        rowGap="l"
        justifyContent="space-between"
      >
        ${this.initial ? this.shimmerTemplate(16) : this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `
  }

  // Private Methods ------------------------------------- //
  private async initialFetch() {
    const gridEl = this.shadowRoot?.querySelector('wui-grid')
    if (this.initial && gridEl) {
      await ApiController.fetchWallets({ page: 1 })
      await gridEl.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      }).finished
      this.initial = false
      gridEl.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
      })
    }
  }

  private shimmerTemplate(items: number, id?: string) {
    return [...Array(items)].map(
      () => html`
        <wui-card-select-loader type="wallet" id=${ifDefined(id)}></wui-card-select-loader>
      `
    )
  }

  private walletsTemplate() {
    let wallets = [...this.featured, ...this.recommended, ...this.wallets]
    if (OptionsController.state.enableUniversalLinks) {
      wallets = filterWalletsWithUniversalLink(wallets)
    }
    const walletsWithInstalled = markWalletsAsInstalled(wallets)

    return walletsWithInstalled.map(
      wallet => html`
        <wui-card-select
          imageSrc=${ifDefined(AssetUtil.getWalletImage(wallet))}
          type="wallet"
          name=${wallet.name}
          @click=${() => this.onConnectWallet(wallet)}
          .installed=${wallet.installed}
        ></wui-card-select>
      `
    )
  }

  private paginationLoaderTemplate() {
    const { wallets, recommended, featured, count } = ApiController.state
    const columns = window.innerWidth < 352 ? 3 : 4
    const currentWallets = wallets.length + recommended.length
    const minimumRows = Math.ceil(currentWallets / columns)
    let shimmerCount = minimumRows * columns - currentWallets + columns
    shimmerCount -= wallets.length ? featured.length % columns : 0

    if (count === 0 && featured.length > 0) {
      return null
    }

    if (count === 0 || [...featured, ...wallets, ...recommended].length < count) {
      return this.shimmerTemplate(shimmerCount, PAGINATOR_ID)
    }

    return null
  }

  private createPaginationObserver() {
    const loaderEl = this.shadowRoot?.querySelector(`#${PAGINATOR_ID}`)
    if (loaderEl) {
      this.paginationObserver = new IntersectionObserver(([element]) => {
        if (element?.isIntersecting && !this.initial) {
          const { page, count, wallets } = ApiController.state
          if (wallets.length < count) {
            ApiController.fetchWallets({ page: page + 1 })
          }
        }
      })
      this.paginationObserver.observe(loaderEl)
    }
  }

  private onConnectWallet(wallet: WcWallet) {
    const connector = ConnectorController.getConnector(wallet.id, wallet.rdns)
    if (connector) {
      RouterController.push('ConnectingExternal', { connector })
    } else {
      RouterController.push('ConnectingWalletConnect', { wallet })
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-all-wallets-list': W3mAllWalletsList
  }
}
