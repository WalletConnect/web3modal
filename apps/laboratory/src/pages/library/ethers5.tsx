import { EthersTests } from '../../components/Ethers/EthersTests'
import { Web3ModalButtons } from '../../components/Web3ModalButtons'
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/react'
import { ThemeStore } from '../../utils/StoreUtil'
import { ConstantsUtil } from '../../utils/ConstantsUtil'
import { EthersModalInfo } from '../../components/Ethers/EthersModalInfo'

const SEPOLIA_NETWORK = {
  chainId: 11155111,
  name: 'Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: 'https://rpc.sepolia.org'
}

function getConfig() {
  const metadata = {
    name: 'F test',
    description: 'F test desc',
    url: 'https://forbes.com',
    icons: ['']
  }

  return {
    configOptions: {
      metadata,
      enableEIP6963: false
    },
    modalOptions: {
      chains: [SEPOLIA_NETWORK],
      projectId: ConstantsUtil.ProjectId,
      enableAnalytics: false,
      enableEmail: false,
      themeVariables: {
        // Styling to match Forbes designs
        '--w3m-border-radius-master': '8',
        '--w3m-accent': '#EC002A',
        '--w3m-color-mix-strength': 0
      },
      featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa'
      ],
      includeWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa'
      ],
      allowUnsupportedChain: false,
      allWallets: 'HIDE' as const
    }
  }
}
const config = getConfig()
const modal = createWeb3Modal({
  ethersConfig: defaultConfig(config.configOptions),
  ...config.modalOptions
})

ThemeStore.setModal(modal)

export default function Ethers() {
  return (
    <>
      <Web3ModalButtons />
      <EthersModalInfo />
      <EthersTests />
    </>
  )
}
