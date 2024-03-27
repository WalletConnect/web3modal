import type { Web3ModalOptions } from '../src/client.js'
import { Web3Modal } from '../src/client.js'
import { ConstantsUtil } from '@web3modal/scaffold-utils'
import { getWeb3Modal } from '@web3modal/scaffold-vue'
import { onUnmounted, ref } from 'vue'
import type { Eip1193Provider } from 'ethers'
// -- Types -------------------------------------------------------------------
export type { Web3ModalOptions } from '../src/client.js'

// -- Setup -------------------------------------------------------------------
let modal: Web3Modal | undefined = undefined

export function createWeb3Modal(options: Web3ModalOptions) {
  if (!modal) {
    modal = new Web3Modal({
      ...options,
      _sdkVersion: `vue-ethers-${ConstantsUtil.VERSION}`
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

  const walletProvider = ref(modal.getWalletProvider())
  const walletProviderType = ref(modal.getWalletProviderType())

  const unsubscribe = modal.subscribeProvider(state => {
    walletProvider.value = state.provider as Eip1193Provider | undefined
    walletProviderType.value = state.providerType
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return {
    walletProvider,
    walletProviderType
  }
}

export function useDisconnect() {
  async function disconnect() {
    await modal?.disconnect()
  }

  return {
    disconnect
  }
}

export function useAddress() {
  const { address } = useSnapshot(EthersStoreUtil.state)
  const { address: wagmiAddress } = useAccount()

  return {
    address: wagmiAddress ?? address
  }
}

export function useSwitchNetwork() {
  async function switchNetwork(chainId: number) {
    await modal?.switchNetwork(chainId)
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
  const isConnected = ref(modal.getIsConnected())
  const chainId = ref(modal.getChainId())

  const unsubscribe = modal.subscribeProvider(state => {
    address.value = state.address as string
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

  const error = ref(modal.getError())

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
export { defaultConfig } from '../src/utils/defaultConfig.js'
