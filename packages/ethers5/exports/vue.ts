import type { Web3ModalOptions } from '../src/client.js'
import { Web3Modal } from '../src/client.js'
import { ConstantsUtil } from '@web3modal/utils'
import { getWeb3Modal } from '@web3modal/scaffold-vue'
import { onUnmounted, ref } from 'vue'
// -- Types -------------------------------------------------------------------
export type { Web3ModalOptions } from '../src/client.js'

// -- Setup -------------------------------------------------------------------
let modal: Web3Modal | undefined = undefined

export function createWeb3Modal(options: Web3ModalOptions) {
  if (!modal) {
    modal = new Web3Modal({
      ...options,
      _sdkVersion: `vue-ethers5-${ConstantsUtil.VERSION}`
    })
    getWeb3Modal(modal)
  }

  return modal
}

// -- Composites --------------------------------------------------------------
export function useWeb3ModalSigner() {
  if (!modal) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalSigner" composition')
  }

  const walletProvider = ref(modal.getWalletProvider())
  const walletProviderType = ref(modal.getWalletProviderType())
  const signer = ref(walletProvider.value?.getSigner())

  const unsubscribe = modal.subscribeProvider(state => {
    walletProvider.value = state.provider
    walletProviderType.value = state.providerType
    signer.value = walletProvider.value?.getSigner()
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return {
    walletProvider,
    walletProviderType,
    signer
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
    address.value = state.address
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

export {
  useWeb3ModalTheme,
  useWeb3Modal,
  useWeb3ModalState,
  useWeb3ModalEvents
} from '@web3modal/scaffold-vue'

// -- Universal Exports -------------------------------------------------------
export { defaultConfig } from '../src/utils/defaultConfig.js'
