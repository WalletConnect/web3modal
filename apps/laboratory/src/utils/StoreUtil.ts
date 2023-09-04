import { proxy } from 'valtio'
import { modal } from '../pages/index'

interface ThemeVariables {
  '--w3m-font-family'?: string
  '--w3m-accent'?: string
  '--w3m-color-mix'?: string
  '--w3m-color-mix-strength'?: number
  '--w3m-font-size-master'?: string
  '--w3m-border-radius-master'?: string
  '--w3m-z-index'?: string
}
interface ThemeStoreState {
  mixColorStrength: number
  mixColor?: string
  accentColor?: string
  themeVariables: ThemeVariables
}

const state = proxy<ThemeStoreState>({
  mixColorStrength: 0,
  mixColor: undefined,
  accentColor: undefined,
  themeVariables: {}
})

export const ThemeStore = {
  state,

  setMixColorStrength(value: ThemeStoreState['mixColorStrength']) {
    state.mixColorStrength = value
    modal.setThemeVariables({ '--w3m-color-mix-strength': value })
  },

  setMixColor(value: ThemeStoreState['mixColor']) {
    state.mixColor = value
    modal.setThemeVariables({ '--w3m-color-mix': value })
  },

  setAccentColor(value: ThemeStoreState['accentColor']) {
    state.accentColor = value
    modal.setThemeVariables({ '--w3m-accent': value })
  },

  setThemeVariables(value: ThemeStoreState['themeVariables']) {
    state.themeVariables = value
    modal.setThemeVariables(value)
  }
}
