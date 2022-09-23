import type { Listing } from '@web3modal/core'
import {
  ClientCtrl,
  ConnectModalCtrl,
  CoreHelpers,
  ExplorerCtrl,
  ModalToastCtrl
} from '@web3modal/core'
import { html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import '../../components/w3m-modal-content'
import '../../components/w3m-modal-header'
import '../../components/w3m-search-input'
import '../../components/w3m-spinner'
import '../../components/w3m-text'
import '../../components/w3m-wallet-button'
import { global } from '../../utils/Theme'
import {
  debounce,
  getErrorMessage,
  getShadowRootElement,
  preloadImage
} from '../../utils/UiHelpers'
import styles, { dynamicStyles } from './styles'

const PAGE_ENTRIES = 40

@customElement('w3m-wallet-explorer-view')
export class W3mWalletExplorerView extends LitElement {
  public static styles = [global, styles]

  // -- state & properties ------------------------------------------- //
  @state() private loading = !ExplorerCtrl.state.wallets.listings.length
  @state() private firstFetch = !ExplorerCtrl.state.wallets.listings.length
  @state() private search: string | undefined = undefined
  @state() private endReached = false

  // -- lifecycle ---------------------------------------------------- //
  public firstUpdated() {
    this.createPaginationObserver()
  }

  public disconnectedCallback() {
    this.intersectionObserver?.disconnect()
  }

  // -- private ------------------------------------------------------ //
  private get placeholderEl() {
    return getShadowRootElement(this, '.w3m-placeholder-block')
  }

  private intersectionObserver: IntersectionObserver | undefined = undefined

  private createPaginationObserver() {
    this.intersectionObserver = new IntersectionObserver(([element]) => {
      if (element.isIntersecting && !(this.search && this.firstFetch)) this.fetchWallets()
    })
    this.intersectionObserver.observe(this.placeholderEl)
  }

  private isLastPage() {
    const { wallets, search } = ExplorerCtrl.state
    const { listings, total } = this.search ? search : wallets

    return total <= PAGE_ENTRIES || listings.length >= total
  }

  private async fetchWallets() {
    const { wallets, search } = ExplorerCtrl.state
    const { listings, total, page } = this.search ? search : wallets

    if (!this.endReached && (this.firstFetch || (total > PAGE_ENTRIES && listings.length < total)))
      try {
        this.loading = true
        const { listings: newListings } = await ExplorerCtrl.getPaginatedWallets({
          page: this.firstFetch ? 1 : page + 1,
          entries: PAGE_ENTRIES,
          version: 1,
          device: CoreHelpers.isMobile() ? 'mobile' : 'desktop',
          search: this.search
        })
        const images = newListings.map(({ image_url }) => image_url.lg)
        await Promise.all([...images.map(async url => preloadImage(url)), CoreHelpers.wait(300)])
        this.endReached = this.isLastPage()
      } catch (err) {
        ModalToastCtrl.openToast(getErrorMessage(err), 'error')
      } finally {
        this.loading = false
        this.firstFetch = false
      }
  }

  private async onConnect(links: { native: string; universal?: string }, name: string) {
    const { native, universal } = links
    await ClientCtrl.ethereum().connectLinking(uri =>
      CoreHelpers.openHref(
        universal
          ? CoreHelpers.formatUniversalUrl(universal, uri, name)
          : CoreHelpers.formatNativeUrl(native, uri, name)
      )
    )
    ConnectModalCtrl.closeModal()
  }

  private async onConnectPlatform(listing: Listing) {
    if (CoreHelpers.isMobile()) await this.onConnect(listing.mobile, listing.name)
    else await this.onConnect(listing.desktop, listing.name)
  }

  private readonly searchDebounce = debounce((value: string) => {
    this.firstFetch = true
    this.endReached = false
    this.search = value
    ExplorerCtrl.resetSearch()
    this.fetchWallets()
  })

  private onSearchChange(event: Event) {
    const { value } = event.target as HTMLInputElement
    if (value.length >= 3) this.searchDebounce(value)
    else if (this.search) {
      this.search = undefined
      this.endReached = this.isLastPage()
      ExplorerCtrl.resetSearch()
    }
  }

  // -- render ------------------------------------------------------- //
  protected render() {
    const { wallets, search } = ExplorerCtrl.state
    const { listings } = this.search ? search : wallets
    const isEmpty = !this.loading && !listings.length
    const classes = {
      'w3m-loading': this.loading && !listings.length,
      'w3m-end-reached': this.endReached,
      'w3m-empty': isEmpty
    }

    return html`
      ${dynamicStyles()}

      <w3m-modal-header>
        <w3m-search-input .onChange=${this.onSearchChange.bind(this)}></w3m-search-input>
      </w3m-modal-header>

      <w3m-modal-content class=${classMap(classes)}>
        <div class="w3m-content">
          ${listings.map(
            listing => html`
              <w3m-wallet-button
                src=${listing.image_url.lg}
                name=${listing.name}
                .onClick=${async () => this.onConnectPlatform(listing)}
              >
              </w3m-wallet-button>
            `
          )}
        </div>
        <div class="w3m-placeholder-block">
          ${isEmpty
            ? html`<w3m-text variant="large-bold" color="secondary">No results found</w3m-text>`
            : html`<w3m-spinner></w3m-spinner>`}
        </div>
      </w3m-modal-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-wallet-explorer-view': W3mWalletExplorerView
  }
}
