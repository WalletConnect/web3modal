import * as React from 'react'
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react'
import EthereumProvider from '@walletconnect/ethereum-provider'

import { AppKitInfo } from '../AppKitInfo'

export function EthersModalInfo() {
  const { isConnected, address, chainId } = useWeb3ModalAccount()
  const [ready, setReady] = React.useState(false)
  const [clientId, setClientId] = React.useState<string | null>(null)
  const { walletProvider, walletProviderType } = useWeb3ModalProvider()
  async function getClientId() {
    if (walletProviderType === 'walletConnect') {
      const ethereumProvider = walletProvider as unknown as EthereumProvider

      return await ethereumProvider?.signer?.client?.core?.crypto?.getClientId()
    }

    return null
  }

  React.useEffect(() => {
    getClientId().then(setClientId)
  }, [walletProvider])

  React.useEffect(() => {
    setReady(true)
  }, [])

  return ready && isConnected ? (
    <AppKitInfo address={address} chainId={chainId} clientId={clientId} />
  ) : null
}
