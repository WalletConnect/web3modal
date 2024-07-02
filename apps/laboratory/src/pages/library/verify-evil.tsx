import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { Web3ModalButtons } from '../../components/Web3ModalButtons'
import { WagmiTests } from '../../components/Wagmi/WagmiTests'
import { ThemeStore } from '../../utils/StoreUtil'
import { WagmiModalInfo } from '../../components/Wagmi/WagmiModalInfo'
import { getWagmiConfig } from '../../utils/WagmiConstants'

const metadata = {
  name: 'Evil Web3Modal',
  description: 'Evil Web3Modal Laboratory',
  url: 'https://malicious-app-verify-simulation.vercel.app/',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
  verifyUrl: ''
}

const queryClient = new QueryClient()

const wagmiConfig = getWagmiConfig('default', {
  projectId: '9d176efa3150a1df0a76c8c138b6b657',
  metadata
})

const modal = createWeb3Modal({
  wagmiConfig,
  projectId: '9d176efa3150a1df0a76c8c138b6b657',
  metadata,
  termsConditionsUrl: 'https://walletconnect.com/terms',
  privacyPolicyUrl: 'https://walletconnect.com/privacy'
})

ThemeStore.setModal(modal)

export default function Wagmi() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  return ready ? (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3ModalButtons />
        <WagmiModalInfo />
        <WagmiTests />
      </QueryClientProvider>
    </WagmiProvider>
  ) : null
}
