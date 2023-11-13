import { DateUtil } from '@web3modal/common'
import type { Transaction } from '@web3modal/common'
import { AccountController, EventsController, TransactionsController } from '@web3modal/core'
import { TransactionUtil, customElement } from '@web3modal/ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import styles from './styles.js'

// -- Helpers --------------------------------------------- //
const PAGINATOR_ID = 'last-transaction'
const LOADING_ITEM_COUNT = 7

@customElement('w3m-transactions-view')
export class W3mTransactionsView extends LitElement {
  public static override styles = styles

  // -- Members -------------------------------- //
  private unsubscribe: (() => void)[] = []

  private paginationObserver?: IntersectionObserver = undefined

  // -- State & Properties -------------------------------- //
  @state() private address: string | undefined = AccountController.state.address

  @state() private transactions = TransactionsController.state.transactions

  @state() private transactionsByYear = TransactionsController.state.transactionsByYear

  @state() private loading = TransactionsController.state.loading

  @state() private empty = TransactionsController.state.empty

  @state() private next = TransactionsController.state.next

  // -- Lifecycle ----------------------------------------- //
  public constructor() {
    super()
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
          this.transactions = val.transactions
          this.transactionsByYear = val.transactionsByYear
          this.loading = val.loading
          this.empty = val.empty
          this.next = val.next
        })
      ]
    )
  }

  public override firstUpdated() {
    if (this.transactions.length === 0) {
      this.fetchTransactions()
    }
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
    return html`
      <wui-flex flexDirection="column" padding="s" gap="s">
        ${this.empty ? null : this.templateTransactionsByYear()}
        ${this.loading ? this.templateLoading() : null}
        ${!this.loading && this.empty ? this.templateEmpty() : null}
      </wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private templateTransactionsByYear() {
    const sortedYearKeys = Object.keys(this.transactionsByYear).sort().reverse()

    return sortedYearKeys.map((year, index) => {
      const isLastGroup = index === sortedYearKeys.length - 1
      const yearInt = parseInt(year, 10)
      const groupTitle = TransactionUtil.getTransactionGroupTitle(yearInt)
      const transactions = this.transactionsByYear[yearInt]

      if (!transactions) {
        return null
      }

      return html`
        <wui-flex flexDirection="column" gap="sm">
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
  }

  private templateTransactions(transactions: Transaction[], isLastGroup: boolean) {
    return transactions.map((transaction, index) => {
      const { date, descriptions, direction, images, status, type } =
        this.getTransactionListItemProps(transaction)
      const isLastTransaction = isLastGroup && index === transactions.length - 1

      return html`
        <wui-transaction-list-item
          date=${date}
          direction=${direction}
          id=${isLastTransaction && this.next ? PAGINATOR_ID : ''}
          status=${status}
          type=${type}
          .images=${images}
          .descriptions=${descriptions}
        ></wui-transaction-list-item>
      `
    })
  }

  private templateEmpty() {
    return html`
      <wui-flex
        flexGrow="1"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        .padding=${['3xl', 'xl', '3xl', 'xl'] as const}
        gap="xl"
      >
        <wui-icon-box
          backgroundColor="glass-005"
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
      </wui-flex>
    `
  }

  private templateLoading() {
    return Array(LOADING_ITEM_COUNT)
      .fill(null)
      .map(() => html` <wui-transaction-list-item-loader></wui-transaction-list-item-loader> `)
  }

  private createPaginationObserver() {
    this.paginationObserver = new IntersectionObserver(([element]) => {
      if (element?.isIntersecting && !this.loading) {
        this.fetchTransactions()
        EventsController.sendEvent({ type: 'track', event: 'LOAD_MORE_TRANSACTIONS' })
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

  private async fetchTransactions() {
    await TransactionsController.fetchTransactions()
  }

  private getTransactionListItemProps(transaction: Transaction) {
    const date = DateUtil.getRelativeDateFromNow(transaction?.metadata?.minedAt)
    const descriptions = TransactionUtil.getTransactionDescriptions(transaction)

    const transfer = transaction?.transfers?.[0]
    const secondTransfer = transaction?.transfers?.[1]
    const images = [
      {
        type: TransactionUtil.getTransactionTransferTokenType(transfer),
        url: TransactionUtil.getTransactionImageURL(transfer)
      },
      {
        type: TransactionUtil.getTransactionTransferTokenType(secondTransfer),
        url: TransactionUtil.getTransactionImageURL(secondTransfer)
      }
    ]

    return {
      date,
      direction: transfer?.direction,
      descriptions,
      images,
      status: transaction.metadata?.status,
      type: transaction.metadata?.operationType
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-transactions-view': W3mTransactionsView
  }
}
