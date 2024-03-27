import { proxy, subscribe as sub } from 'valtio/vanilla'
import type { CaipNetworkId } from '../utils/TypeUtil.js'

// -- Types --------------------------------------------- //
export interface PublicStateControllerState {
  loading: boolean
  open: boolean
  selectedNetworkId?: CaipNetworkId
}

// -- State --------------------------------------------- //
const state = proxy<PublicStateControllerState>({
  loading: false,
  open: false,
  selectedNetworkId: undefined
})

// -- Controller ---------------------------------------- //
export const PublicStateController = {
  state,

  subscribe(callback: (newState: PublicStateControllerState) => void) {
    return sub(state, () => callback(state))
  },

  set(newState: Partial<PublicStateControllerState>) {
    Object.assign(state, { ...state, ...newState })
  }
}
