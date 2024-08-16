import type { Chain } from '@web3modal/scaffold-utils'
import type { Namespace } from './TypesUtil.js'
import type { CaipNetwork } from '@web3modal/common'

export const WcHelpersUtil = {
  hexStringToNumber(value: string) {
    const string = value.startsWith('0x') ? value.slice(2) : value
    const number = parseInt(string, 16)

    return number
  },
  numberToHexString(value: number) {
    return `0x${value.toString(16)}`
  },
  getMethodsByChainType(chainType: string): string[] {
    switch (chainType) {
      case 'solana':
        return ['solana_signMessage']
      case 'evm':
        return ['personal_sign']
      case 'polkadot':
        return []
      case 'cosmos':
        return []
      default:
        return []
    }
  },
  createNamespaces(caipNetworks: CaipNetwork[]): Namespace {
    return caipNetworks.reduce<Namespace>((acc, chain) => {
      const { chainId, chain: chainType, rpcUrl } = chain
      // eslint-disable-next-line @typescript-eslint/no-useless-template-literals
      const namespaceKey = `${chainType === 'evm' ? 'eip155' : chainType}`
      const methods = this.getMethodsByChainType(chainType)

      if (!acc[namespaceKey]) {
        acc[namespaceKey] = {
          methods,
          events: ['accountsChanged', 'chainChanged'],
          chains: [],
          rpcMap: {}
        }
      }

      const fullChainId = `${namespaceKey}:${chainId}`
      // @ts-ignore
      acc[namespaceKey].chains.push(fullChainId)
      // @ts-ignore
      acc[namespaceKey].rpcMap[fullChainId] = rpcUrl
      // typeof rpcUrl === 'function' ? rpcUrl(chainId) : rpcUrl

      return acc
    }, {})
  },
  extractDetails(fullIdentifier: string | undefined): {
    chainType: string | undefined
    chainId: string | undefined
    address?: string
  } {
    if (!fullIdentifier) {
      return {
        chainType: undefined,
        chainId: undefined
      }
    }

    const parts = fullIdentifier.split(':')
    if (parts.length < 2 || parts.length > 3) {
      throw new Error(`Invalid format: ${fullIdentifier}`)
    }

    const [chainType, chainId, address] = parts

    return {
      chainType,
      chainId,
      address
    }
  }
}
