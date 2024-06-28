import * as React from 'react'
import EthereumProvider from '@walletconnect/ethereum-provider'

import { useAccount } from 'wagmi'
import { Web3ModalInfo } from '../Web3ModalInfo'
import { useSiweSession } from '@web3modal/siwe'
import { Heading } from '@chakra-ui/react'

export function WagmiModalInfo() {
  const { isConnected, address, chainId, connector } = useAccount()
  const [clientId, setClientId] = React.useState<string | null>(null)
  const { session, status } = useSiweSession()

  async function getClientId() {
    if (connector?.type === 'walletConnect') {
      const provider = await connector?.getProvider?.()
      const ethereumProvider = provider as EthereumProvider

      return ethereumProvider?.signer?.client?.core?.crypto?.getClientId()
    }

    return null
  }

  React.useEffect(() => {
    getClientId().then(setClientId)
  }, [connector])

  return isConnected ? (
    <>
      <Web3ModalInfo address={address} chainId={chainId} clientId={clientId} />
      {status !== 'uninitialized' && (
        <>
          <Heading size="md">SIWE status: {status}</Heading>
          <Web3ModalInfo address={session?.address} chainId={session?.chainId} />
        </>
      )}
    </>
  ) : null
}
