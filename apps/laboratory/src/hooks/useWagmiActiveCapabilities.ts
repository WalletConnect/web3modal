import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { useAccount, type Connector } from 'wagmi'
import { useState, useEffect } from 'react'
import { type WalletCapabilities } from 'viem'
import { type Chain } from 'wagmi/chains'
import {
  getFilteredCapabilitySupportedChainInfo,
  getProviderCachedCapabilities
} from '../utils/EIP5792Utils'
import { W3mFrameProvider } from '@web3modal/wallet'

type UseWagmiAvailableCapabilitiesParams = {
  capability?: string
  method: string
}

type Provider = Awaited<ReturnType<(typeof EthereumProvider)['init']>> | W3mFrameProvider

export function useWagmiAvailableCapabilities({
  capability,
  method
}: UseWagmiAvailableCapabilitiesParams) {
  const [provider, setProvider] = useState<Provider>()
  const [supported, setSupported] = useState<boolean>(false)

  const { chain, address, connector } = useAccount()

  const [availableCapabilities, setAvailableCapabilities] = useState<
    Record<number, WalletCapabilities> | undefined
  >()

  const supportedChains =
    availableCapabilities && capability
      ? getFilteredCapabilitySupportedChainInfo(capability, availableCapabilities)
      : []
  const supportedChainsName = supportedChains.map(ci => ci.chainName).join(', ')
  const currentChainsInfo = supportedChains.find(
    chainInfo => chainInfo.chainId === Number(chain?.id)
  )

  useEffect(() => {
    if (connector && address && chain) {
      fetchProviderAndAccountCapabilities(address, connector, chain)
    }
  }, [connector, address])

  async function fetchProviderAndAccountCapabilities(
    connectedAccount: `0x${string}`,
    connectedConnector: Connector,
    connectedChain: Chain
  ) {
    const connectedProvider = await connectedConnector.getProvider?.({
      chainId: connectedChain.id
    })
    if (connectedProvider instanceof EthereumProvider) {
      setProvider(connectedProvider)
      const walletCapabilities = getProviderCachedCapabilities(connectedAccount, connectedProvider)
      setAvailableCapabilities(walletCapabilities)
    } else if (connectedProvider instanceof W3mFrameProvider) {
      const walletCapabilities = await connectedProvider.getCapabilities()
      setProvider(connectedProvider)
      setAvailableCapabilities(walletCapabilities)
    }
  }

  function isMethodSupported(): boolean {
    if (provider instanceof W3mFrameProvider) {
      return ['wallet_sendCalls', 'wallet_getCapabilities', 'wallet_getCallsStatus'].includes(
        method
      )
    }

    return Boolean(provider?.signer?.session?.namespaces?.['eip155']?.methods?.includes(method))
  }

  useEffect(() => {
    const isGetCapabilitiesSupported = isMethodSupported()
    setSupported(isGetCapabilitiesSupported)
  }, [provider])

  return {
    provider,
    currentChainsInfo,
    availableCapabilities,
    supportedChains,
    supportedChainsName,
    supported
  }
}
