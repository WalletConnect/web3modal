import { createWeb3Modal } from '@web3modal/base/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { AppKitButtons } from '../../components/AppKitButtons'
import { ThemeStore } from '../../utils/StoreUtil'
import { ConstantsUtil } from '../../utils/ConstantsUtil'
import { WagmiPermissionsSyncProvider } from '../../context/WagmiPermissionsSyncContext'
import { WagmiPermissionsSyncTest } from '../../components/Wagmi/WagmiPermissionsSyncTest'
import { mainnet, optimism, polygon, zkSync } from '@web3modal/base/chains'
import { EVMWagmiClient } from '@web3modal/adapter-wagmi'

const queryClient = new QueryClient()

const wagmiAdapter = new EVMWagmiClient()

const modal = createWeb3Modal({
  adapters: [wagmiAdapter],
  caipNetworks: [polygon, mainnet, zkSync, optimism],
  projectId: ConstantsUtil.ProjectId,
  features: {
    analytics: true
  },
  termsConditionsUrl: 'https://walletconnect.com/terms',
  privacyPolicyUrl: 'https://walletconnect.com/privacy'
})

ThemeStore.setModal(modal)

export default function Wagmi() {
  if (!wagmiAdapter.wagmiConfig) {
    return null
  }

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiPermissionsSyncProvider>
          <AppKitButtons />
          <WagmiPermissionsSyncTest />
        </WagmiPermissionsSyncProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
