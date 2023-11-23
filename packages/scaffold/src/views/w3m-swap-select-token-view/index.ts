import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'
import { ConnectionController, RouterController, SwapApiController } from '@web3modal/core'
import type { TokenInfo } from '@web3modal/core/src/controllers/SwapApiController.js'
import { state } from 'lit/decorators.js'

@customElement('w3m-swap-select-token-view')
export class W3mSwapSelectTokenView extends LitElement {
  public static override styles = styles

  @state() private targetToken = RouterController.state.data?.target

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()
  }

  private onSelectToken(token: TokenInfo) {
    if (this.targetToken === 'sourceToken') {
      SwapApiController.setSourceToken(token)
    } else {
      SwapApiController.setToToken(token)
    }
    SwapApiController.getTokenSwapInfo()
    RouterController.goBack()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex flexDirection="column" padding="s">
        ${this.templateSearchInput()} ${this.templateListTokens()}
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private templateSearchInput() {
    return html`
      <wui-flex gap="xs">
        <wui-input-text size="sm" placeholder="Search token" icon="search"></wui-input-text>
      </wui-flex>
    `
  }

  private templateListTokens() {
    return html`
      <wui-flex class="token-list" flexDirection="column">
        <wui-flex justifyContent="flex-start" padding="s">
          <wui-text variant="paragraph-500" color="fg-200">Your tokens</wui-text>
        </wui-flex>
        <wui-flex flexDirection="column" gap="1xs">
          ${SwapApiController.state.myTokensWithBalance &&
          Object.values(SwapApiController.state.myTokensWithBalance).map(
            tokenInfo => html`
              <wui-token-list-item
                name=${tokenInfo.name}
                symbol=${tokenInfo.symbol}
                price=${0}
                amount=${ConnectionController.formatUnits(
                  BigInt(tokenInfo.balance),
                  tokenInfo.decimals
                )}
                imageSrc=${tokenInfo.logoURI}
                @click=${() => this.onSelectToken(tokenInfo)}
              >
              </wui-token-list-item>
            `
          )}
        </wui-flex>
        <wui-flex justifyContent="flex-start" padding="s">
          <wui-text variant="paragraph-500" color="fg-200">Popular tokens</wui-text>
        </wui-flex>
        <wui-flex flexDirection="column" gap="1xs">
          ${SwapApiController.state.tokens &&
          Object.values(SwapApiController.state.tokens).map(
            tokenInfo => html`
              <wui-token-list-item
                name=${tokenInfo.name}
                symbol=${tokenInfo.symbol}
                price=${0}
                amount=${0}
                imageSrc=${tokenInfo.logoURI}
                @click=${() => this.onSelectToken(tokenInfo)}
              >
              </wui-token-list-item>
            `
          )}
        </wui-flex>
      </wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-swap-select-token-view': W3mSwapSelectTokenView
  }
}
