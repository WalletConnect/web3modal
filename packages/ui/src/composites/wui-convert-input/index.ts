import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { customElement } from '../../utils/WebComponentsUtil.js'
import { resetStyles } from '../../utils/ThemeUtil.js'
import '../../components/wui-text/index.js'
import '../wui-transaction-visual/index.js'
import { EventsController, RouterController } from '@web3modal/core'
import styles from './styles.js'
import { formatNumberToLocalString } from '../../utils/NumberUtil.js'
import { NumberUtil } from '@web3modal/common'

const MINIMUM_USD_VALUE_TO_CONVERT = 0.00005

type Target = 'sourceToken' | 'toToken'

interface TokenInfo {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
  logoURI: string
  domainVersion?: string
  eip2612?: boolean
  isFoT?: boolean
  tags?: string[]
}

@customElement('wui-convert-input')
export class WuiConvertInput extends LitElement {
  public static override styles = [resetStyles, styles]

  // -- State & Properties -------------------------------- //
  @property() public focused = false

  @property() public balance: string | undefined

  @property() public value?: string

  @property() public price = 0

  @property() public marketValue?: string = '$1.0345,00'

  @property() public disabled?: boolean

  @property() public target: Target = 'sourceToken'

  @property() public token?: TokenInfo

  @property() public onSetAmount: ((target: Target, value: string) => void) | null = null

  @property() public onSetMaxValue: ((target: Target, balance: string | undefined) => void) | null =
    null

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex class="${this.focused ? 'focus' : ''}" justifyContent="space-between">
        <wui-flex
          flex="1"
          flexDirection="column"
          alignItems="flex-start"
          justifyContent="center"
          class="swap-input"
        >
          <input
            @focusin=${() => this.onFocusChange(true)}
            @focusout=${() => this.onFocusChange(false)}
            ?disabled=${this.disabled}
            .value=${this.value}
            @input=${this.dispatchInputChangeEvent}
            @keydown=${this.handleKeydown}
            placeholder="0"
          />
          <wui-text class="market-value" variant="small-400" color="fg-200">
            ${this.marketValue ? `$${this.marketValue}` : ''}
          </wui-text>
        </wui-flex>
        ${this.templateTokenSelectButton()}
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private handleKeydown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Meta',
      'Ctrl',
      'a',
      'c',
      'v',
      'ArrowLeft',
      'ArrowRight',
      'Tab'
    ]
    const isComma = event.key === ','
    const isDot = event.key === '.'
    const isNumericKey = event.key >= '0' && event.key <= '9'
    const currentValue = this.value

    if (!isNumericKey && !allowedKeys.includes(event.key) && !isDot && !isComma) {
      event.preventDefault()
    }

    if (isComma || isDot) {
      if (currentValue?.includes('.') || currentValue?.includes(',')) {
        event.preventDefault()
      }
    }
  }

  private dispatchInputChangeEvent(event: InputEvent) {
    if (!this.onSetAmount) {
      return
    }

    const value = (event.target as HTMLInputElement).value
    if (value === ',' || value === '.') {
      this.onSetAmount(this.target, '0.')
    } else if (value.endsWith(',')) {
      this.onSetAmount(this.target, value.replace(',', '.'))
    } else {
      this.onSetAmount(this.target, value)
    }
  }

  private setMaxValueToInput() {
    this.onSetMaxValue?.(this.target, this.balance)
  }

  private templateTokenSelectButton() {
    if (!this.token) {
      return html` <wui-button size="md" variant="accentBg" @click=${this.onSelectToken.bind(this)}>
        Select token
      </wui-button>`
    }

    const tokenElement = this.token.logoURI
      ? html`<wui-image src=${this.token.logoURI}></wui-image>`
      : html`
          <wui-icon-box
            size="sm"
            iconColor="fg-200"
            backgroundColor="fg-300"
            icon="networkPlaceholder"
          ></wui-icon-box>
        `

    return html`
      <wui-flex flexDirection="column" alignItems="flex-end" justifyContent="center" gap="xxs">
        <button
          size="sm"
          variant="shade"
          class="token-select-button"
          @click=${this.onSelectToken.bind(this)}
        >
          ${tokenElement}
          <wui-text variant="paragraph-600" color="fg-100">${this.token.symbol}</wui-text>
        </button>
        <wui-flex alignItems="center" gap="xxs"> ${this.tokenBalanceTemplate()} </wui-flex>
      </wui-flex>
    `
  }

  private tokenBalanceTemplate() {
    const balanceValueInUSD = NumberUtil.multiply(this.balance, this.price)
    const haveBalance = balanceValueInUSD
      ? balanceValueInUSD?.isGreaterThan(MINIMUM_USD_VALUE_TO_CONVERT)
      : false

    return html`
      ${haveBalance
        ? html`<wui-text variant="small-400" color="fg-200">
            ${formatNumberToLocalString(this.balance, 3)}
          </wui-text>`
        : null}
      ${this.target === 'sourceToken' ? this.tokenActionButtonTemplate(haveBalance) : null}
    `
  }

  private tokenActionButtonTemplate(_haveBalance: boolean) {
    if (_haveBalance) {
      return html` <button class="max-value-button" @click=${this.setMaxValueToInput.bind(this)}>
        <wui-text color="accent-100" variant="small-600">Max</wui-text>
      </button>`
    }

    return html` <button class="max-value-button" @click=${this.onBuyToken.bind(this)}>
      <wui-text color="accent-100" variant="small-600">Buy</wui-text>
    </button>`
  }

  private onFocusChange(state: boolean) {
    this.focused = state
  }

  private onSelectToken() {
    EventsController.sendEvent({ type: 'track', event: 'CLICK_SELECT_TOKEN_TO_SWAP' })
    RouterController.push('ConvertSelectToken', {
      target: this.target
    })
  }

  private onBuyToken() {
    RouterController.push('OnRampProviders')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wui-convert-input': WuiConvertInput
  }
}
