import { createWeb3Modal } from '@web3modal/base/react'
import { EVMWagmiClient } from '@web3modal/base/adapters/evm/wagmi'
import { SolanaWeb3JsClient, defaultSolanaConfig } from '@web3modal/base/adapters/solana/web3js'
import { ThemeStore } from '../../utils/StoreUtil'
import { ConstantsUtil } from '../../utils/ConstantsUtil'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getWagmiConfig } from '../../utils/WagmiConstants'
import { WagmiProvider } from 'wagmi'
import { solana, solanaDevnet, solanaTestnet } from '../../utils/ChainsUtil'
import { WagmiModalInfo } from '../../components/Wagmi/WagmiModalInfo'
import { MultiChainInfo } from '../../components/MultiChainInfo'
import { HuobiWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { MultiChainTests } from '../../components/MultiChainTests'
import { AppKitButtons } from '../../components/AppKitButtons'

const queryClient = new QueryClient()

const wagmiConfig = getWagmiConfig('default')

const wagmiAdapter = new EVMWagmiClient({
  wagmiConfig
})

const solanaConfig = defaultSolanaConfig({
  chains: [solana, solanaTestnet, solanaDevnet],
  projectId: ConstantsUtil.ProjectId,
  metadata: ConstantsUtil.Metadata
})

const solanaWeb3JsAdapter = new SolanaWeb3JsClient({
  solanaConfig,
  chains: [solana, solanaTestnet, solanaDevnet],
  projectId: ConstantsUtil.ProjectId,
  wallets: [new HuobiWalletAdapter(), new SolflareWalletAdapter()]
})

const modal = createWeb3Modal({
  adapters: [wagmiAdapter, solanaWeb3JsAdapter],
  projectId: ConstantsUtil.ProjectId,
  enableAnalytics: true,
  metadata: ConstantsUtil.Metadata,
  termsConditionsUrl: 'https://walletconnect.com/terms',
  privacyPolicyUrl: 'https://walletconnect.com/privacy',
  customWallets: ConstantsUtil.CustomWallets
})

ThemeStore.setModal(modal)

export default function MultiChainAllAdapters() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppKitButtons />
        <MultiChainInfo />
        <WagmiModalInfo />
        <MultiChainTests />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
