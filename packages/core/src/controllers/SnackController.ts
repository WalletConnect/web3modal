import { proxy } from 'valtio/vanilla'
import { subscribeKey as subKey } from 'valtio/vanilla/utils'
import { CoreHelperUtil } from '../utils/CoreHelperUtil.js'

// -- Types --------------------------------------------- //
export interface SnackControllerState {
  message: string
  variant: 'error' | 'success' | 'loading'
  open: boolean
  durationMs: number
}

type StateKey = keyof SnackControllerState

// -- State --------------------------------------------- //
const state = proxy<SnackControllerState>({
  message: '',
  variant: 'success',
  open: false,
  durationMs: 2500
})

// -- Controller ---------------------------------------- //
export const SnackController = {
  state,

  subscribeKey<K extends StateKey>(key: K, callback: (value: SnackControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  showLoading(
    message: SnackControllerState['message'],
    durationMs?: SnackControllerState['durationMs']
  ) {
    state.message = message
    state.variant = 'loading'
    state.open = true
    if (durationMs) {
      state.durationMs = durationMs
    }
  },

  showSuccess(
    message: SnackControllerState['message'],
    durationMs?: SnackControllerState['durationMs']
  ) {
    state.message = message
    state.variant = 'success'
    state.open = true
    if (durationMs) {
      state.durationMs = durationMs
    }
  },

  showError(message: unknown, durationMs?: SnackControllerState['durationMs']) {
    const errorMessage = CoreHelperUtil.parseError(message)
    state.message = errorMessage
    state.variant = 'error'
    state.open = true
    if (durationMs) {
      state.durationMs = durationMs
    }
  },

  hide() {
    state.open = false
  }
}
