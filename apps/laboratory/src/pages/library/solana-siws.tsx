import { createWeb3Modal, defaultSolanaConfig } from '@web3modal/solana/react'

import { ThemeStore } from '../../utils/StoreUtil'
import { solana, solanaDevnet, solanaTestnet } from '../../utils/ChainsUtil'
import { Web3ModalButtons } from '../../components/Web3ModalButtons'
import { ConstantsUtil } from '../../utils/ConstantsUtil'
import { SolanaTests } from '../../components/Solana/SolanaTests'
import { siwsConfig } from '../../utils/SiwsUtils'
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'
import {
  PhantomWalletAdapter,
  HuobiWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter
} from '@solana/wallet-adapter-wallets'
import { SiwsData } from '../../components/Siws/SiwsData'

const chains = [solana, solanaTestnet, solanaDevnet]

export const solanaConfig = defaultSolanaConfig({
  projectId: ConstantsUtil.ProjectId,
  metadata: ConstantsUtil.Metadata
})

const modal = createWeb3Modal({
  solanaConfig,
  siwsConfig,
  projectId: ConstantsUtil.ProjectId,
  metadata: ConstantsUtil.Metadata,
  chains,
  enableAnalytics: false,
  termsConditionsUrl: 'https://walletconnect.com/terms',
  privacyPolicyUrl: 'https://walletconnect.com/privacy',
  customWallets: ConstantsUtil.CustomWallets,
  wallets: [
    new BackpackWalletAdapter(),
    new HuobiWalletAdapter(),
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TrustWalletAdapter()
  ]
})

ThemeStore.setModal(modal)

export default function Solana() {
  return (
    <>
      <Web3ModalButtons />
      <SiwsData />
      <SolanaTests />
    </>
  )
}
