import { subscribeKey as subKey } from 'valtio/utils'
import { proxy } from 'valtio/vanilla'
import type { CaipNetwork, Connector, WcWallet } from '../utils/TypeUtil.js'

// -- Types --------------------------------------------- //
export interface RouterControllerState {
  view:
    | 'Account'
    | 'AccountSettings'
    | 'AllWallets'
    | 'ApproveTransaction'
    | 'BuyInProgress'
    | 'WalletCompatibleNetworks'
    | 'Connect'
    | 'ConnectingExternal'
    | 'ConnectingWalletConnect'
    | 'ConnectingSiwe'
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
    | 'SwitchNetwork'
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
  history: RouterControllerState['view'][]
  data?: {
    connector?: Connector
    wallet?: WcWallet
    network?: CaipNetwork
    email?: string
    newEmail?: string
  }
}

// -- State --------------------------------------------- //
const state = proxy<RouterControllerState>({
  view: 'Connect',
  history: ['Connect']
})

type StateKey = keyof RouterControllerState

// -- Controller ---------------------------------------- //
export const RouterController = {
  state,

  subscribeKey<K extends StateKey>(key: K, callback: (value: RouterControllerState[K]) => void) {
    return subKey(state, key, callback)
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
    if (state.history.length > 1 && state.history.at(-1) !== view) {
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
