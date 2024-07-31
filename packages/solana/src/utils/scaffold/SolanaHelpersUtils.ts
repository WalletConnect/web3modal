import { ConstantsUtil as CommonConstantsUtil } from '@web3modal/common'
import { ConstantsUtil, PresetsUtil } from '@web3modal/scaffold-utils'

import { SolConstantsUtil } from './SolanaConstantsUtil.js'

import type { CaipNetwork } from '@web3modal/core'
import type { ExtendedBaseWalletAdapter } from '../../client.js'
import type { SolStoreUtilState } from './SolanaStoreUtil.js'
import type { Chain, Provider } from './SolanaTypesUtil.js'

export const SolHelpersUtil = {
  detectRpcUrl(chain: Chain, projectId: string) {
    if (chain.rpcUrl.includes(new URL(CommonConstantsUtil.BLOCKCHAIN_API_RPC_URL).hostname)) {
      return `${chain.rpcUrl}?chainId=solana:${chain.chainId}&projectId=${projectId}`
    }

    return chain.rpcUrl
  },

  getChain(chains: Chain[], chainId: string | null) {
    const chain = chains.find(lChain => lChain.chainId === chainId)

    if (chain) {
      return chain
    }

    return SolConstantsUtil.DEFAULT_CHAIN
  },

  getChainFromCaip(chains: Chain[], chainCaipId: string | undefined | null = ':') {
    const chainId: string = (chainCaipId?.split(':')[1] ?? '').replace(/\s/gu, '')

    const selectedChain = chains.find(chain => chain.chainId === chainId)

    if (selectedChain) {
      return {
        ...selectedChain,
        id: `solana:${chainId}`,
        imageId: PresetsUtil.EIP155NetworkImageIds[chainId],
        chain: CommonConstantsUtil.CHAIN.SOLANA
      }
    }

    return {
      ...SolConstantsUtil.DEFAULT_CHAIN,
      id: `solana:${chainId}`,
      imageId: PresetsUtil.EIP155NetworkImageIds[chainId],
      chain: CommonConstantsUtil.CHAIN.SOLANA
    }
  },

  getCaipDefaultChain(chain?: Chain) {
    if (!chain) {
      return undefined
    }

    return {
      id: `solana:${chain.chainId}`,
      name: chain.name,
      imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId]
    } as CaipNetwork
  },

  hexStringToNumber(value: string) {
    const hexString = value.startsWith('0x') ? value.slice(2) : value
    const decimalValue = parseInt(hexString, 16)

    return decimalValue
  },

  async getAddress(provider: Provider) {
    const [address] = await provider.request<string[]>({ method: 'getAccountInfo' })

    return address
  },

  async addSolanaChain(provider: Provider, chain: Chain) {
    await provider.request({
      method: 'wallet_addSolanaChain',
      params: [
        {
          chainId: chain.chainId,
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
  },

  getStorageInjectedId: (adapter: ExtendedBaseWalletAdapter) =>
    (adapter.isAnnounced
      ? `${ConstantsUtil.WALLET_STANDARD_CONNECTOR_ID}_${adapter.name}`
      : `${ConstantsUtil.INJECTED_CONNECTOR_ID}_${adapter.name}`) as unknown as Exclude<
      SolStoreUtilState['providerType'],
      undefined
    >
}
