import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { useAccount, type Connector } from 'wagmi'
import { useState, useEffect } from 'react'
import { type WalletCapabilities } from 'viem'
import { type Chain } from 'wagmi/chains'
import {
  getFilteredCapabilitySupportedChainInfo,
  getProviderCachedCapabilities
} from '../utils/EIP5792Utils'

type UseWagmiAvailableCapabilitiesParams = {
  capability?: string
  method: string
}

export function useWagmiAvailableCapabilities({
  capability,
  method
}: UseWagmiAvailableCapabilitiesParams) {
  const [ethereumProvider, setEthereumProvider] =
    useState<Awaited<ReturnType<(typeof EthereumProvider)['init']>>>()

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
    if (connectedProvider) {
      const provider = connectedProvider as Awaited<ReturnType<(typeof EthereumProvider)['init']>>
      setEthereumProvider(provider)
      let walletCapabilities = undefined
      walletCapabilities = getProviderCachedCapabilities(connectedAccount, provider)
      setAvailableCapabilities(walletCapabilities)
    }
  }

  function isMethodSupported(): boolean {
    return Boolean(
      ethereumProvider?.signer?.session?.namespaces?.['eip155']?.methods?.includes(method)
    )
  }

  return {
    ethereumProvider,
    currentChainsInfo,
    availableCapabilities,
    supportedChains,
    supportedChainsName,
    isMethodSupported
  }
}
