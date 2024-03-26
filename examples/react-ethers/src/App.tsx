import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalEvents,
  useWeb3ModalState,
  useWeb3ModalTheme
} from '@web3modal/ethers/react'

// @ts-expect-error 1. Get projectId
const projectId = import.meta.env.VITE_PROJECT_ID
if (!projectId) {
  throw new Error('VITE_PROJECT_ID is not set')
}

// 2. Set chains
const chains = [
  {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://cloudflare-eth.com'
  },
  {
    chainId: 42161,
    name: 'Arbitrum',
    currency: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc'
  }
]

const ethersConfig = defaultConfig({
  metadata: {
    name: 'Web3Modal',
    description: 'Web3Modal Laboratory',
    url: 'https://web3modal.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  enableEmail: true,
  defaultChainId: 1,
  rpcUrl: 'https://cloudflare-eth.com'
})

// 3. Create modal
createWeb3Modal({
  ethersConfig,
  chains,
  projectId,
  enableAnalytics: true,
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix': '#00DCFF',
    '--w3m-color-mix-strength': 20
  }
})

export default function App() {
  // 4. Use modal hook
  const modal = useWeb3Modal()
  const state = useWeb3ModalState()
  const { themeMode, themeVariables, setThemeMode } = useWeb3ModalTheme()
  const events = useWeb3ModalEvents()

  return (
    <>
      <w3m-button />
      <w3m-network-button />
      <w3m-connect-button />
      <w3m-account-button />

      <button onClick={() => modal.open()}>Connect Wallet</button>
      <button onClick={() => modal.open({ view: 'Networks' })}>Choose Network</button>
      <button onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}>
        Toggle Theme Mode
      </button>
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <pre>{JSON.stringify({ themeMode, themeVariables }, null, 2)}</pre>
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </>
  )
}
