import { DateUtil } from '@web3modal/common'
import type { Transaction, TransactionImage } from '@web3modal/common'
import {
  AccountController,
  EventsController,
  OptionsController,
  RouterController,
  TransactionsController
} from '@web3modal/core'
import { TransactionUtil, customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { TransactionType } from '@web3modal/ui/src/utils/TypeUtil.js'
import styles from './styles.js'
import { W3mFrameRpcConstants } from '@web3modal/wallet'

// -- Helpers --------------------------------------------- //
const PAGINATOR_ID = 'last-transaction'
const LOADING_ITEM_COUNT = 7

@customElement('w3m-activity-list')
export class W3mActivityList extends LitElement {
  public static override styles = styles

  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  private paginationObserver?: IntersectionObserver = undefined

  // -- State & Properties -------------------------------- //
  @property() public page: 'account' | 'activity' = 'activity'

  @state() private address: string | undefined = AccountController.state.address

  @state() private transactionsByYear = TransactionsController.state.transactionsByYear

  @state() private loading = TransactionsController.state.loading

  @state() private empty = TransactionsController.state.empty

  @state() private next = TransactionsController.state.next

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()
    TransactionsController.clearCursor()
    this.unsubscribe.push(
      ...[
        AccountController.subscribe(val => {
          if (val.isConnected) {
            if (this.address !== val.address) {
              this.address = val.address
              TransactionsController.resetTransactions()
              TransactionsController.fetchTransactions(val.address)
            }
          }
        }),
        TransactionsController.subscribe(val => {
          this.transactionsByYear = val.transactionsByYear
          this.loading = val.loading
          this.empty = val.empty
          this.next = val.next
        })
      ]
    )
  }

  public override firstUpdated() {
    TransactionsController.fetchTransactions(this.address)
    this.createPaginationObserver()
  }

  public override updated() {
    this.setPaginationObserver()
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    return html` ${this.empty ? null : this.templateTransactionsByYear()}
    ${this.loading ? this.templateLoading() : null}
    ${!this.loading && this.empty ? this.templateEmpty() : null}`
  }

  // -- Private ------------------------------------------- //
  private templateTransactionsByYear() {
    const sortedYearKeys = Object.keys(this.transactionsByYear).sort().reverse()

    return sortedYearKeys.map((year, index) => {
      const isLastGroup = index === sortedYearKeys.length - 1
      const yearInt = parseInt(year, 10)

      const sortedMonthIndexes = new Array(12)
        .fill(null)
        .map((_, idx) => idx)
        .reverse()

      return sortedMonthIndexes.map(month => {
        const groupTitle = TransactionUtil.getTransactionGroupTitle(yearInt, month)
        const transactions = this.transactionsByYear[yearInt]?.[month]

        if (!transactions) {
          return null
        }

        return html`
          <wui-flex flexDirection="column">
            <wui-flex
              alignItems="center"
              flexDirection="row"
              .padding=${['xs', 's', 's', 's'] as const}
            >
              <wui-text variant="paragraph-500" color="fg-200">${groupTitle}</wui-text>
            </wui-flex>
            <wui-flex flexDirection="column" gap="xs">
              ${this.templateTransactions(transactions, isLastGroup)}
            </wui-flex>
          </wui-flex>
        `
      })
    })
  }

  private templateRenderTransaction(transaction: Transaction, isLastTransaction: boolean) {
    const { date, descriptions, direction, isAllNFT, images, status, transfers, type , application} =
      this.getTransactionListItemProps(transaction)
    console.log(application)
    const haveMultipleTransfers = transfers?.length > 1
    const haveTwoTransfers = transfers?.length === 2

    if (haveTwoTransfers && !isAllNFT) {
      return html`
        <wui-transaction-list-item
          date=${date}
          .direction=${direction}
          id=${isLastTransaction && this.next ? PAGINATOR_ID : ''}
          status=${status}
          type=${type}
          .images=${images}
          .descriptions=${descriptions}
          .isPeanutTransfer=${transaction.metadata.application.name === 'peanut_created_link'}
        ></wui-transaction-list-item>
      `
    }

    if (haveMultipleTransfers) {
      return transfers.map((transfer, index) => {
        const description = TransactionUtil.getTransferDescription(transfer)
        const isLastTransfer = isLastTransaction && index === transfers.length - 1
        return html` <wui-transaction-list-item
          date=${date}
          direction=${transfer.direction}
          id=${isLastTransfer && this.next ? PAGINATOR_ID : ''}
          status=${status}
          type=${type}
          .onlyDirectionIcon=${true}
          .images=${[images[index]] as TransactionImage[]}
          .descriptions=${[description]}
          .isPeanutTransfer=${transaction.metadata.application.name === 'peanut_created_link'}
        ></wui-transaction-list-item>`
      })
    }

    return html`
      <wui-transaction-list-item
        date=${date}
        .direction=${direction}
        id=${isLastTransaction && this.next ? PAGINATOR_ID : ''}
        status=${status}
        type=${type}
        .images=${images}
        .descriptions=${descriptions}
        .isPeanutTransfer=${transaction.metadata.application.name === 'peanut_created_link'}
      ></wui-transaction-list-item>
    `
  }

  private templateTransactions(transactions: Transaction[], isLastGroup: boolean) {
    return transactions.map((transaction, index) => {
      const isLastTransaction = isLastGroup && index === transactions.length - 1

      return html`${this.templateRenderTransaction(transaction, isLastTransaction)}`
    })
  }

  private emptyStateActivity() {
    return html`<wui-flex
      class="emptyContainer"
      flexGrow="1"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      .padding=${['3xl', 'xl', '3xl', 'xl'] as const}
      gap="xl"
    >
      <wui-icon-box
        backgroundColor="gray-glass-005"
        background="gray"
        iconColor="fg-200"
        icon="wallet"
        size="lg"
        ?border=${true}
        borderColor="wui-color-bg-125"
      ></wui-icon-box>
      <wui-flex flexDirection="column" alignItems="center" gap="xs">
        <wui-text align="center" variant="paragraph-500" color="fg-100"
          >No Transactions yet</wui-text
        >
        <wui-text align="center" variant="small-500" color="fg-200"
          >Start trading on dApps <br />
          to grow your wallet!</wui-text
        >
      </wui-flex>
    </wui-flex>`
  }

  private emptyStateAccount() {
    return html`<wui-flex
      class="contentContainer"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      gap="l"
    >
      <wui-icon-box
        icon="swapHorizontal"
        size="inherit"
        iconColor="fg-200"
        backgroundColor="fg-200"
        iconSize="lg"
      ></wui-icon-box>
      <wui-flex
        class="textContent"
        gap="xs"
        flexDirection="column"
        justifyContent="center"
        flexDirection="column"
      >
        <wui-text variant="paragraph-500" align="center" color="fg-100">No activity yet</wui-text>
        <wui-text variant="small-400" align="center" color="fg-200"
          >Your next transactions will appear here</wui-text
        >
      </wui-flex>
      <wui-link @click=${this.onReceiveClick.bind(this)}>Trade</wui-link>
    </wui-flex>`
  }

  private templateEmpty() {
    if (this.page === 'account') {
      return html`${this.emptyStateAccount()}`
    }

    return html`${this.emptyStateActivity()}`
  }

  private templateLoading() {
    if (this.page === 'activity') {
      return Array(LOADING_ITEM_COUNT)
        .fill(html` <wui-transaction-list-item-loader></wui-transaction-list-item-loader> `)
        .map(item => item)
    }

    return null
  }

  private onReceiveClick() {
    RouterController.push('WalletReceive')
  }

  private createPaginationObserver() {
    const { projectId } = OptionsController.state

    this.paginationObserver = new IntersectionObserver(([element]) => {
      if (element?.isIntersecting && !this.loading) {
        TransactionsController.fetchTransactions(this.address)
        EventsController.sendEvent({
          type: 'track',
          event: 'LOAD_MORE_TRANSACTIONS',
          properties: {
            address: this.address,
            projectId,
            cursor: this.next,
            isSmartAccount:
              AccountController.state.preferredAccountType ===
              W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
          }
        })
      }
    }, {})
    this.setPaginationObserver()
  }

  private setPaginationObserver() {
    this.paginationObserver?.disconnect()

    const lastItem = this.shadowRoot?.querySelector(`#${PAGINATOR_ID}`)
    if (lastItem) {
      this.paginationObserver?.observe(lastItem)
    }
  }

  private getTransactionListItemProps(transaction: Transaction) {
    const date = DateUtil.formatDate(transaction?.metadata?.minedAt)
    const descriptions = TransactionUtil.getTransactionDescriptions(transaction)

    const transfers = transaction?.transfers
    const transfer = transaction?.transfers?.[0]
    const isAllNFT =
      Boolean(transfer) && transaction?.transfers?.every(item => Boolean(item.nft_info))
    const images = TransactionUtil.getTransactionImages(transfers)

    return {
      date,
      direction: transfer?.direction,
      descriptions,
      isAllNFT,
      images,
      status: transaction.metadata?.status,
      transfers,
      type: transaction.metadata?.operationType as TransactionType,
      application: transaction.metadata?.application.name
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-activity-list': W3mActivityList
  }
}
