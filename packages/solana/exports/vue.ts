import { onUnmounted, ref } from 'vue'
import { ConstantsUtil } from '@web3modal/scaffold-utils'
import { getWeb3Modal } from '@web3modal/scaffold-vue'
import type { CaipNetwork } from 'packages/core/dist/types/index.js'
import { AppKit } from '@web3modal/base'
import type { AppKitOptions } from '@web3modal/base'
import { SolanaWeb3JsClient, SolStoreUtil } from '@web3modal/base/adapters/solana/web3js'
import type {
  Chain,
  Provider,
  ProviderType,
  BaseWalletAdapter
} from '@web3modal/base/adapters/solana/web3js'

// -- Setup -------------------------------------------------------------------
let appkit: AppKit | undefined = undefined
let solanaAdapter: SolanaWeb3JsClient | undefined = undefined

type SolanaAppKitOptions = Omit<AppKitOptions, 'adapters' | 'sdkType' | 'sdkVersion'> & {
  solanaConfig: ProviderType
  chains: Chain[]
  wallets: BaseWalletAdapter[]
}

export function createWeb3Modal(options: SolanaAppKitOptions) {
  solanaAdapter = new SolanaWeb3JsClient({
    solanaConfig: options.solanaConfig,
    chains: options.chains,
    wallets: options.wallets,
    projectId: options.projectId
  })
  appkit = new AppKit({
    ...options,
    adapters: [solanaAdapter],
    sdkType: 'w3m',
    sdkVersion: `vue-solana-${ConstantsUtil.VERSION}`
  })
  getWeb3Modal(appkit)

  return appkit
}

// -- Composites --------------------------------------------------------------
export function useWeb3ModalProvider() {
  if (!solanaAdapter) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalProvider" composition')
  }

  const walletProvider = ref(SolStoreUtil.state.provider as Provider)
  const walletProviderType = ref(SolStoreUtil.state.providerType)
  const connection = ref(SolStoreUtil.state.connection)

  const unsubscribe = solanaAdapter.subscribeProvider(state => {
    walletProvider.value = state.provider as Provider
    walletProviderType.value = state.providerType
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return {
    walletProvider,
    walletProviderType,
    connection
  }
}

export function useDisconnect() {
  function disconnect() {
    solanaAdapter?.disconnect()
  }

  return {
    disconnect
  }
}

export function useSwitchNetwork() {
  async function switchNetwork(chainId: string) {
    await solanaAdapter?.switchNetwork({ id: chainId } as CaipNetwork)
  }

  return {
    switchNetwork
  }
}

export function useWeb3ModalAccount() {
  if (!solanaAdapter) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalAccount" composition')
  }

  const address = ref(solanaAdapter.getAddress())
  const isConnected = ref(SolStoreUtil.state.isConnected)
  const chainId = ref(SolStoreUtil.state.currentChain?.chainId)

  const unsubscribe = solanaAdapter.subscribeProvider(state => {
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
  if (!solanaAdapter) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalError" composition')
  }

  const error = ref(SolStoreUtil.state.error)

  const unsubscribe = solanaAdapter.subscribeProvider(state => {
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
export { defaultSolanaConfig } from '@web3modal/base/adapters/solana/web3js'
