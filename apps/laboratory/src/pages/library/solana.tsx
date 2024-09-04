import { createWeb3Modal } from '@rerock/base/react'
import { SolanaWeb3JsClient } from '@rerock/adapter-solana/react'
import { ThemeStore } from '../../utils/StoreUtil'
import { ConstantsUtil } from '../../utils/ConstantsUtil'
import { solana, solanaDevnet, solanaTestnet } from '@rerock/base/chains'

import { HuobiWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { AppKitButtons } from '../../components/AppKitButtons'
import { SolanaTests } from '../../components/Solana/SolanaTests'

const solanaWeb3JsAdapter = new SolanaWeb3JsClient({
  wallets: [new HuobiWalletAdapter(), new SolflareWalletAdapter()]
})

const modal = createWeb3Modal({
  adapters: [solanaWeb3JsAdapter],
  caipNetworks: [solana, solanaTestnet, solanaDevnet],
  projectId: ConstantsUtil.ProjectId,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'github', 'apple', 'discord']
  },
  metadata: ConstantsUtil.Metadata
})

ThemeStore.setModal(modal)

export default function MultiChainSolanaAdapterOnly() {
  return (
    <>
      <AppKitButtons />
      <SolanaTests />
    </>
  )
}
