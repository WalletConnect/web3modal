import { EthersConstantsUtil } from '../utils/EthersConstantsUtil.js'
import { EthersHelpersUtil } from '../utils/EthersHelpersUtil.js'
import { EthersStoreUtil, type EthersStoreUtilState } from '../utils/EthersStoreUtil.js'
import { ConstantsUtil } from '@web3modal/scaffold-utils'
import type { Provider } from '../utils/EthersTypesUtil.js'
import type { Connector } from './types.js'

export function injected({
  type,
  id
}: { type?: EthersStoreUtilState['providerType']; id?: string } = {}): Connector {
  const connectorType = type ?? 'injected'
  const connectorId = id ?? ConstantsUtil.INJECTED_CONNECTOR_ID

  function getProvider() {
    if (typeof window !== 'undefined') {
      return window.ethereum as Provider | undefined
    }

    return undefined
  }

  function watch() {
    const provider = getProvider()

    function disconnectHandler() {
      localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
      EthersStoreUtil.reset()

      provider?.removeListener('disconnect', disconnectHandler)
      provider?.removeListener('accountsChanged', accountsChangedHandler)
      provider?.removeListener('chainChanged', chainChangedHandler)
    }

    function accountsChangedHandler(accounts: string[]) {
      const currentAccount = accounts?.[0]
      if (currentAccount) {
        EthersStoreUtil.setAddress(currentAccount)
      } else {
        localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
        EthersStoreUtil.reset()
      }
    }

    function chainChangedHandler(chainId: string) {
      if (chainId) {
        EthersStoreUtil.setChainId(Number(chainId))
      }
    }

    if (provider) {
      provider.on('disconnect', disconnectHandler)
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('chainChanged', chainChangedHandler)
    }
  }

  async function setProvider(provider: Provider) {
    window?.localStorage.setItem(EthersConstantsUtil.WALLET_ID, connectorId)

    if (provider) {
      const { address, chainId } = await EthersHelpersUtil.getUserInfo(provider)
      if (address && chainId) {
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType(connectorType)
        EthersStoreUtil.setProvider(provider)
        EthersStoreUtil.setIsConnected(true)
        EthersStoreUtil.setAddress(address)
      }
    }
  }

  function checkActive() {
    const provider = getProvider()
    const walletId = localStorage.getItem(EthersConstantsUtil.WALLET_ID)

    if (provider) {
      if (walletId === id) {
        setProvider(provider)
        watch()
      }
    }
  }

  async function connect() {
    const provider = getProvider()
    if (!provider) {
      throw new Error('provider is undefined')
    }
    try {
      EthersStoreUtil.setError(undefined)
      await provider.request({ method: 'eth_requestAccounts' })
      setProvider(provider)
    } catch (error) {
      EthersStoreUtil.setError(error)
    }
  }

  function disconnect() {
    const provider = getProvider()

    localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
    EthersStoreUtil.reset()

    provider?.emit('disconnect')
  }

  async function switchNetwork(chainId: number) {
    const provider = getProvider()
    const chains = EthersStoreUtil.state.supportedChains
    const chain = chains.find(c => c.chainId === chainId)

    if (provider && chain) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: EthersHelpersUtil.numberToHexString(chain.chainId) }]
        })
        EthersStoreUtil.setChainId(chain.chainId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (switchError: any) {
        if (
          switchError.code === EthersConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID ||
          switchError.code === EthersConstantsUtil.ERROR_CODE_DEFAULT ||
          switchError?.data?.originalError?.code ===
            EthersConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID
        ) {
          await EthersHelpersUtil.addEthereumChain(provider, chain)
        } else {
          throw new Error('Chain is not supported')
        }
      }
    } else if (!chain) {
      throw new Error('Chain is not supported')
    }
  }

  return {
    id: connectorId,
    type: connectorType,
    getProvider,
    watch,
    checkActive,
    setProvider,
    connect,
    disconnect,
    switchNetwork
  }
}
