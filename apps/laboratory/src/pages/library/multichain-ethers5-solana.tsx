import { createWeb3Modal } from '@rerock/base/react'
import { EVMEthersClient } from '@rerock/adapter-ethers'
import { SolanaWeb3JsClient } from '@rerock/adapter-solana'
import { ThemeStore } from '../../utils/StoreUtil'
import { ConstantsUtil } from '../../utils/ConstantsUtil'
import { mainnet, solana, arbitrum, optimism } from '@rerock/base/chains'
import { AppKitButtons } from '../../components/AppKitButtons'
import { HuobiWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { MultiChainTestsEthersSolana } from '../../components/MultiChainTestsEthersSolana'
import { siweConfig } from '../../utils/SiweUtils'

const etherAdapter = new EVMEthersClient()

const solanaWeb3JsAdapter = new SolanaWeb3JsClient({
  wallets: [new HuobiWalletAdapter(), new SolflareWalletAdapter()]
})

const modal = createWeb3Modal({
  adapters: [etherAdapter, solanaWeb3JsAdapter],
  projectId: ConstantsUtil.ProjectId,
  siweConfig,
  caipNetworks: [mainnet, arbitrum, optimism, solana],
  features: {
    analytics: true
  },
  termsConditionsUrl: 'https://walletconnect.com/terms',
  privacyPolicyUrl: 'https://walletconnect.com/privacy'
})

ThemeStore.setModal(modal)

export default function MultiChainEthers5Solana() {
  return (
    <>
      <AppKitButtons />
      <MultiChainTestsEthersSolana />
    </>
  )
}
