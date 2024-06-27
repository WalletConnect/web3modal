import type { Transaction } from '@web3modal/common'
import { proxy, subscribe as sub } from 'valtio/vanilla'
import { OptionsController } from './OptionsController.js'
import { EventsController } from './EventsController.js'
import { SnackController } from './SnackController.js'
import { BlockchainApiController } from './BlockchainApiController.js'
import { AccountController } from './AccountController.js'
import { W3mFrameRpcConstants } from '@web3modal/wallet'
import {PEANUT_CONTRACTS} from '@squirrel-labs/peanut-sdk'

// -- Types --------------------------------------------- //
type TransactionByMonthMap = Record<number, Transaction[]>
type TransactionByYearMap = Record<number, TransactionByMonthMap>

export interface TransactionsControllerState {
  transactions: Transaction[]
  coinbaseTransactions: TransactionByYearMap
  transactionsByYear: TransactionByYearMap
  loading: boolean
  empty: boolean
  next: string | undefined
}

// -- State --------------------------------------------- //
const state = proxy<TransactionsControllerState>({
  transactions: [],
  coinbaseTransactions: {},
  transactionsByYear: {},
  loading: false,
  empty: false,
  next: undefined
})

// -- Controller ---------------------------------------- //
export const TransactionsController = {
  state,

  subscribe(callback: (newState: TransactionsControllerState) => void) {
    return sub(state, () => callback(state))
  },

  async fetchTransactions(accountAddress?: string, onramp?: 'coinbase') {
    const { projectId } = OptionsController.state

    if (!projectId || !accountAddress) {
      throw new Error("Transactions can't be fetched without a projectId and an accountAddress")
    }

    state.loading = true

    try {
      let response = await BlockchainApiController.fetchTransactions({
        account: accountAddress,
        projectId,
        cursor: state.next,
        onramp
      })

      response.data = response.data.map((tx: any) => {
        const chainId = tx.metadata.chain?.split(':')[1];
        const sentTo = tx.metadata.sentTo;
      
        if (chainId && PEANUT_CONTRACTS[chainId]) {
          const addresses = Object.values(PEANUT_CONTRACTS[chainId])
            .filter((value): value is string => typeof value === 'string')
            .map((address: string) => address.toLowerCase());
      
          const isAddressPresent = addresses.includes(sentTo.toLowerCase());
      
          if (isAddressPresent){
            return {...tx, metadata: {...tx.metadata, application: { name: 'peanut_created_link'}}}
          }
        }
        return tx; 
      });

      const nonSpamTransactions = this.filterSpamTransactions(response.data)
      const filteredTransactions = [...state.transactions, ...nonSpamTransactions]

      state.loading = false

      if (onramp === 'coinbase') {
        state.coinbaseTransactions = this.groupTransactionsByYearAndMonth(
          state.coinbaseTransactions,
          response.data
        )
      } else {
        state.transactions = filteredTransactions
        state.transactionsByYear = this.groupTransactionsByYearAndMonth(
          state.transactionsByYear,
          nonSpamTransactions
        )
      }

      state.empty = filteredTransactions.length === 0
      state.next = response.next ? response.next : undefined
    } catch (error) {
      EventsController.sendEvent({
        type: 'track',
        event: 'ERROR_FETCH_TRANSACTIONS',
        properties: {
          address: accountAddress,
          projectId,
          cursor: state.next,
          isSmartAccount:
            AccountController.state.preferredAccountType ===
            W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT
        }
      })
      SnackController.showError('Failed to fetch transactions')
      state.loading = false
      state.empty = true
      state.next = undefined
    }
  },

  groupTransactionsByYearAndMonth(
    transactionsMap: TransactionByYearMap = {},
    transactions: Transaction[] = []
  ) {
    const grouped = transactionsMap
    transactions.forEach(transaction => {
      const year = new Date(transaction.metadata.minedAt).getFullYear()
      const month = new Date(transaction.metadata.minedAt).getMonth()

      const yearTransactions = grouped[year] ?? {}
      const monthTransactions = yearTransactions[month] ?? []

      // If there's a transaction with the same id, remove the old one
      const newMonthTransactions = monthTransactions.filter(tx => tx.id !== transaction.id)

      grouped[year] = {
        ...yearTransactions,
        [month]: [...newMonthTransactions, transaction].sort(
          (a, b) => new Date(b.metadata.minedAt).getTime() - new Date(a.metadata.minedAt).getTime()
        )
      }
    })

    return grouped
  },

  filterSpamTransactions(transactions: Transaction[]) {
    return transactions.filter(transaction => {
      const isAllSpam = transaction.transfers.every(
        transfer => transfer.nft_info?.flags.is_spam === true
      )

      return !isAllSpam
    })
  },

  clearCursor() {
    state.next = undefined
  },

  resetTransactions() {
    state.transactions = []
    state.transactionsByYear = {}
    state.loading = false
    state.empty = false
    state.next = undefined
  }
}
