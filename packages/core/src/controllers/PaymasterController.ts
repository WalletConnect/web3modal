import type { Balance } from '@web3modal/common'
import { subscribeKey as subKey } from 'valtio/utils'
import { proxy, subscribe as sub } from 'valtio/vanilla'
import { AccountController } from './AccountController.js'
import { BlockchainApiController } from './BlockchainApiController.js'
import { NetworkController } from './NetworkController.js'

export interface PaymasterControllerState {
  selectedToken: string | null
  availableTokens: string[]
  tokens: Balance[]
  suggestedTokens: Balance[]
}

type StateKey = keyof PaymasterControllerState

// -- State --------------------------------------------- //

const state = proxy<PaymasterControllerState>({
  selectedToken: null,
  tokens: [],
  availableTokens: [],
  suggestedTokens: []
})

// -- Controller ---------------------------------------- //

export const PaymasterController = {
  state,

  subscribe(callback: (value: PaymasterControllerState) => void) {
    return sub(state, () => callback(state))
  },

  subscribeKey<K extends StateKey>(key: K, callback: (value: PaymasterControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  setAvailableTokens(tokens: string[]) {
    state.availableTokens = tokens
  },

  async getMyTokensWithBalance() {
    const address = AccountController.state.address
    const caipNetwork = NetworkController.state.caipNetwork

    if (!address || !caipNetwork) {
      state.tokens = []

      return
    }

    const response = await BlockchainApiController.getBalance(address, caipNetwork.id)

    const tokens = response.balances.filter(
      balance => balance.quantity.decimals !== '0' && state.availableTokens.includes(balance.symbol)
    )

    state.tokens = tokens
  },

  selectToken(token: string | null) {
    state.selectedToken = token
  },

  searchTokens(query: string) {
    state.suggestedTokens = state.tokens.filter(token => {
      const valueText = `${token.name} ${token.symbol}`

      return valueText.toLowerCase().includes(query.toLowerCase())
    })
  }
}
