import { Web3Modal } from '@web3modal/wagmi/react'
import { useEffect, useState } from 'react'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { arbitrum, mainnet } from 'wagmi/chains'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { publicProvider } from 'wagmi/providers/public'

// 1. Get projectId
const projectId = import.meta.env.VITE_PROJECT_ID
if (!projectId) {
  throw new Error('VITE_PROJECT_ID is not set')
}

// 2. Create wagmiConfig
const { chains, publicClient } = configureChains(
  [mainnet, arbitrum, avalanche, polygon, gnosis, optimism, sepolia, fantom],
  [publicProvider()]
)
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new WalletConnectConnector({ chains, options: { projectId, showQrModal: false } }),
    new InjectedConnector({ chains, options: { shimDisconnect: true } }),
    new CoinbaseWalletConnector({ chains, options: { appName: 'Web3Modal' } })
  ],
  publicClient
})

export default function HomePage() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  return ready ? (
    <>
      <WagmiConfig config={wagmiConfig}></WagmiConfig>
      <Web3Modal wagmiConfig={wagmiConfig} projectId={projectId} chains={chains} />
    </>
  ) : null
}
