import { EthersTests } from '../../components/Ethers/EthersTests'
import { Web3ModalButtons } from '../../components/Web3ModalButtons'
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'
import { ThemeStore } from '../../utils/StoreUtil'
import { EthersConstants } from '../../utils/EthersConstants'
import { ConstantsUtil } from '../../utils/ConstantsUtil'
import { EthersModalInfo } from '../../components/Ethers/EthersModalInfo'
import { useChakraToast } from '../../components/Toast'

import React from 'react'

const modal = createWeb3Modal({
  ethersConfig: defaultConfig({
    metadata: ConstantsUtil.Metadata,
    defaultChainId: 1,
    chains: EthersConstants.chains,
    coinbasePreference: 'smartWalletOnly'
  }),
  chains: EthersConstants.chains,
  projectId: ConstantsUtil.ProjectId,
  enableAnalytics: true,
  metadata: ConstantsUtil.Metadata,
  termsConditionsUrl: 'https://walletconnect.com/terms',
  privacyPolicyUrl: 'https://walletconnect.com/privacy',
  customWallets: ConstantsUtil.CustomWallets
})

ThemeStore.setModal(modal)
let loaded = false
export default function Ethers() {
  const toast = useChakraToast()

  React.useEffect(() => {
    if (loaded) {
      return
    }
    loaded = true
    // @ts-expect-error - walletConnectProviderInitPromise is private
    modal.walletConnectProviderInitPromise.then(() => {
      // @ts-expect-error - walletConnectProvider is private
      const relayer = modal.walletConnectProvider.signer.client.core.relayer
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
    <>
      <Web3ModalButtons />
      <EthersModalInfo />
      <EthersTests />
    </>
  )
}
