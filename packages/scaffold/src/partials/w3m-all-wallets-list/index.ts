import type { ApiWallet } from '@web3modal/core'
import {
  ApiController,
  AssetController,
  ConnectorController,
  RouterController
} from '@web3modal/core'
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { animate } from 'motion'
import styles from './styles.js'

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
        gridTemplateColumns="repeat(auto-fill, 76px)"
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
      await animate(gridEl, { opacity: [1, 0] }, { duration: 0.2 }).finished
      this.initial = false
      animate(gridEl, { opacity: [0, 1] }, { duration: 0.2 })
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
    const { walletImages } = AssetController.state
    const wallets = [...this.featured, ...this.recommended, ...this.wallets]

    return wallets.map(
      wallet => html`
        <wui-card-select
          imageSrc=${ifDefined(walletImages[wallet.image_id])}
          type="wallet"
          name=${wallet.name}
          @click=${() => this.onConnectWallet(wallet)}
        ></wui-card-select>
      `
    )
  }

  private paginationLoaderTemplate() {
    let walletAmountRow = 4

    if (window.innerWidth === 430) {
      walletAmountRow = 5
    } else if (window.innerWidth < 348) {
      walletAmountRow = 3
    }

    const { wallets, recommended, featured, count } = ApiController.state

    const currentWallets = wallets.length + recommended.length
    const minimumRows = Math.ceil(currentWallets / walletAmountRow)
    const loadingCount = minimumRows * walletAmountRow - currentWallets + walletAmountRow

    if (count === 0 || [...featured, ...wallets, ...recommended].length < count) {
      return this.shimmerTemplate(loadingCount, PAGINATOR_ID)
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

  private onConnectWallet(wallet: ApiWallet) {
    const { connectors } = ConnectorController.state
    const connector = connectors.find(({ explorerId }) => explorerId === wallet.id)
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
