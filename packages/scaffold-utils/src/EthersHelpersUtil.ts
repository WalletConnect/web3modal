import type { CaipNetwork } from '@web3modal/core'
import { ConstantsUtil } from './ConstantsUtil.js'
import { PresetsUtil } from './PresetsUtil.js'
import type { Chain, Provider } from './EthersTypesUtil.js'

export const EthersHelpersUtil = {
  getCaipDefaultChain(chain?: Chain) {
    if (!chain) {
      return undefined
    }

    return {
      id: `${ConstantsUtil.EIP155}:${chain.chainId}`,
      name: chain.name,
      imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId]
    } as CaipNetwork
  },
  hexStringToNumber(value: string) {
    const string = value.startsWith('0x') ? value.slice(2) : value
    const number = parseInt(string, 16)

    return number
  },
  numberToHexString(value: number) {
    return `0x${value.toString(16)}`
  },
  async getUserInfo(provider: Provider) {
    const [addresses, chainId] = await Promise.all([
      EthersHelpersUtil.getAddresses(provider),
      EthersHelpersUtil.getChainId(provider)
    ])

    return { chainId, addresses }
  },
  async getChainId(provider: Provider) {
    const chainId = await provider.request<string | number>({ method: 'eth_chainId' })

    return Number(chainId)
  },
  async getAddress(provider: Provider) {
    const [address] = await provider.request<string[]>({ method: 'eth_accounts' })

    return address
  },
  async getAddresses(provider: Provider) {
    const addresses = await provider.request<string[]>({ method: 'eth_accounts' })

    return addresses
  },
  async addEthereumChain(provider: Provider, chain: Chain) {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: EthersHelpersUtil.numberToHexString(chain.chainId),
          rpcUrls: [chain.rpcUrl],
          chainName: chain.name,
          nativeCurrency: {
            name: chain.currency,
            decimals: 18,
            symbol: chain.currency
          },
          blockExplorerUrls: [chain.explorerUrl],
          iconUrls: [PresetsUtil.EIP155NetworkImageIds[chain.chainId]]
        }
      ]
    })
  }
}
