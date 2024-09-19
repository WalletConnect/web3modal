import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import { proxy } from 'valtio/vanilla'
import type { Connector, WcWallet } from '../utils/TypeUtil.js'
import type { SwapInputTarget } from './SwapController.js'
import type { CaipNetwork, ChainNamespace } from '@reown/appkit-common'
import { ModalController } from './ModalController.js'

// -- Types --------------------------------------------- //
type TransactionAction = {
  /**
   * If true, the router will go back to the previous view after the transaction is complete..
   */
  goBack: boolean
  /**
   * If set, the router will navigate to the specified view after the transaction is complete.
   */
  view: RouterControllerState['view'] | null
  /**
   * If true, the router will remove the previous view from the history and navigate to the current view.
   */
  replace?: boolean
  /**
   * Function to be called when the transaction is complete.
   */
  onSuccess?: () => void
  /**
   * Function to be called when the transaction is cancelled.
   */
  onCancel?: () => void
}
export interface RouterControllerState {
  view:
    | 'Account'
    | 'AccountSettings'
    | 'AllWallets'
    | 'ApproveTransaction'
    | 'BuyInProgress'
    | 'WalletCompatibleNetworks'
    | 'ChooseAccountName'
    | 'Connect'
    | 'ConnectingExternal'
    | 'ConnectingFarcaster'
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
    | 'ConnectingMultiChain'
    | 'SwitchActiveChain'
  history: RouterControllerState['view'][]
  data?: {
    connector?: Connector
    wallet?: WcWallet
    network?: CaipNetwork
    email?: string
    newEmail?: string
    target?: SwapInputTarget
    swapUnsupportedChain?: boolean
    connectors?: Connector[]
    switchToChain?: ChainNamespace
    navigateTo?: RouterControllerState['view']
    navigateWithReplace?: boolean
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
      // When the transaction is cancelled, we go back to the previous view
      this.goBack()
      action?.onCancel?.()
    } else {
      // When the transaction is successful, we do conditional navigation depending on the action properties
      if (action.goBack) {
        this.goBack()
      } else if (action.replace) {
        /*
         *  If the history like ["ConnectingSiwe", "ApproveTransaction"], this means SIWE popup is opened after page rendered (not after user interaction)
         *  we need to conditionally call replace.
         *  There is a chance that there is only these two views in the history; when user approved, the modal should closed and history should be empty (both connectingsiwe and approveTX should be removed)
         *  If there is another views before the ConnectingSiwe (if the CS is not the first view), we should back to the first view before CS.
         */
        const history = state.history
        const connectingSiweIndex = history.indexOf('ConnectingSiwe')

        if (connectingSiweIndex > 0) {
          // There are views before ConnectingSiwe
          this.goBackToIndex(connectingSiweIndex - 1)
        } else {
          // ConnectingSiwe is the first view
          ModalController.close()
          state.history = []
        }
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
    const lastView = state.history.at(-1)
    const isSameView = lastView === view

    if (!isSameView) {
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
    } else {
      ModalController.close()
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
