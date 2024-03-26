import { proxy, subscribe as sub, snapshot } from 'valtio/vanilla'
import type { ThemeMode, ThemeVariables } from '../utils/TypeUtil.js'
import { ConnectorController } from './ConnectorController.js'

// -- Types --------------------------------------------- //
export interface ThemeControllerState {
  themeMode: ThemeMode
  themeVariables: ThemeVariables
}

// -- State --------------------------------------------- //
const state = proxy<ThemeControllerState>({
  themeMode: 'dark',
  themeVariables: {}
})

// -- Controller ---------------------------------------- //
export const ThemeController = {
  state,

  subscribe(callback: (newState: ThemeControllerState) => void) {
    return sub(state, () => callback(state))
  },

  setThemeMode(themeMode: ThemeControllerState['themeMode']) {
    state.themeMode = themeMode
    try {
      const emailConnector = ConnectorController.getAuthConnector()

      if (emailConnector) {
        emailConnector.provider.syncTheme({
          themeMode: ThemeController.getSnapshot().themeMode
        })
      }
    } catch {
      // eslint-disable-next-line no-console
      console.info('Unable to sync theme to email connector')
    }
  },

  setThemeVariables(themeVariables: ThemeControllerState['themeVariables']) {
    state.themeVariables = { ...state.themeVariables, ...themeVariables }
    try {
      const emailConnector = ConnectorController.getAuthConnector()
      if (emailConnector) {
        emailConnector.provider.syncTheme({
          themeVariables: ThemeController.getSnapshot().themeVariables
        })
      }
    } catch {
      // eslint-disable-next-line no-console
      console.info('Unable to sync theme to email connector')
    }
  },

  getSnapshot() {
    return snapshot(state)
  }
}
