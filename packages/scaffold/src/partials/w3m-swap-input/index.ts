import { html, LitElement } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { customElement } from '@web3modal/ui'
import styles from './styles.js'
import {
  AssetController,
  ModalController,
  OnRampController,
  type PaymentCurrency,
  type PurchaseCurrency
} from '@web3modal/core'

type Currency = {
  name: string
  symbol: string
}

@customElement('w3m-swap-input')
export class W3mInputCurrency extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @property({ type: String }) public type: 'Token' | 'Fiat' = 'Token'
  @property({ type: Number }) public value = 0
  @state() public currencies: Currency[] | null = []
  @state() public selectedCurrency = this.currencies?.[0]

  // -- Private ------------------------------------------- //
  @state() private currencyImages = AssetController.state.currencyImages
  @state() private tokenImages = AssetController.state.tokenImages

  public constructor() {
    super()
    this.unsubscribe.push(
      OnRampController.subscribeKey('purchaseCurrency', val => {
        if (!val || this.type === 'Fiat') {
          return
        }
        this.selectedCurrency = this.formatPurchaseCurrency(val)
      }),
      OnRampController.subscribeKey('paymentCurrency', val => {
        if (!val || this.type === 'Token') {
          return
        }
        this.selectedCurrency = this.formatPaymentCurrency(val)
      }),
      OnRampController.subscribe(val => {
        if (this.type === 'Fiat') {
          this.currencies = val.purchaseCurrencies.map(this.formatPurchaseCurrency)
        } else {
          this.currencies = val.paymentCurrencies.map(this.formatPaymentCurrency)
        }
      }),
      AssetController.subscribe(val => {
        this.currencyImages = { ...val.currencyImages }
        this.tokenImages = { ...val.tokenImages }
      })
    )
  }

  // -- Lifecycle ----------------------------------------- //
  public override firstUpdated() {
    OnRampController.getAvailableCurrencies()
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const symbol = this.selectedCurrency?.symbol || ''
    const image = this.currencyImages[symbol] || this.tokenImages[symbol]

    return html`<wui-input-text type="number" size="lg" value=${this.value}>
      ${this.selectedCurrency
        ? html` <wui-flex
            class="currency-container"
            justifyContent="space-between"
            alignItems="center"
            gap="xxs"
            @click=${() => ModalController.open({ view: `OnRamp${this.type}Select` })}
          >
            <wui-image src=${ifDefined(image)}></wui-image>
            <wui-text color="fg-100">${this.selectedCurrency.symbol}</wui-text>
          </wui-flex>`
        : html`<wui-loading-spinner></wui-loading-spinner>`}
    </wui-input-text>`
  }

  private formatPaymentCurrency(currency: PaymentCurrency) {
    return {
      name: currency.id,
      symbol: currency.id
    }
  }
  private formatPurchaseCurrency(currency: PurchaseCurrency) {
    return {
      name: currency.name,
      symbol: currency.symbol
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-swap-input': W3mInputCurrency
  }
}
