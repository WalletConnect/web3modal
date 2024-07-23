import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import { proxy } from 'valtio/vanilla'
import type { CaipNetwork, Connector, WcWallet } from '../utils/TypeUtil.js'
import type { SwapInputTarget } from './SwapController.js'

// -- Types --------------------------------------------- //
type TransactionAction = {
  goBack: boolean
  view: RouterControllerState['view'] | null
  close?: boolean
  replace?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}
export interface RouterControllerState {
  view:
    | 'Account'
    | 'AccountSettings'
    | 'SelectAddresses'
    | 'AllWallets'
    | 'ApproveTransaction'
    | 'BuyInProgress'
    | 'WalletCompatibleNetworks'
    | 'ChooseAccountName'
    | 'Connect'
    | 'ConnectingExternal'
    | 'ConnectingWalletConnect'
    | 'ConnectingSiwe'
    | 'ConnectingSocial'
    | 'ConnectSocials'
    | 'ConnectWallets'
    | 'Downloads'
    | 'EmailVerifyOtp'
    | 'EmailVerifyDevice'
    | 'GetWallet'
    | 'Networks'
    | 'OnRampActivity'
    | 'OnRampFiatSelect'
    | 'OnRampProviders'
    | 'OnRampTokenSelect'
    | 'PaymasterSelectToken'
    | 'Profile'
    | 'RegisterAccountName'
    | 'RegisterAccountNameSuccess'
    | 'SwitchNetwork'
    | 'SwitchAddress'
    | 'Transactions'
    | 'UnsupportedChain'
    | 'UpdateEmailWallet'
    | 'UpdateEmailPrimaryOtp'
    | 'UpdateEmailSecondaryOtp'
    | 'UpgradeEmailWallet'
    | 'UpgradeToSmartAccount'
    | 'WalletReceive'
    | 'WalletSend'
    | 'WalletSendPreview'
    | 'WalletSendSelectToken'
    | 'WhatIsANetwork'
    | 'WhatIsAWallet'
    | 'WhatIsABuy'
    | 'Swap'
    | 'SwapSelectToken'
    | 'SwapPreview'
  history: RouterControllerState['view'][]
  data?: {
    connector?: Connector
    wallet?: WcWallet
    network?: CaipNetwork
    email?: string
    newEmail?: string
    target?: SwapInputTarget
    swapUnsupportedChain?: boolean
  }
  transactionStack: TransactionAction[]
}

// -- State --------------------------------------------- //
const state = proxy<RouterControllerState>({
  view: 'Connect',
  history: ['Connect'],
  transactionStack: []
})

type StateKey = keyof RouterControllerState

// -- Controller ---------------------------------------- //
export const RouterController = {
  state,

  subscribeKey<K extends StateKey>(key: K, callback: (value: RouterControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  pushTransactionStack(action: TransactionAction) {
    state.transactionStack.push(action)
  },

  popTransactionStack(cancel?: boolean) {
    const action = state.transactionStack.pop()

    if (!action) {
      return
    }

    if (cancel) {
      this.goBack()
      action?.onCancel?.()
    } else {
      if (action.goBack) {
        this.goBack()
      } else if (action.view) {
        this.reset(action.view)
      }
      action?.onSuccess?.()
    }
  },

  push(view: RouterControllerState['view'], data?: RouterControllerState['data']) {
    if (view !== state.view) {
      state.view = view
      state.history.push(view)
      state.data = data
    }
  },

  reset(view: RouterControllerState['view']) {
    state.view = view
    state.history = [view]
  },

  replace(view: RouterControllerState['view'], data?: RouterControllerState['data']) {
    if (state.history.length >= 1 && state.history.at(-1) !== view) {
      state.view = view
      state.history[state.history.length - 1] = view
      state.data = data
    }
  },

  goBack() {
    if (state.history.length > 1) {
      state.history.pop()
      const [last] = state.history.slice(-1)
      if (last) {
        state.view = last
      }
    }
  },

  goBackToIndex(historyIndex: number) {
    if (state.history.length > 1) {
      state.history = state.history.slice(0, historyIndex + 1)
      const [last] = state.history.slice(-1)
      if (last) {
        state.view = last
      }
    }
  }
}
