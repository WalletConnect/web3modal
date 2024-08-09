import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { Web3ModalButtons } from '../../components/Web3ModalButtons'
import { WagmiTests } from '../../components/Wagmi/WagmiTests'
import { ThemeStore } from '../../utils/StoreUtil'
import { getWagmiConfig } from '../../utils/WagmiConstants'
import { ConstantsUtil } from '../../utils/ConstantsUtil'
import { WagmiModalInfo } from '../../components/Wagmi/WagmiModalInfo'
import React from 'react'
import { useChakraToast } from '../../components/Toast'
import { EthereumProvider } from '@walletconnect/ethereum-provider'

const queryClient = new QueryClient()

const wagmiConfig = getWagmiConfig('default')

const modal = createWeb3Modal({
  wagmiConfig,
  projectId: ConstantsUtil.ProjectId,
  enableAnalytics: true,
  metadata: ConstantsUtil.Metadata,
  termsConditionsUrl: 'https://walletconnect.com/terms',
  privacyPolicyUrl: 'https://walletconnect.com/privacy',
  customWallets: ConstantsUtil.CustomWallets
})

ThemeStore.setModal(modal)
let loaded = false
export default function Wagmi() {
  const toast = useChakraToast()

  React.useEffect(() => {
    if (loaded) {
      return
    }
    loaded = true
    // @ts-expect-error - wagmiConfig is private
    const connector = modal?.wagmiConfig?.connectors?.find(c => c.id === 'walletConnect')
    if (!connector) {
      return
    }

    connector.getProvider().then((provider: typeof EthereumProvider) => {
      // @ts-expect-error - walletConnectProvider is private
      const relayer = provider.signer.client.core.relayer
      relayer.on('relayer_connect', () => {
        toast({
          title: 'Connected!',
          description: 'wss connection established',
          type: 'success'
        })
      })
      relayer.on('relayer_disconnect', () => {
        toast({
          title: 'Disconnected!',
          description: 'wss connection lost',
          type: 'error'
        })
      })
    })
  }, [])

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3ModalButtons />
        <WagmiModalInfo />
        <WagmiTests />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
