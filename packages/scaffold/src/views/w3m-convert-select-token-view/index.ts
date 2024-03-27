import { customElement, interpolate } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'
import { RouterController, ConvertController } from '@web3modal/core'
import type {
  TokenInfo,
  TokenInfoWithBalance
} from '@web3modal/core/src/controllers/ConvertController.js'
import { state } from 'lit/decorators.js'

@customElement('w3m-convert-select-token-view')
export class W3mConvertSelectTokenView extends LitElement {
  public static override styles = styles

  private unsubscribe: ((() => void) | undefined)[] = []

  // -- State & Properties -------------------------------- //
  @state() private targetToken = RouterController.state.data?.target

  @state() private sourceToken = ConvertController.state.sourceToken

  @state() private toToken = ConvertController.state.toToken

  @state() private searchValue = ''

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()

    this.unsubscribe.push(
      ...[
        ConvertController.subscribe(newState => {
          this.sourceToken = newState.sourceToken
          this.toToken = newState.toToken
        })
      ]
    )
  }

  private onSelectToken(token: TokenInfo) {
    if (this.targetToken === 'sourceToken') {
      ConvertController.setSourceToken(token)
    } else {
      ConvertController.setToToken(token)
    }
    RouterController.goBack()
  }

  public override updated() {
    const suggestedTokensContainer = this.renderRoot?.querySelector('.suggested-tokens-container')
    suggestedTokensContainer?.addEventListener(
      'scroll',
      this.handleSuggestedTokensScroll.bind(this)
    )

    const tokensList = this.renderRoot?.querySelector('.tokens')
    tokensList?.addEventListener('scroll', this.handleTokenListScroll.bind(this))
  }

  public override disconnectedCallback() {
    super.disconnectedCallback()
    const suggestedTokensContainer = this.renderRoot?.querySelector('.suggested-tokens-container')
    const tokensList = this.renderRoot?.querySelector('.tokens')

    suggestedTokensContainer?.removeEventListener(
      'scroll',
      this.handleSuggestedTokensScroll.bind(this)
    )
    tokensList?.removeEventListener('scroll', this.handleTokenListScroll.bind(this))
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex flexDirection="column" gap="s">
        ${this.templateSearchInput()} ${this.templateSuggestedTokens()} ${this.templateTokens()}
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private templateSearchInput() {
    return html`
      <wui-flex class="search-input-container" gap="xs">
        <wui-input-text
          class="network-search-input"
          size="sm"
          placeholder="Search token"
          icon="search"
          .value=${this.searchValue}
          @inputChange=${this.onSearchInputChange.bind(this)}
        ></wui-input-text>
      </wui-flex>
    `
  }

  private templateTokens() {
    const yourTokens = ConvertController.state.myTokensWithBalance
      ? Object.values(ConvertController.state.myTokensWithBalance)
      : []
    const tokens = ConvertController.state.popularTokens
      ? Object.values(ConvertController.state.popularTokens)
      : []

    const filteredYourTokens: TokenInfoWithBalance[] = this.filterTokensWithText<
      TokenInfoWithBalance[]
    >(yourTokens, this.searchValue)
    const filteredTokens = this.filterTokensWithText<TokenInfo[]>(tokens, this.searchValue)

    return html`
      <wui-flex class="tokens-container">
        <wui-flex class="tokens" flexDirection="column">
          ${filteredYourTokens?.length > 0
            ? html`
                <wui-flex justifyContent="flex-start" padding="s">
                  <wui-text variant="paragraph-500" color="fg-200">Your tokens</wui-text>
                </wui-flex>
                ${filteredYourTokens.map(tokenInfo => {
                  const selected =
                    tokenInfo.symbol === this.sourceToken?.symbol ||
                    tokenInfo.symbol === this.toToken?.symbol

                  return html`
                    <wui-token-list-item
                      name=${tokenInfo.name}
                      ?disabled=${selected}
                      symbol=${tokenInfo.symbol}
                      price=${tokenInfo?.price}
                      amount=${tokenInfo?.balance}
                      imageSrc=${tokenInfo.logoURI}
                      @click=${() => {
                        if (!selected) {
                          this.onSelectToken(tokenInfo)
                        }
                      }}
                    >
                    </wui-token-list-item>
                  `
                })}
              `
            : null}

          <wui-flex justifyContent="flex-start" padding="s">
            <wui-text variant="paragraph-500" color="fg-200">Popular tokens</wui-text>
          </wui-flex>

          ${filteredTokens?.length > 0
            ? filteredTokens.map(
                tokenInfo => html`
                  <wui-token-list-item
                    name=${tokenInfo.name}
                    symbol=${tokenInfo.symbol}
                    imageSrc=${tokenInfo.logoURI}
                    @click=${() => this.onSelectToken(tokenInfo)}
                  >
                  </wui-token-list-item>
                `
              )
            : null}
        </wui-flex>
      </wui-flex>
    `
  }

  private templateSuggestedTokens() {
    const tokens = ConvertController.state.suggestedTokens
      ? Object.values(ConvertController.state.suggestedTokens).slice(0, 8)
      : null

    if (!tokens) {
      return null
    }

    return html`
      <wui-flex class="suggested-tokens-container" gap="xs">
        ${tokens.map(
          tokenInfo => html`
            <wui-token-button
              text=${tokenInfo.symbol}
              imageSrc=${tokenInfo.logoURI}
              @click=${() => this.onSelectToken(tokenInfo)}
            >
            </wui-token-button>
          `
        )}
      </wui-flex>
    `
  }

  private onSearchInputChange(event: CustomEvent<string>) {
    this.searchValue = event.detail
  }

  private handleSuggestedTokensScroll() {
    const container = this.renderRoot?.querySelector('.suggested-tokens-container') as
      | HTMLElement
      | undefined

    if (!container) {
      return
    }

    container.style.setProperty(
      '--suggested-tokens-scroll--left-opacity',
      interpolate([0, 100], [0, 1], container.scrollLeft).toString()
    )
    container.style.setProperty(
      '--suggested-tokens-scroll--right-opacity',
      interpolate(
        [0, 100],
        [0, 1],
        container.scrollWidth - container.scrollLeft - container.offsetWidth
      ).toString()
    )
  }

  private handleTokenListScroll() {
    const container = this.renderRoot?.querySelector('.tokens') as HTMLElement | undefined

    if (!container) {
      return
    }

    container.style.setProperty(
      '--tokens-scroll--top-opacity',
      interpolate([0, 100], [0, 1], container.scrollTop).toString()
    )
    container.style.setProperty(
      '--tokens-scroll--bottom-opacity',
      interpolate(
        [0, 100],
        [0, 1],
        container.scrollHeight - container.scrollTop - container.offsetHeight
      ).toString()
    )
  }

  private filterTokensWithText<T>(tokens: TokenInfo[], text: string) {
    return tokens.filter(token =>
      `${token.symbol} ${token.name} ${token.address}`.toLowerCase().includes(text.toLowerCase())
    ) as T
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-convert-select-token-view': W3mConvertSelectTokenView
  }
}
