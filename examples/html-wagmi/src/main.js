import { arbitrum, mainnet } from '@rerock/base/chains'
import { EVMWagmiClient } from '@rerock/appkit-adapter-wagmi'
import { createWeb3Modal } from '@rerock/base'

// @ts-expect-error 1. Get projectId
const projectId = import.meta.env.VITE_PROJECT_ID
if (!projectId) {
  throw new Error('VITE_PROJECT_ID is not set')
}

// 2. Create Wagmi adapter
const wagmiAdapter = new EVMWagmiClient({
  caipNetworks: [mainnet, arbitrum],
  projectId
})

// 3. Create modal
const modal = createWeb3Modal({
  adapters: [wagmiAdapter],
  metadata: {
    name: 'Html Example',
    description: 'Html Example',
    url: 'https://web3modal.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  caipNetworks: [mainnet, arbitrum],
  projectId,
  themeMode: 'light'
})

// 4. Trigger modal programaticaly
const openConnectModalBtn = document.getElementById('open-connect-modal')
const openNetworkModalBtn = document.getElementById('open-network-modal')

openConnectModalBtn.addEventListener('click', () => modal.open())
openNetworkModalBtn.addEventListener('click', () => modal.open({ view: 'Networks' }))

// 5. Alternatively use w3m component buttons (see index.html)
