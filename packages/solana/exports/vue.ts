import { useSnapshot } from 'valtio'
import { onUnmounted, ref } from 'vue'

import { ConstantsUtil } from '@web3modal/scaffold-utils'
import { getWeb3Modal } from '@web3modal/scaffold-vue'

import type { Web3ModalOptions } from '../src/client.js'
import type { CaipNetwork } from 'packages/core/dist/types/index.js'
import type { Provider } from '../src/utils/scaffold/index.js'
import { SolStoreUtil } from '../src/utils/scaffold/SolanaStoreUtil.js'
import { Web3Modal } from '../src/client.js'

// -- Types -------------------------------------------------------------------
export type { Web3ModalOptions } from '../src/client.js'

// -- Setup -------------------------------------------------------------------
let modal: Web3Modal | undefined = undefined

export function createWeb3Modal(options: Web3ModalOptions) {
  if (!modal) {
    modal = new Web3Modal({
      ...options,
      _sdkVersion: `vue-solana-${ConstantsUtil.VERSION}`
    })
    getWeb3Modal(modal)
  }

  return modal
}

// -- Composites --------------------------------------------------------------
export function useWeb3ModalProvider() {
  if (!modal) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalProvider" composition')
  }

  const { provider, providerType, connection } = useSnapshot(SolStoreUtil.state)

  const walletProvider = provider as Provider

  const walletProviderType = providerType

  return {
    walletProvider,
    walletProviderType,
    connection
  }
}

export function useDisconnect() {
  function disconnect() {
    modal?.disconnect()
  }

  return {
    disconnect
  }
}

export function useSwitchNetwork() {
  async function switchNetwork(chainId: string) {
    await modal?.switchNetwork({ id: chainId } as CaipNetwork)
  }

  return {
    switchNetwork
  }
}

export function useWeb3ModalAccount() {
  if (!modal) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalAccount" composition')
  }

  const address = ref(modal.getAddress())
  const isConnected = ref(SolStoreUtil.state.isConnected)
  const chainId = ref(SolStoreUtil.state.currentChain?.chainId)

  const unsubscribe = modal.subscribeProvider(state => {
    address.value = state.address ?? ''
    isConnected.value = state.isConnected
    chainId.value = state.chainId
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return {
    address,
    isConnected,
    chainId
  }
}

export function useWeb3ModalError() {
  if (!modal) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalError" composition')
  }

  const error = ref(SolStoreUtil.state.error)

  const unsubscribe = modal.subscribeProvider(state => {
    error.value = state.error
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return {
    error
  }
}

export {
  useWeb3ModalTheme,
  useWeb3Modal,
  useWeb3ModalState,
  useWeb3ModalEvents
} from '@web3modal/scaffold-vue'

// -- Universal Exports -------------------------------------------------------
export { defaultSolanaConfig } from '../src/utils/defaultConfig.js'
