import { PaymasterController, RouterUtil } from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import type { W3mFrameTypes } from '@web3modal/wallet'
import { css, html, LitElement } from 'lit'
import { state } from 'lit/decorators.js'

type PaymasterToken = W3mFrameTypes.Responses['FrameGetPaymasterTokensResponse'][number]

@customElement('w3m-paymaster-select-token-view')
export class W3mPaymasterSelectTokenView extends LitElement {
  static override styles = css`
    wui-token-list-item {
      width: 100%;
    }
  `

  private unsubscribe: ((() => void) | undefined)[] = []

  // -- State & Properties -------------------------------- //
  @state() private selectedToken = PaymasterController.state.selectedToken

  @state() private tokens = PaymasterController.state.tokens

  @state() private suggestedTokens = PaymasterController.state.suggestedTokens

  @state() private searchValue = ''

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()

    this.unsubscribe.push(
      ...[
        PaymasterController.subscribe(newState => {
          this.tokens = newState.tokens
          this.suggestedTokens = newState.suggestedTokens
          this.selectedToken = newState.selectedToken
        })
      ]
    )
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
  private onSelectToken(token: PaymasterToken) {
    PaymasterController.selectToken(token)
    RouterUtil.goBackOrCloseModal()
  }

  private onSearchInputChange(event: CustomEvent<string>) {
    this.searchValue = event.detail
    PaymasterController.searchTokens(this.searchValue)
  }

  private templateSearchInput() {
    return html`
      <wui-flex .padding=${['3xs', 's', '0', 's'] as const} gap="xs">
        <wui-search-bar
          placeholder="Search token"
          .value=${this.searchValue}
          @inputChange=${this.onSearchInputChange.bind(this)}
        ></wui-search-bar>
      </wui-flex>
    `
  }

  private templateTokens() {
    if (this.searchValue) {
      return null
    }

    return html`
      <wui-flex .padding=${['0', 's', 's', 's'] as const} flexDirection="column">
        <wui-flex .padding=${['0', '0', 'xs', 'xs'] as const}>
          <wui-text>Your tokens</wui-text>
        </wui-flex>
        ${this.renderTokens(this.tokens)}
      </wui-flex>
    `
  }

  private renderTokens(tokens: PaymasterToken[]) {
    return tokens.map(
      token => html`
        <wui-token-list-item
          ?checked=${this.selectedToken?.name === token.name}
          name=${token.name}
          imageSrc=${token.logoURI}
          symbol=${token.symbol}
          price=${token.amount}
          amount=${token.exchangeRate}
          @click=${() => this.onSelectToken(token)}
        >
        </wui-token-list-item>
      `
    )
  }

  private templateSuggestedTokens() {
    if (!this.searchValue) {
      return null
    }

    const tokens = this.suggestedTokens.length ? this.suggestedTokens.slice(0, 8) : null

    if (!tokens?.length) {
      return html`<wui-flex> No tokens found </wui-flex>`
    }

    return html`
      <wui-flex .padding=${['0', 's', 's', 's'] as const} flexDirection="column">
        ${this.renderTokens(tokens)}
      </wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-paymaster-select-token-view': W3mPaymasterSelectTokenView
  }
}
