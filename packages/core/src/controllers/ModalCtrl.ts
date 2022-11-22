import { proxy, subscribe as valtioSub } from 'valtio/vanilla'
import type { ModalCtrlState } from '../types/controllerTypes'
import { ConfigCtrl } from './ConfigCtrl'
import { OptionsCtrl } from './OptionsCtrl'
import { RouterCtrl } from './RouterCtrl'

// -- initial state ------------------------------------------------ //
const state = proxy<ModalCtrlState>({
  open: false
})

// -- controller --------------------------------------------------- //
export const ModalCtrl = {
  state,

  subscribe(callback: (newState: ModalCtrlState) => void) {
    return valtioSub(state, () => callback(state))
  },

  open(options?: { uri: string; standaloneChains?: string[] }) {
    const { chains } = OptionsCtrl.state
    const { enableNetworkView } = ConfigCtrl.state
    const isChainsList = chains?.length && chains.length > 1

    if (isChainsList && enableNetworkView) {
      RouterCtrl.replace('SelectNetwork')
    } else {
      RouterCtrl.replace('ConnectWallet')
    }

    if (typeof options?.uri === 'string') {
      OptionsCtrl.setStandaloneUri(options.uri)
    }
    if (options?.standaloneChains?.length) {
      OptionsCtrl.setStandaloneChains(options.standaloneChains)
    }

    state.open = true
  },

  close() {
    state.open = false
  }
}
