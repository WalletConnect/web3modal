import { onUnmounted, reactive, ref } from 'vue'
import type { Web3ModalScaffold } from '@web3modal/scaffold'
import type { Event } from '@web3modal/core'
import type {
  W3mAccountButton,
  W3mButton,
  W3mConnectButton,
  W3mNetworkButton,
  W3mOnrampWidget
} from '@web3modal/scaffold-ui'

type OpenOptions = Parameters<Web3ModalScaffold['open']>[0]

type ThemeModeOptions = Parameters<Web3ModalScaffold['setThemeMode']>[0]

type ThemeVariablesOptions = Parameters<Web3ModalScaffold['setThemeVariables']>[0]

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    W3mConnectButton: Pick<W3mConnectButton, 'size' | 'label' | 'loadingLabel'>
    W3mAccountButton: Pick<W3mAccountButton, 'disabled' | 'balance'>
    W3mButton: Pick<W3mButton, 'size' | 'label' | 'loadingLabel' | 'disabled' | 'balance'>
    W3mNetworkButton: Pick<W3mNetworkButton, 'disabled'>
    W3mOnrampWidget: Pick<W3mOnrampWidget, 'disabled'>
  }
}

let modal: Web3ModalScaffold | undefined = undefined

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWeb3Modal(web3modal: any) {
  if (web3modal) {
    modal = web3modal as Web3ModalScaffold
  }
}

export function useWeb3ModalTheme() {
  if (!modal) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalTheme" hook')
  }

  function setThemeMode(themeMode: ThemeModeOptions) {
    modal?.setThemeMode(themeMode)
  }

  function setThemeVariables(themeVariables: ThemeVariablesOptions) {
    modal?.setThemeVariables(themeVariables)
  }

  const themeMode = ref(modal.getThemeMode())
  const themeVariables = ref(modal.getThemeVariables())

  const unsubscribe = modal?.subscribeTheme(state => {
    themeMode.value = state.themeMode
    themeVariables.value = state.themeVariables
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return {
    setThemeMode,
    setThemeVariables,
    themeMode,
    themeVariables
  }
}

export function useWeb3Modal() {
  if (!modal) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3Modal" composable')
  }

  async function open(options?: OpenOptions) {
    await modal?.open(options)
  }

  async function close() {
    await modal?.close()
  }

  return reactive({
    open,
    close
  })
}

export function useWalletInfo() {
  if (!modal) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3Modal" composable')
  }

  const walletInfo = ref(modal.getWalletInfo())

  const unsubscribe = modal.subscribeWalletInfo(newValue => {
    walletInfo.value = newValue
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return { walletInfo }
}

export function useWeb3ModalState() {
  if (!modal) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalState" composable')
  }

  const initial = modal.getState()
  const open = ref(initial.open)
  const selectedNetworkId = ref(initial.selectedNetworkId)

  const unsubscribe = modal?.subscribeState(next => {
    open.value = next.open
    selectedNetworkId.value = next.selectedNetworkId
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return reactive({ open, selectedNetworkId })
}

export interface Web3ModalEvent {
  timestamp: number
  data: Event
}

export function useWeb3ModalEvents(): Web3ModalEvent {
  if (!modal) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalEvents" composable')
  }

  const event = reactive(modal.getEvent())
  const unsubscribe = modal?.subscribeEvents(next => {
    event.data = next.data
    event.timestamp = next.timestamp
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return event
}
