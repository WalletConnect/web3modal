import { DateUtil, type Transaction } from '@web3modal/common'
import {
  AccountController,
  OnRampController,
  BlockchainApiController,
  OptionsController
} from '@web3modal/core'
import { customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import styles from './styles.js'
import { ifDefined } from 'lit/directives/if-defined.js'

// -- Helpers --------------------------------------------- //
const LOADING_ITEM_COUNT = 7

@customElement('w3m-onramp-activity-view')
export class W3mOnRampActivityView extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []
  private refetchTimeout: NodeJS.Timeout | undefined = undefined

  // -- State & Properties -------------------------------- //
  @state() protected selectedOnRampProvider = OnRampController.state.selectedProvider

  @state() protected loading = false

  @state() private coinbaseTransactions: Transaction[] = []

  public constructor() {
    super()
    this.unsubscribe.push(
      ...[
        OnRampController.subscribeKey('selectedProvider', val => {
          this.selectedOnRampProvider = val
        }),
        () => {
          clearTimeout(this.refetchTimeout)
        }
      ]
    )
    this.fetchTransactions()
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex flexDirection="column" padding="s" gap="xs">
        ${this.loading ? this.templateLoading() : this.onRampActivitiesTemplate()}
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private onRampActivitiesTemplate() {
    return this.coinbaseTransactions?.map(transaction => {
      const date = DateUtil.getRelativeDateFromNow(transaction.metadata.minedAt)
      const transfer = transaction.transfers[0]
      const fungibleInfo = transfer?.fungible_info

      if (!fungibleInfo) {
        return null
      }

      return html`
        <wui-onramp-activity-item
          label="Bought"
          .completed=${transaction.metadata.status === 'ONRAMP_TRANSACTION_STATUS_SUCCESS'}
          .inProgress=${transaction.metadata.status === 'ONRAMP_TRANSACTION_STATUS_IN_PROGRESS'}
          .failed=${transaction.metadata.status === 'ONRAMP_TRANSACTION_STATUS_FAILED'}
          purchaseCurrency=${ifDefined(fungibleInfo.symbol)}
          purchaseValue=${transfer.quantity.numeric}
          date=${date}
          icon=${ifDefined(fungibleInfo.icon?.url)}
        ></wui-onramp-activity-item>
      `
    })
  }

  private async fetchTransactions() {
    const provider = 'coinbase'

    if (provider === 'coinbase') {
      await this.fetchCoinbaseTransactions()
    }
  }

  private async fetchCoinbaseTransactions() {
    const address = AccountController.state.address
    const projectId = OptionsController.state.projectId

    if (!address) {
      throw new Error('No address found')
    }

    if (!projectId) {
      throw new Error('No projectId found')
    }

    this.loading = true

    const coinbaseResponse = await BlockchainApiController.fetchTransactions({
      account: address,
      onramp: 'coinbase',
      projectId
    })

    this.loading = false
    this.coinbaseTransactions = coinbaseResponse.data || []
    this.refetchLoadingTransactions()
  }

  private refetchLoadingTransactions() {
    const loadingTransactions = this.coinbaseTransactions.filter(
      transaction => transaction.metadata.status === 'ONRAMP_TRANSACTION_STATUS_IN_PROGRESS'
    )

    if (loadingTransactions.length === 0) {
      clearTimeout(this.refetchTimeout)

      return
    }

    // Wait 2 seconds before refetching
    this.refetchTimeout = setTimeout(async () => {
      const address = AccountController.state.address
      const projectId = OptionsController.state.projectId
      const coinbaseResponse = await BlockchainApiController.fetchTransactions({
        account: address as `0x${string}`,
        onramp: 'coinbase',
        projectId
      })
      this.coinbaseTransactions = coinbaseResponse.data || []
      this.refetchLoadingTransactions()
    }, 3000)
  }

  private templateLoading() {
    return Array(LOADING_ITEM_COUNT)
      .fill(html` <wui-transaction-list-item-loader></wui-transaction-list-item-loader> `)
      .map(item => item)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-onramp-activity-view': W3mOnRampActivityView
  }
}
