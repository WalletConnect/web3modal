import { customElement, formatNumberToLocalString } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import styles from './styles.js'
import {
  AccountController,
  NetworkController,
  RouterController,
  ConvertController
} from '@web3modal/core'
import { state } from 'lit/decorators.js'

@customElement('w3m-convert-preview-view')
export class W3mConvertPreviewView extends LitElement {
  public static override styles = styles

  private unsubscribe: ((() => void) | undefined)[] = []

  // -- State & Properties -------------------------------- //
  @state() private detailsOpen = true

  @state() private approvalTransaction = ConvertController.state.approvalTransaction

  @state() private convertTransaction = ConvertController.state.convertTransaction

  @state() private sourceToken = ConvertController.state.sourceToken

  @state() private sourceTokenAmount = ConvertController.state.sourceTokenAmount ?? ''

  @state() private sourceTokenPriceInUSD = ConvertController.state.sourceTokenPriceInUSD

  @state() private toToken = ConvertController.state.toToken

  @state() private toTokenAmount = ConvertController.state.toTokenAmount ?? ''

  @state() private toTokenPriceInUSD = ConvertController.state.toTokenPriceInUSD

  @state() private caipNetwork = NetworkController.state.caipNetwork

  @state() private transactionLoading = ConvertController.state.transactionLoading

  @state() private balanceSymbol = AccountController.state.balanceSymbol

  @state() private gasPriceInUSD = ConvertController.state.gasPriceInUSD

  @state() private priceImpact = ConvertController.state.priceImpact

  @state() private maxSlippage = ConvertController.state.maxSlippage

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()

    this.unsubscribe.push(
      ...[
        AccountController.subscribeKey('balanceSymbol', newBalanceSymbol => {
          if (this.balanceSymbol !== newBalanceSymbol) {
            RouterController.goBack()
            // Maybe reset state as well?
          }
        }),
        NetworkController.subscribeKey('caipNetwork', newCaipNetwork => {
          if (this.caipNetwork !== newCaipNetwork) {
            this.caipNetwork = newCaipNetwork
          }
        }),
        ConvertController.subscribe(newState => {
          this.approvalTransaction = newState.approvalTransaction
          this.convertTransaction = newState.convertTransaction
          this.sourceToken = newState.sourceToken
          this.gasPriceInUSD = newState.gasPriceInUSD
          this.toToken = newState.toToken
          this.transactionLoading = newState.transactionLoading
          this.gasPriceInUSD = newState.gasPriceInUSD
          this.transactionLoading = newState.transactionLoading
          this.toTokenPriceInUSD = newState.toTokenPriceInUSD
          this.sourceTokenAmount = newState.sourceTokenAmount ?? ''
          this.toTokenAmount = newState.toTokenAmount ?? ''
          this.priceImpact = newState.priceImpact
          this.maxSlippage = newState.maxSlippage
        })
      ]
    )
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex flexDirection="column" padding="l" gap="s">${this.templateSwap()}</wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private templateSwap() {
    const sourceTokenText = `${formatNumberToLocalString(parseFloat(this.sourceTokenAmount))} ${this
      .sourceToken?.symbol}`
    const toTokenText = `${formatNumberToLocalString(parseFloat(this.toTokenAmount))} ${this.toToken
      ?.symbol}`

    const sourceTokenValue = parseFloat(this.sourceTokenAmount) * this.sourceTokenPriceInUSD
    const toTokenValue =
      parseFloat(this.toTokenAmount) * this.toTokenPriceInUSD - (this.gasPriceInUSD || 0)
    const sentPrice = formatNumberToLocalString(sourceTokenValue)
    const receivePrice = formatNumberToLocalString(toTokenValue)

    return html`
      <wui-flex flexDirection="column" alignItems="center" gap="l">
        <wui-flex class="preview-container" flexDirection="column" alignItems="flex-start" gap="l">
          <wui-flex
            class="preview-token-details-container"
            alignItems="center"
            justifyContent="space-between"
            gap="l"
          >
            <wui-flex flexDirection="column" alignItems="flex-start" gap="4xs">
              <wui-text variant="small-400" color="fg-150">Send</wui-text>
              <wui-text variant="paragraph-400" color="fg-100">$${sentPrice}</wui-text>
            </wui-flex>
            <wui-token-button
              flexDirection="row-reverse"
              text=${sourceTokenText}
              imageSrc=${this.sourceToken?.logoURI}
            >
            </wui-token-button>
          </wui-flex>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M8.30713 0.292893C8.69766 0.683417 8.69766 1.31658 8.30713 1.70711L6.41424 3.6H11.3404C13.8369 3.6 16.0533 5.1975 16.8427 7.56588L16.9487 7.88377C17.1234 8.40772 16.8402 8.97404 16.3163 9.14868C15.7923 9.32333 15.226 9.04017 15.0513 8.51623L14.9454 8.19834C14.4281 6.64664 12.976 5.6 11.3404 5.6H6.41424L8.30713 7.49289C8.69766 7.88342 8.69766 8.51658 8.30713 8.90711C7.91661 9.29763 7.28344 9.29763 6.89292 8.90711L3.29292 5.30711C2.9024 4.91658 2.9024 4.28342 3.29292 3.89289L6.89292 0.292893C7.28344 -0.0976311 7.91661 -0.0976311 8.30713 0.292893ZM3.6838 10.8513C4.20774 10.6767 4.77406 10.9598 4.94871 11.4838L5.05467 11.8017C5.57191 13.3534 7.02404 14.4 8.65967 14.4L13.5858 14.4L11.6929 12.5071C11.3024 12.1166 11.3024 11.4834 11.6929 11.0929C12.0834 10.7024 12.7166 10.7024 13.1071 11.0929L16.7071 14.6929C17.0977 15.0834 17.0977 15.7166 16.7071 16.1071L13.1071 19.7071C12.7166 20.0976 12.0834 20.0976 11.6929 19.7071C11.3024 19.3166 11.3024 18.6834 11.6929 18.2929L13.5858 16.4L8.65967 16.4C6.16317 16.4 3.94677 14.8025 3.15731 12.4341L3.05134 12.1162C2.8767 11.5923 3.15986 11.026 3.6838 10.8513Z"
              fill="#788181"
            />
          </svg>

          <wui-flex
            class="preview-token-details-container"
            alignItems="center"
            justifyContent="space-between"
            gap="l"
          >
            <wui-flex flexDirection="column" alignItems="flex-start" gap="4xs">
              <wui-text variant="small-400" color="fg-150">Receive</wui-text>
              <wui-text variant="paragraph-400" color="fg-100">$${receivePrice}</wui-text>
            </wui-flex>
            <wui-token-button
              flexDirection="row-reverse"
              text=${toTokenText}
              imageSrc=${this.toToken?.logoURI}
            >
            </wui-token-button>
          </wui-flex>
        </wui-flex>

        ${this.templateDetails()}

        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="xs">
          <wui-icon size="sm" color="fg-200" name="infoCircle"></wui-icon>
          <wui-text variant="small-400" color="fg-200">Review transaction carefully</wui-text>
        </wui-flex>

        <wui-flex
          class="action-buttons-container"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          gap="xs"
        >
          <button
            class="cancel-button"
            ?disabled=${this.transactionLoading}
            @click=${this.onCancelTransaction.bind(this)}
          >
            <wui-text variant="paragraph-600" color="fg-200">Cancel</wui-text>
          </button>
          <button
            class="convert-button"
            ?disabled=${this.transactionLoading}
            @click=${this.onSendTransaction.bind(this)}
          >
            ${this.transactionLoading
              ? html`<wui-loading-spinner color="inverse-100"></wui-loading-spinner>`
              : html`<wui-text variant="paragraph-600" color="inverse-100"
                  >${this.actionButtonLabel()}</wui-text
                >`}
          </button>
        </wui-flex>
      </wui-flex>
    `
  }

  private templateDetails() {
    const toTokenConvertedAmount =
      this.sourceTokenPriceInUSD && this.toTokenPriceInUSD
        ? (1 / this.toTokenPriceInUSD) * this.sourceTokenPriceInUSD
        : 0

    return html`
      <wui-convert-details
        detailsOpen=${this.detailsOpen}
        sourceTokenSymbol=${this.sourceToken?.symbol}
        sourceTokenPrice=${this.sourceTokenPriceInUSD}
        toTokenSymbol=${this.toToken?.symbol}
        toTokenConvertedAmount=${toTokenConvertedAmount}
        gasPriceInUSD=${formatNumberToLocalString(this.gasPriceInUSD, 3)}
        .priceImpact=${this.priceImpact}
        slippageRate=${0.5}
        .maxSlippage=${this.maxSlippage}
      ></wui-convert-details>
    `
  }

  private actionButtonLabel(): string {
    if (this.approvalTransaction) {
      return 'Approve'
    }

    return 'Convert'
  }

  private onCancelTransaction() {
    RouterController.goBack()
  }

  private onSendTransaction() {
    if (this.approvalTransaction) {
      ConvertController.sendTransactionForApproval(this.approvalTransaction)
    } else {
      ConvertController.sendTransactionForConvert(this.convertTransaction)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-convert-preview-view': W3mConvertPreviewView
  }
}
