import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { getChain } from './ChainsUtil'
import { fromHex } from 'viem'
import type { WalletCapabilities } from 'viem'
import { W3mFrameProvider } from '@web3modal/wallet'

export const EIP_5792_RPC_METHODS = {
  WALLET_GET_CALLS_STATUS: 'wallet_getCallsStatus',
  WALLET_SEND_CALLS: 'wallet_sendCalls'
}

export const WALLET_CAPABILITIES = {
  ATOMIC_BATCH: 'atomicBatch',
  PAYMASTER_SERVICE: 'paymasterService'
}

export async function getCapabilitySupportedChainInfo(
  capability: string,
  provider: Awaited<ReturnType<(typeof EthereumProvider)['init']>> | W3mFrameProvider,
  address: string
): Promise<
  {
    chainId: number
    chainName: string
  }[]
> {
  if (!(provider instanceof EthereumProvider || provider instanceof W3mFrameProvider) || !address) {
    return []
  }

  if (provider instanceof W3mFrameProvider) {
    const rawCapabilities = await provider.getCapabilities()
    const mappedCapabilities = Object.entries(rawCapabilities).map(([chainId]) => {
      const chain = getChain(fromHex(chainId as `0x${string}`, 'number'))

      return {
        chainId: fromHex(chainId as `0x${string}`, 'number'),
        chainName: chain?.name ?? `Unknown Chain (${chainId})`
      }
    })

    return mappedCapabilities
  }

  const walletCapabilitiesString = provider.signer?.session?.sessionProperties?.['capabilities']
  if (!walletCapabilitiesString) {
    return []
  }
  const walletCapabilities = JSON.parse(walletCapabilitiesString)
  const accountCapabilities = walletCapabilities[address]
  if (!accountCapabilities) {
    return []
  }
  const perChainCapabilities = convertCapabilitiesToRecord(accountCapabilities)

  return getFilteredCapabilitySupportedChainInfo(capability, perChainCapabilities)
}
export function getFilteredCapabilitySupportedChainInfo(
  capability: string,
  capabilities: Record<number, WalletCapabilities>
): {
  chainId: number
  chainName: string
}[] {
  const chainIds = Object.keys(capabilities)
  const chainInfo = chainIds
    .filter(chainId => {
      const capabilitiesPerChain = capabilities[parseInt(chainId, 10)]

      return capabilitiesPerChain?.[capability]?.supported === true
    })
    .map(cId => {
      const chainId = parseInt(cId, 10)
      const capabilityChain = getChain(chainId)

      return {
        chainId,
        chainName: capabilityChain?.name ?? `Unknown Chain(${chainId})`
      }
    })

  return chainInfo
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function convertCapabilitiesToRecord(
  accountCapabilities: Record<string, any>
): Record<number, Record<string, any>> {
  return Object.fromEntries(
    Object.entries(accountCapabilities).map(([key, value]) => [parseInt(key, 16), value])
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
