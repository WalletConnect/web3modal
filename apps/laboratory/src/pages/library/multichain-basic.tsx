import { createAppKit } from '@reown/appkit/react'
import { ThemeStore } from '../../utils/StoreUtil'
import { ConstantsUtil } from '../../utils/ConstantsUtil'
import { AppKitButtons } from '../../components/AppKitButtons'
import { mainnet, optimism, arbitrum, aurora, zora, gnosis, solana } from '@reown/appkit/networks'
import { MultiChainInfo } from '../../components/MultiChainInfo'

import { UpaTests } from '../../components/UPA/UpaTests'

const modal = createAppKit({
  networks: [mainnet, optimism, arbitrum, aurora, zora, gnosis, solana],
  projectId: ConstantsUtil.ProjectId,
  metadata: ConstantsUtil.Metadata
})

ThemeStore.setModal(modal)

export default function MultiChainWagmiAdapterOnly() {
  return (
    <>
      <AppKitButtons />
      <MultiChainInfo />
      <UpaTests />
    </>
  )
}
