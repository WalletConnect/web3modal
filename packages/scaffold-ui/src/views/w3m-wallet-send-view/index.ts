import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'
import { SwapController, CoreHelperUtil, RouterController, SendController } from '@web3modal/core'
import { state } from 'lit/decorators.js'

@customElement('w3m-wallet-send-view')
export class W3mWalletSendView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private token = SendController.state.token

  @state() private sendTokenAmount = SendController.state.sendTokenAmount

  @state() private receiverAddress = SendController.state.receiverAddress

  @state() private receiverProfileName = SendController.state.receiverProfileName

  @state() private loading = SendController.state.loading

  @state() private gasPriceInUSD = SendController.state.gasPriceInUSD

  @state() private type = SendController.state.type

  @state() private message:
    | 'Preview Send'
    | 'Select Token'
    | 'Add Address'
    | 'Add Amount'
    | 'Insufficient Funds'
    | 'Incorrect Value'
    | 'Invalid Address' = 'Preview Send'

  public constructor() {
    super()
    this.fetchNetworkPrice()
    this.unsubscribe.push(
      ...[
        SendController.subscribe(val => {
          this.token = val.token
          this.sendTokenAmount = val.sendTokenAmount
          this.receiverAddress = val.receiverAddress
          this.gasPriceInUSD = val.gasPriceInUSD
          this.receiverProfileName = val.receiverProfileName
          this.loading = val.loading
        })
      ]
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    this.getMessage()

    const inputAddressComponent =
      this.type === 'Address'
        ? html`<w3m-input-address
        .value=${this.receiverProfileName ? this.receiverProfileName : this.receiverAddress}
      ></w3m-input-address>`
        : html`<w3m-input-placeholder></w3m-input-placeholder>`

    return html` <wui-flex flexDirection="column" .padding=${['0', 'l', 'l', 'l'] as const}>
      <wui-flex class="inputContainer" gap="xs" flexDirection="column">
        <w3m-input-token
          .token=${this.token}
          .sendTokenAmount=${this.sendTokenAmount}
          .gasPriceInUSD=${this.gasPriceInUSD}
        ></w3m-input-token>
        <wui-icon-box
          size="inherit"
          backgroundColor="fg-300"
          iconSize="lg"
          iconColor="fg-250"
          background="opaque"
          icon="arrowBottom"
        ></wui-icon-box>
        
        ${inputAddressComponent}
      </wui-flex>
      <wui-flex .margin=${['l', '0', '0', '0'] as const}>
        <wui-button
          @click=${this.onButtonClick.bind(this)}
          ?disabled=${!this.message.startsWith('Preview Send')}
          size="lg"
          variant="main"
          ?loading=${this.loading}
          fullWidth
        >
          ${this.message}
        </wui-button>
      </wui-flex>
    </wui-flex>`
  }

  // -- Private ------------------------------------------- //

  private async fetchNetworkPrice() {
    await SwapController.getNetworkTokenPrice()
    const gas = await SwapController.getInitialGasPrice()
    if (gas?.gasPrice && gas?.gasPriceInUSD) {
      SendController.setGasPrice(gas.gasPrice)
      SendController.setGasPriceInUsd(gas.gasPriceInUSD)
    }
  }

  private onButtonClick() {
    RouterController.push('WalletSendPreview')
  }

  private getMessage() {
    this.message = 'Preview Send'

    if (this.type === 'Address' && this.receiverAddress && !CoreHelperUtil.isAddress(this.receiverAddress)) {
      this.message = 'Invalid Address'
    }

    if (this.type === 'Address' && !this.receiverAddress) {
      this.message = 'Add Address'
    }

    if (
      this.sendTokenAmount &&
      this.token &&
      this.sendTokenAmount > Number(this.token.quantity.numeric)
    ) {
      this.message = 'Insufficient Funds'
    }

    if (!this.sendTokenAmount) {
      this.message = 'Add Amount'
    }

    if (this.sendTokenAmount && this.token?.price) {
      const value = this.sendTokenAmount * this.token.price
      if (!value) {
        this.message = 'Incorrect Value'
      }
    }

    if (!this.token) {
      this.message = 'Select Token'
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-wallet-send-view': W3mWalletSendView
  }
}
