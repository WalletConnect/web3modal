/* eslint-disable max-depth */
import type {
  CaipAddress,
  CaipNetwork,
  CaipNetworkId,
  ConnectionControllerClient,
  Connector,
  NetworkControllerClient,
  PublicStateControllerState,
  SendTransactionArgs,
  Token,
  WriteContractArgs
} from '@web3modal/scaffold'
import { ConstantsUtil, PresetsUtil, HelpersUtil } from '@web3modal/scaffold-utils'
import { ConstantsUtil as CommonConstantsUtil } from '@web3modal/common'
import EthereumProvider, { OPTIONAL_METHODS } from '@walletconnect/ethereum-provider'
import { getChainsFromAccounts } from '@walletconnect/utils'
import { ConstantsUtil as CommonConstants } from '@web3modal/common'
import type { Chain as AvailableChain } from '@web3modal/common'
import type {
  Address,
  Metadata,
  Provider,
  ProviderType,
  Chain,
  EthersStoreUtilState
} from '@web3modal/scaffold-utils/ethers'
import {
  formatEther,
  JsonRpcProvider,
  InfuraProvider,
  getAddress as getOriginalAddress,
  parseUnits,
  formatUnits,
  JsonRpcSigner,
  BrowserProvider,
  Contract,
  hexlify,
  toUtf8Bytes,
  isHexString
} from 'ethers'
import {
  EthersConstantsUtil,
  EthersHelpersUtil,
  EthersStoreUtil
} from '@web3modal/scaffold-utils/ethers'
import type { EthereumProviderOptions } from '@walletconnect/ethereum-provider'
import type { Eip1193Provider } from 'ethers'
import {
  W3mFrameProvider,
  W3mFrameHelpers,
  W3mFrameRpcConstants,
  W3mFrameConstants
} from '@web3modal/wallet'
import type { CombinedProvider } from '@web3modal/scaffold-utils/ethers'
import { NetworkUtil } from '@web3modal/common'
import type { W3mFrameTypes } from '@web3modal/wallet'
import type { AppKit } from '../../../src/client.js'
import type { AppKitOptions } from '../../../utils/TypesUtil.js'
import type { OptionsControllerState } from '@web3modal/core'

// -- Types ---------------------------------------------------------------------
export interface AdapterOptions extends Pick<AppKitOptions, 'siweConfig'> {
  ethersConfig: ProviderType
  chains: Chain[]
  defaultChain?: Chain
  chainImages?: Record<number, string>
  connectorImages?: Record<string, string>
  tokens?: Record<number, Token>
}

type CoinbaseProviderError = {
  code: number
  message: string
  data: string | undefined
}

declare global {
  interface Window {
    ethereum?: Record<string, unknown>
  }
}

// @ts-expect-error: Overridden state type is correct
interface Web3ModalState extends PublicStateControllerState {
  selectedNetworkId: number | undefined
}

interface Info {
  uuid: string
  name: string
  icon: string
  rdns: string
}

interface EIP6963ProviderDetail {
  info: Info
  provider: Provider
}

interface ExternalProvider extends EthereumProvider {
  accounts: string[]
}

// -- Client --------------------------------------------------------------------
export class EVMEthersClient {
  // -- Private variables -------------------------------------------------------
  private appKit: AppKit | undefined = undefined

  private hasSyncedConnectedAccount = false

  private EIP6963Providers: EIP6963ProviderDetail[] = []

  private walletConnectProvider?: EthereumProvider

  private walletConnectProviderInitPromise?: Promise<void>

  private projectId = ''

  private chains: Chain[]

  private ethersConfig: AdapterOptions['ethersConfig']

  private metadata?: Metadata

  private authProvider?: W3mFrameProvider

  // -- Public variables --------------------------------------------------------
  public options: AppKitOptions | undefined = undefined

  public chain: AvailableChain = CommonConstantsUtil.CHAIN.EVM

  public networkControllerClient: NetworkControllerClient

  public connectionControllerClient: ConnectionControllerClient

  public siweControllerClient = this.options?.siweConfig

  public tokens = HelpersUtil.getCaipTokens(this.options?.tokens)

  public defaultChain: CaipNetwork | undefined = undefined

  // -- Public -------------------------------------------------------------------
  public constructor(options: AdapterOptions) {
    const { ethersConfig, siweConfig, chains, defaultChain } = options

    if (!ethersConfig) {
      throw new Error('web3modal:constructor - ethersConfig is undefined')
    }

    this.ethersConfig = ethersConfig
    this.siweControllerClient = this.options?.siweConfig
    this.tokens = HelpersUtil.getCaipTokens(options.tokens)
    this.defaultChain = {
      ...EthersHelpersUtil.getCaipDefaultChain(defaultChain),
      chain: CommonConstantsUtil.CHAIN.EVM
    } as CaipNetwork
    this.chains = chains

    this.networkControllerClient = {
      switchCaipNetwork: async caipNetwork => {
        const chainId = NetworkUtil.caipNetworkIdToNumber(caipNetwork?.id)
        if (chainId) {
          try {
            EthersStoreUtil.setError(undefined)
            await this.switchNetwork(chainId)
          } catch (error) {
            EthersStoreUtil.setError(error)
            throw new Error('networkControllerClient:switchCaipNetwork - unable to switch chain')
          }
        }
      },

      getApprovedCaipNetworksData: async () =>
        new Promise(async resolve => {
          const walletChoice = localStorage.getItem(EthersConstantsUtil.WALLET_ID)
          if (walletChoice?.includes(ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID)) {
            const provider = await this.getWalletConnectProvider()
            if (!provider) {
              throw new Error(
                'networkControllerClient:getApprovedCaipNetworks - connector is undefined'
              )
            }
            const ns = provider.signer?.session?.namespaces
            const nsMethods = ns?.[ConstantsUtil.EIP155]?.methods
            const nsChains = getChainsFromAccounts(
              ns?.[ConstantsUtil.EIP155]?.accounts || []
            ) as CaipNetworkId[]

            const result = {
              supportsAllNetworks: nsMethods?.includes(ConstantsUtil.ADD_CHAIN_METHOD) ?? false,
              approvedCaipNetworkIds: nsChains as CaipNetworkId[] | undefined
            }

            resolve(result)
          } else {
            const result = {
              approvedCaipNetworkIds: undefined,
              supportsAllNetworks: true
            }

            resolve(result)
          }
        })
    }

    this.connectionControllerClient = {
      connectWalletConnect: async onUri => {
        const WalletConnectProvider = await this.getWalletConnectProvider()
        if (!WalletConnectProvider) {
          throw new Error('connectionControllerClient:getWalletConnectUri - provider is undefined')
        }

        WalletConnectProvider.on('display_uri', (uri: string) => {
          onUri(uri)
        })

        // When connecting through walletconnect, we need to set the clientId in the store
        const clientId = await WalletConnectProvider.signer?.client?.core?.crypto?.getClientId()
        if (clientId) {
          this.appKit?.setClientId(clientId)
        }

        const params = await siweConfig?.getMessageParams?.()
        // Must perform these checks to satify optional types
        if (siweConfig?.options?.enabled && params && Object.keys(params || {}).length > 0) {
          const { SIWEController, getDidChainId, getDidAddress } = await import('@web3modal/siwe')

          // Make active chain first in requested chains to make it default for siwe message
          const chainId = NetworkUtil.caipNetworkIdToNumber(this.appKit?.getCaipNetwork()?.id)
          let reorderedChains = params.chains
          if (chainId) {
            reorderedChains = [chainId, ...params.chains.filter(c => c !== chainId)]
          }

          const result = await WalletConnectProvider.authenticate({
            nonce: await siweConfig.getNonce(),
            methods: [...OPTIONAL_METHODS],
            ...params,
            chains: reorderedChains
          })
          // Auths is an array of signed CACAO objects https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-74.md
          const signedCacao = result?.auths?.[0]
          if (signedCacao) {
            const { p, s } = signedCacao
            const cacaoChainId = getDidChainId(p.iss)
            const address = getDidAddress(p.iss)
            if (address && cacaoChainId) {
              SIWEController.setSession({
                address,
                chainId: parseInt(cacaoChainId, 10)
              })
            }
            try {
              // Kicks off verifyMessage and populates external states
              const message = WalletConnectProvider.signer.client.formatAuthMessage({
                request: p,
                iss: p.iss
              })

              await SIWEController.verifyMessage({
                message,
                signature: s.s,
                cacao: signedCacao
              })
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Error verifying message', error)
              // eslint-disable-next-line no-console
              await WalletConnectProvider.disconnect().catch(console.error)
              // eslint-disable-next-line no-console
              await SIWEController.signOut().catch(console.error)
              throw error
            }
          }
        } else {
          await WalletConnectProvider.connect({ optionalChains: this.chains.map(c => c.chainId) })
        }

        await this.setWalletConnectProvider()
      },

      //  @ts-expect-error TODO expected types in arguments are incomplete
      connectExternal: async ({
        id,
        info,
        provider
      }: {
        id: string
        info: Info
        provider: Provider
      }) => {
        // If connecting with something else than walletconnect, we need to clear the clientId in the store
        this.appKit?.setClientId(null)
        if (id === ConstantsUtil.INJECTED_CONNECTOR_ID) {
          const InjectedProvider = ethersConfig.injected
          if (!InjectedProvider) {
            throw new Error('connectionControllerClient:connectInjected - provider is undefined')
          }
          try {
            EthersStoreUtil.setError(undefined)
            await InjectedProvider.request({ method: 'eth_requestAccounts' })
            this.setInjectedProvider(ethersConfig)
          } catch (error) {
            EthersStoreUtil.setError(error)
          }
        } else if (id === ConstantsUtil.EIP6963_CONNECTOR_ID && info && provider) {
          try {
            EthersStoreUtil.setError(undefined)
            await provider.request({ method: 'eth_requestAccounts' })
            this.setEIP6963Provider(provider, info.name)
          } catch (error) {
            EthersStoreUtil.setError(error)
          }
        } else if (id === ConstantsUtil.COINBASE_SDK_CONNECTOR_ID) {
          const CoinbaseProvider = ethersConfig.coinbase
          if (!CoinbaseProvider) {
            throw new Error('connectionControllerClient:connectCoinbase - connector is undefined')
          }

          try {
            EthersStoreUtil.setError(undefined)
            await CoinbaseProvider.request({ method: 'eth_requestAccounts' })
            this.setCoinbaseProvider(ethersConfig)
          } catch (error) {
            EthersStoreUtil.setError(error)
            throw new Error((error as CoinbaseProviderError).message)
          }
        } else if (id === ConstantsUtil.AUTH_CONNECTOR_ID) {
          this.setAuthProvider()
        }
      },

      checkInstalled: (ids?: string[]) => {
        if (!ids) {
          return Boolean(window.ethereum)
        }

        if (ethersConfig.injected) {
          if (!window?.ethereum) {
            return false
          }
        }

        return ids.some(id => Boolean(window.ethereum?.[String(id)]))
      },

      disconnect: async () => {
        const provider = EthersStoreUtil.state.provider
        const providerType = EthersStoreUtil.state.providerType
        localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
        EthersStoreUtil.reset()
        this.appKit?.setClientId(null)
        if (siweConfig?.options?.signOutOnDisconnect) {
          const { SIWEController } = await import('@web3modal/siwe')
          await SIWEController.signOut()
        }
        if (
          providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID ||
          providerType === 'coinbaseWalletSDK'
        ) {
          const ethProvider = provider
          await (ethProvider as unknown as EthereumProvider).disconnect()
          // eslint-disable-next-line no-negated-condition
        } else if (providerType === ConstantsUtil.AUTH_CONNECTOR_ID) {
          await this.authProvider?.disconnect()
        } else if (providerType === ConstantsUtil.EIP6963_CONNECTOR_ID && provider) {
          await this.disconnectProvider(provider)
          provider.emit('disconnect')
        } else if (providerType === ConstantsUtil.INJECTED_CONNECTOR_ID) {
          const InjectedProvider = ethersConfig.injected
          if (InjectedProvider) {
            await this.disconnectProvider(InjectedProvider)
            InjectedProvider.emit('disconnect')
          }
        } else {
          provider?.emit('disconnect')
        }
        localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
        EthersStoreUtil.reset()
      },

      signMessage: async (message: string) => {
        const provider = EthersStoreUtil.state.provider
        if (!provider) {
          throw new Error('connectionControllerClient:signMessage - provider is undefined')
        }
        const hexMessage = isHexString(message) ? message : hexlify(toUtf8Bytes(message))
        const signature = await provider.request({
          method: 'personal_sign',
          params: [hexMessage, this.getAddress()]
        })

        return signature as `0x${string}`
      },

      parseUnits: (value: string, decimals: number) => parseUnits(value, decimals),

      formatUnits: (value: bigint, decimals: number) => formatUnits(value, decimals),

      async estimateGas(data) {
        const { chainId, provider, address } = EthersStoreUtil.state

        if (!provider) {
          throw new Error('connectionControllerClient:sendTransaction - provider is undefined')
        }

        if (!address) {
          throw new Error('connectionControllerClient:sendTransaction - address is undefined')
        }

        const txParams = {
          from: data.address,
          to: data.to,
          data: data.data,
          type: 0
        }

        const browserProvider = new BrowserProvider(provider, chainId)
        const signer = new JsonRpcSigner(browserProvider, address)
        const gas = await signer.estimateGas(txParams)

        return gas
      },

      sendTransaction: async (data: SendTransactionArgs) => {
        const { chainId, provider, address } = EthersStoreUtil.state

        if (!provider) {
          throw new Error('ethersClient:sendTransaction - provider is undefined')
        }

        if (!address) {
          throw new Error('ethersClient:sendTransaction - address is undefined')
        }

        const txParams = {
          to: data.to,
          value: data.value,
          gasLimit: data.gas,
          gasPrice: data.gasPrice,
          data: data.data,
          type: 0
        }

        const browserProvider = new BrowserProvider(provider, chainId)
        const signer = new JsonRpcSigner(browserProvider, address)
        const txResponse = await signer.sendTransaction(txParams)
        const txReceipt = await txResponse.wait()

        return (txReceipt?.hash as `0x${string}`) || null
      },

      writeContract: async (data: WriteContractArgs) => {
        const { chainId, provider, address } = EthersStoreUtil.state

        if (!provider) {
          throw new Error('ethersClient:writeContract - provider is undefined')
        }

        if (!address) {
          throw new Error('ethersClient:writeContract - address is undefined')
        }

        const browserProvider = new BrowserProvider(provider, chainId)
        const signer = new JsonRpcSigner(browserProvider, address)
        const contract = new Contract(data.tokenAddress, data.abi, signer)

        if (!contract || !data.method) {
          throw new Error('Contract method is undefined')
        }

        const method = contract[data.method]
        if (method) {
          const tx = await method(data.receiverAddress, data.tokenAmount)

          return tx
        }

        throw new Error('Contract method is undefined')
      },
      getEnsAddress: async (value: string) => {
        try {
          const chainId = NetworkUtil.caipNetworkIdToNumber(this.appKit?.getCaipNetwork()?.id)
          let ensName: string | null = null
          let wcName: boolean | string = false

          if (value?.endsWith(CommonConstants.WC_NAME_SUFFIX)) {
            wcName = (await this.appKit?.resolveWalletConnectName(value)) || false
          }

          if (chainId === 1) {
            const ensProvider = new InfuraProvider('mainnet')

            ensName = await ensProvider.resolveName(value)
          }

          return ensName || wcName || false
        } catch {
          return false
        }
      },

      getEnsAvatar: async (value: string) => {
        const { chainId } = EthersStoreUtil.state
        if (chainId && chainId === 1) {
          const ensProvider = new InfuraProvider('mainnet')

          const avatar = await ensProvider.getAvatar(value)

          if (avatar) {
            return avatar
          }

          return false
        }

        return false
      }
    }
  }

  public construct(appKit: AppKit, options: OptionsControllerState) {
    if (!options.projectId) {
      throw new Error('web3modal:initialize - projectId is undefined')
    }

    this.appKit = appKit
    this.options = options
    this.projectId = options.projectId
    this.metadata = this.ethersConfig.metadata

    this.createProvider()

    EthersStoreUtil.subscribeKey('address', () => {
      this.syncAccount()
    })

    EthersStoreUtil.subscribeKey('chainId', () => {
      this.syncNetwork(this.options?.chainImages)
    })

    /*
     * When the client is loaded, this.getChainId stays undefined even if the user switches networks via w3modal <networks> button.
     * This subscribes to the network change and sets the chainId in the store so it can be used when connecting.
     * Especially important for email connector where correct chainId dictates which account is available e.g. smart account, eoa.
     */
    this.appKit?.subscribeCaipNetworkChange(network => {
      if (!this.getChainId() && network) {
        EthersStoreUtil.setChainId(NetworkUtil.caipNetworkIdToNumber(network.id))
      }
    })

    this.appKit?.subscribeShouldUpdateToAddress((address?: string) => {
      if (!address) {
        return
      }
      EthersStoreUtil.setAddress(getOriginalAddress(address) as Address)
    })

    this.syncRequestedNetworks(this.chains, this.options?.chainImages)
    this.syncConnectors(this.ethersConfig)

    // Setup EIP6963 providers
    if (typeof window !== 'undefined') {
      this.listenConnectors(true)
      this.checkActive6963Provider()
    }

    this.appKit?.setEIP6963Enabled(this.ethersConfig.EIP6963)

    if (this.ethersConfig.injected) {
      this.checkActiveInjectedProvider(this.ethersConfig)
    }

    if (this.ethersConfig.auth) {
      this.syncAuthConnector(this.options.projectId, this.ethersConfig.auth)
    }

    if (this.ethersConfig.coinbase) {
      this.checkActiveCoinbaseProvider(this.ethersConfig)
    }
  }

  // @ts-expect-error: Overridden state type is correct
  public override getState() {
    const state = this.appKit?.getState()

    return {
      ...state,
      selectedNetworkId: NetworkUtil.caipNetworkIdToNumber(state?.selectedNetworkId)
    }
  }

  // @ts-expect-error: Overridden state type is correct
  public override subscribeState(callback: (state: Web3ModalState) => void) {
    return this.appKit?.subscribeState(state =>
      callback({
        ...state,
        selectedNetworkId: NetworkUtil.caipNetworkIdToNumber(state.selectedNetworkId)
      })
    )
  }

  public setAddress(address?: string) {
    const originalAddress = address ? (getOriginalAddress(address) as Address) : undefined
    EthersStoreUtil.setAddress(originalAddress)
  }

  public getAddress() {
    const { address } = EthersStoreUtil.state

    return address ? getOriginalAddress(address) : undefined
  }

  public getError() {
    return EthersStoreUtil.state.error
  }

  public getChainId() {
    const storeChainId = EthersStoreUtil.state.chainId
    const networkControllerChainId = NetworkUtil.caipNetworkIdToNumber(
      this.appKit?.getCaipNetwork()?.id
    )

    return storeChainId ?? networkControllerChainId
  }

  public getStatus() {
    return EthersStoreUtil.state.status
  }

  public getIsConnected() {
    return EthersStoreUtil.state.isConnected
  }

  public getWalletProvider() {
    return EthersStoreUtil.state.provider as Eip1193Provider | undefined
  }

  public getWalletProviderType() {
    return EthersStoreUtil.state.providerType
  }

  public subscribeProvider(callback: (newState: EthersStoreUtilState) => void) {
    return EthersStoreUtil.subscribe(callback)
  }

  public async disconnect() {
    const { provider, providerType } = EthersStoreUtil.state

    localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
    EthersStoreUtil.reset()
    this.appKit?.setClientId(null)

    if (providerType === ConstantsUtil.AUTH_CONNECTOR_ID) {
      await this.authProvider?.disconnect()
    } else if (provider && (providerType === 'injected' || providerType === 'eip6963')) {
      await this.disconnectProvider(provider)
      provider?.emit('disconnect')
    } else if (providerType === 'walletConnect' || providerType === 'coinbaseWalletSDK') {
      const ethereumProvider = provider as unknown as EthereumProvider
      if (ethereumProvider) {
        try {
          EthersStoreUtil.setError(undefined)
          await ethereumProvider.disconnect()
        } catch (error) {
          EthersStoreUtil.setError(error)
        }
      }
    }
  }

  // -- Private -----------------------------------------------------------------
  private createProvider() {
    if (!this.walletConnectProviderInitPromise && typeof window !== 'undefined') {
      this.walletConnectProviderInitPromise = this.initWalletConnectProvider()
    }

    return this.walletConnectProviderInitPromise
  }

  private async initWalletConnectProvider() {
    const rpcMap = this.chains
      ? this.chains.reduce<Record<number, string>>((map, chain) => {
          map[chain.chainId] = chain.rpcUrl

          return map
        }, {})
      : ({} as Record<number, string>)

    const walletConnectProviderOptions: EthereumProviderOptions = {
      projectId: this.projectId,
      showQrModal: false,
      rpcMap,
      optionalChains: [...this.chains.map(chain => chain.chainId)] as [number],
      metadata: {
        name: this.metadata ? this.metadata.name : '',
        description: this.metadata ? this.metadata.description : '',
        url: this.metadata ? this.metadata.url : '',
        icons: this.metadata ? this.metadata.icons : ['']
      }
    }

    this.walletConnectProvider = await EthereumProvider.init(walletConnectProviderOptions)

    await this.checkActiveWalletConnectProvider()
  }

  private async disconnectProvider(provider: Provider | CombinedProvider) {
    try {
      const permissions: { parentCapability: string }[] = await provider.request({
        method: 'wallet_getPermissions'
      })
      const ethAccountsPermission = permissions.find(
        permission => permission.parentCapability === 'eth_accounts'
      )

      if (ethAccountsPermission) {
        await provider.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        })
      }
    } catch (error) {
      throw new Error('Error revoking permissions:')
    }
  }

  private async getWalletConnectProvider() {
    if (!this.walletConnectProvider) {
      try {
        EthersStoreUtil.setError(undefined)
        await this.createProvider()
      } catch (error) {
        EthersStoreUtil.setError(error)
      }
    }

    return this.walletConnectProvider
  }

  private syncRequestedNetworks(
    chains: AdapterOptions['chains'],
    chainImages?: AdapterOptions['chainImages']
  ) {
    const requestedCaipNetworks = chains?.map(
      chain =>
        ({
          id: `${ConstantsUtil.EIP155}:${chain.chainId}`,
          name: chain.name,
          imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId],
          imageUrl: chainImages?.[chain.chainId],
          chain: CommonConstantsUtil.CHAIN.EVM
        }) as CaipNetwork
    )
    this.appKit?.setRequestedCaipNetworks(requestedCaipNetworks ?? [], this.chain)
  }

  private async checkActiveWalletConnectProvider() {
    const WalletConnectProvider = await this.getWalletConnectProvider()
    const walletId = localStorage.getItem(EthersConstantsUtil.WALLET_ID)

    if (WalletConnectProvider) {
      if (walletId === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
        await this.setWalletConnectProvider()
      }
    }

    const isConnected = EthersStoreUtil.state.isConnected
    EthersStoreUtil.setStatus(isConnected ? 'connected' : 'disconnected')
  }

  private checkActiveInjectedProvider(config: ProviderType) {
    const InjectedProvider = config.injected
    const walletId = localStorage.getItem(EthersConstantsUtil.WALLET_ID)

    if (InjectedProvider) {
      if (walletId === ConstantsUtil.INJECTED_CONNECTOR_ID) {
        this.setInjectedProvider(config)
        this.watchInjected(config)
      }
    }
  }

  private checkActiveCoinbaseProvider(config: ProviderType) {
    const CoinbaseProvider = config.coinbase as unknown as ExternalProvider
    const walletId = localStorage.getItem(EthersConstantsUtil.WALLET_ID)

    if (CoinbaseProvider) {
      if (walletId === ConstantsUtil.COINBASE_SDK_CONNECTOR_ID) {
        if (CoinbaseProvider.accounts && CoinbaseProvider.accounts?.length > 0) {
          this.setCoinbaseProvider(config)
          this.watchCoinbase(config)
        } else {
          localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
          EthersStoreUtil.reset()
        }
      }
    }
  }

  private checkActive6963Provider() {
    const currentActiveWallet = window?.localStorage.getItem(EthersConstantsUtil.WALLET_ID)
    if (currentActiveWallet) {
      const currentProvider = this.EIP6963Providers.find(
        provider => provider.info.name === currentActiveWallet
      )
      if (currentProvider) {
        this.setEIP6963Provider(currentProvider.provider, currentProvider.info.name)
      }
    }
  }

  private async setWalletConnectProvider() {
    window?.localStorage.setItem(
      EthersConstantsUtil.WALLET_ID,
      ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID
    )
    const WalletConnectProvider = await this.getWalletConnectProvider()
    if (WalletConnectProvider) {
      EthersStoreUtil.setChainId(WalletConnectProvider.chainId)
      EthersStoreUtil.setProviderType('walletConnect')
      EthersStoreUtil.setProvider(WalletConnectProvider as unknown as Provider)
      EthersStoreUtil.setStatus('connected')
      EthersStoreUtil.setIsConnected(true)
      this.appKit?.setAllAccounts(
        WalletConnectProvider.accounts.map(address => ({ address, type: 'eoa' })),
        this.chain
      )
      const session = WalletConnectProvider.signer?.session
      for (const address of WalletConnectProvider.accounts) {
        const label = session?.sessionProperties?.[address]
        if (label) {
          this.appKit?.addAddressLabel(address, label, this.chain)
        }
      }
      this.setAddress(WalletConnectProvider.accounts?.[0])
      this.watchWalletConnect()
    }
  }

  private async setInjectedProvider(config: ProviderType) {
    window?.localStorage.setItem(EthersConstantsUtil.WALLET_ID, ConstantsUtil.INJECTED_CONNECTOR_ID)
    const InjectedProvider = config.injected

    if (InjectedProvider) {
      const { addresses, chainId } = await EthersHelpersUtil.getUserInfo(InjectedProvider)
      if (addresses?.[0] && chainId) {
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType('injected')
        EthersStoreUtil.setProvider(config.injected)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        this.appKit?.setAllAccounts(
          addresses.map(address => ({ address, type: 'eoa' })),
          this.chain
        )
        this.setAddress(addresses[0])
        this.watchCoinbase(config)
      }
    }
  }

  private async setEIP6963Provider(provider: Provider, name: string) {
    window?.localStorage.setItem(EthersConstantsUtil.WALLET_ID, name)

    if (provider) {
      const { addresses, chainId } = await EthersHelpersUtil.getUserInfo(provider)
      if (addresses?.[0] && chainId) {
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType('eip6963')
        EthersStoreUtil.setProvider(provider)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        this.appKit?.setAllAccounts(
          addresses.map(address => ({ address, type: 'eoa' })),
          this.chain
        )
        this.setAddress(addresses[0])
        this.watchEIP6963(provider)
      }
    }
  }

  private async setCoinbaseProvider(config: ProviderType) {
    window?.localStorage.setItem(
      EthersConstantsUtil.WALLET_ID,
      ConstantsUtil.COINBASE_SDK_CONNECTOR_ID
    )
    const CoinbaseProvider = config.coinbase
    if (CoinbaseProvider) {
      const { addresses, chainId } = await EthersHelpersUtil.getUserInfo(CoinbaseProvider)
      if (addresses?.[0] && chainId) {
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType('coinbaseWalletSDK')
        EthersStoreUtil.setProvider(config.coinbase)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        this.appKit?.setAllAccounts(
          addresses.map(address => ({ address, type: 'eoa' })),
          this.chain
        )
        this.setAddress(addresses[0])
        this.watchCoinbase(config)
      }
    }
  }

  private async setAuthProvider() {
    window?.localStorage.setItem(EthersConstantsUtil.WALLET_ID, ConstantsUtil.AUTH_CONNECTOR_ID)

    if (this.authProvider) {
      this.appKit?.setLoading(true)
      const {
        address,
        chainId,
        smartAccountDeployed,
        preferredAccountType,
        accounts = []
      } = await this.authProvider.connect({ chainId: this.getChainId() })

      const { smartAccountEnabledNetworks } =
        await this.authProvider.getSmartAccountEnabledNetworks()

      this.appKit?.setSmartAccountEnabledNetworks(smartAccountEnabledNetworks, this.chain)
      if (address && chainId) {
        this.appKit?.setAllAccounts(
          accounts.length > 0
            ? accounts
            : [{ address, type: preferredAccountType as 'eoa' | 'smartAccount' }],
          this.chain
        )
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType(ConstantsUtil.AUTH_CONNECTOR_ID as 'w3mAuth')
        EthersStoreUtil.setProvider(this.authProvider as unknown as CombinedProvider)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        EthersStoreUtil.setAddress(address as Address)
        EthersStoreUtil.setPreferredAccountType(preferredAccountType as W3mFrameTypes.AccountType)
        this.appKit?.setSmartAccountDeployed(Boolean(smartAccountDeployed), this.chain)
        this.watchAuth()
        this.watchModal()
      }
      this.appKit?.setLoading(false)
    }
  }

  private async watchWalletConnect() {
    const provider = await this.getWalletConnectProvider()

    function disconnectHandler() {
      localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
      EthersStoreUtil.reset()
      provider?.removeListener('disconnect', disconnectHandler)
      provider?.removeListener('accountsChanged', accountsChangedHandler)
      provider?.removeListener('chainChanged', chainChangedHandler)
    }

    function chainChangedHandler(chainId: string) {
      if (chainId) {
        const chain = EthersHelpersUtil.hexStringToNumber(chainId)
        EthersStoreUtil.setChainId(chain)
      }
    }

    const accountsChangedHandler = async (accounts: string[]) => {
      if (accounts.length > 0) {
        await this.setWalletConnectProvider()
      }
    }

    if (provider) {
      provider.on('disconnect', disconnectHandler)
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('chainChanged', chainChangedHandler)
    }
  }

  private watchInjected(config: ProviderType) {
    const provider = config.injected

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
        EthersStoreUtil.setAddress(getOriginalAddress(currentAccount) as Address)
      } else {
        localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
        EthersStoreUtil.reset()
      }
    }

    function chainChangedHandler(chainId: string) {
      if (chainId) {
        const chain =
          typeof chainId === 'string'
            ? EthersHelpersUtil.hexStringToNumber(chainId)
            : Number(chainId)
        EthersStoreUtil.setChainId(chain)
      }
    }

    if (provider) {
      provider.on('disconnect', disconnectHandler)
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('chainChanged', chainChangedHandler)
    }
  }

  private watchEIP6963(provider: Provider) {
    function disconnectHandler() {
      localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
      EthersStoreUtil.reset()
      provider.removeListener('disconnect', disconnectHandler)
      provider.removeListener('accountsChanged', accountsChangedHandler)
      provider.removeListener('chainChanged', chainChangedHandler)
    }

    const accountsChangedHandler = (accounts: string[]) => {
      const currentAccount = accounts?.[0]
      if (currentAccount) {
        EthersStoreUtil.setAddress(getOriginalAddress(currentAccount) as Address)
        this.appKit?.setAllAccounts(
          accounts.map(address => ({ address, type: 'eoa' })),
          this.chain
        )
      } else {
        this.appKit?.setAllAccounts([], this.chain)
        localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
        EthersStoreUtil.reset()
      }
    }

    function chainChangedHandler(chainId: string) {
      if (chainId) {
        const chain =
          typeof chainId === 'string'
            ? EthersHelpersUtil.hexStringToNumber(chainId)
            : Number(chainId)
        EthersStoreUtil.setChainId(chain)
      }
    }

    if (provider) {
      provider.on('disconnect', disconnectHandler)
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('chainChanged', chainChangedHandler)
    }
  }

  private watchCoinbase(config: ProviderType) {
    const provider = config.coinbase
    const walletId = localStorage.getItem(EthersConstantsUtil.WALLET_ID)
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
        EthersStoreUtil.setAddress(getOriginalAddress(currentAccount) as Address)
      } else {
        localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
        EthersStoreUtil.reset()
      }
    }

    function chainChangedHandler(chainId: string) {
      if (chainId && walletId === ConstantsUtil.COINBASE_SDK_CONNECTOR_ID) {
        const chain = Number(chainId)
        EthersStoreUtil.setChainId(chain)
      }
    }

    if (provider) {
      provider.on('disconnect', disconnectHandler)
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('chainChanged', chainChangedHandler)
    }
  }

  private watchAuth() {
    if (this.authProvider) {
      this.authProvider.onRpcRequest(request => {
        if (W3mFrameHelpers.checkIfRequestExists(request)) {
          if (!W3mFrameHelpers.checkIfRequestIsAllowed(request)) {
            if (this.appKit?.isOpen()) {
              if (this.appKit?.isTransactionStackEmpty()) {
                return
              }
              if (this.appKit?.isTransactionShouldReplaceView()) {
                this.appKit?.replace('ApproveTransaction')
              } else {
                this.appKit?.redirect('ApproveTransaction')
              }
            } else {
              this.appKit?.open({ view: 'ApproveTransaction' })
            }
          }
        } else {
          this.appKit?.open()
          // eslint-disable-next-line no-console
          console.error(W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_MESSAGE, {
            method: request.method
          })
          setTimeout(() => {
            this.appKit?.showErrorMessage(W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_UI_MESSAGE)
          }, 300)
        }
      })

      this.authProvider.onRpcResponse(response => {
        const responseType = W3mFrameHelpers.getResponseType(response)

        switch (responseType) {
          case W3mFrameConstants.RPC_RESPONSE_TYPE_ERROR: {
            const isModalOpen = this.appKit?.isOpen()

            if (isModalOpen) {
              if (this.appKit?.isTransactionStackEmpty()) {
                this.appKit?.close()
              } else {
                this.appKit?.popTransactionStack(true)
              }
            }
            break
          }
          case W3mFrameConstants.RPC_RESPONSE_TYPE_TX: {
            if (this.appKit?.isTransactionStackEmpty()) {
              this.appKit?.close()
            } else {
              this.appKit?.popTransactionStack()
            }
            break
          }
          default:
            break
        }
      })

      this.authProvider.onNotConnected(() => {
        this.appKit?.setIsConnected(false, this.chain)
        this.appKit?.setLoading(false)
      })

      this.authProvider.onIsConnected(({ preferredAccountType }) => {
        this.appKit?.setIsConnected(true, this.chain)
        this.appKit?.setLoading(false)
        EthersStoreUtil.setPreferredAccountType(preferredAccountType as W3mFrameTypes.AccountType)
      })

      this.authProvider.onSetPreferredAccount(({ address, type }) => {
        if (!address) {
          return
        }
        this.appKit?.setLoading(true)
        const chainId = NetworkUtil.caipNetworkIdToNumber(this.appKit?.getCaipNetwork()?.id)
        EthersStoreUtil.setAddress(address as Address)
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        EthersStoreUtil.setPreferredAccountType(type as W3mFrameTypes.AccountType)
        this.syncAccount().then(() => this.appKit?.setLoading(false))
      })
    }
  }

  private watchModal() {
    if (this.authProvider) {
      this.subscribeState(val => {
        if (!val.open) {
          this.authProvider?.rejectRpcRequest()
        }
      })
    }
  }

  private async syncAccount() {
    const address = EthersStoreUtil.state.address
    const chainId = EthersStoreUtil.state.chainId
    const isConnected = EthersStoreUtil.state.isConnected
    const preferredAccountType = EthersStoreUtil.state.preferredAccountType
    this.appKit?.resetAccount(this.chain)

    if (isConnected && address && chainId) {
      const caipAddress: CaipAddress = `${ConstantsUtil.EIP155}:${chainId}:${address}`

      this.appKit?.setIsConnected(isConnected, this.chain)
      this.appKit?.setPreferredAccountType(preferredAccountType, this.chain)
      this.appKit?.setCaipAddress(caipAddress, this.chain)
      this.syncConnectedWalletInfo()

      const chain = this.chains.find(c => c.chainId === chainId)
      if (chain?.explorerUrl) {
        this.appKit?.setAddressExplorerUrl(`${chain.explorerUrl}/address/${address}`, this.chain)
      }

      await Promise.all([
        this.syncProfile(address),
        this.syncBalance(address),
        this.appKit?.setApprovedCaipNetworksData(this.chain)
      ])

      this.hasSyncedConnectedAccount = true
    } else if (!isConnected && this.hasSyncedConnectedAccount) {
      this.appKit?.resetWcConnection()
      this.appKit?.resetNetwork()
      this.appKit?.setAllAccounts([], this.chain)
    }
  }

  private async syncNetwork(chainImages?: AdapterOptions['chainImages']) {
    const address = EthersStoreUtil.state.address
    const chainId = EthersStoreUtil.state.chainId
    const isConnected = EthersStoreUtil.state.isConnected
    if (this.chains) {
      const chain = this.chains.find(c => c.chainId === chainId)

      if (chain) {
        const caipChainId: CaipNetworkId = `${ConstantsUtil.EIP155}:${chain.chainId}`

        this.appKit?.setCaipNetwork({
          id: caipChainId,
          name: chain.name,
          imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId],
          imageUrl: chainImages?.[chain.chainId],
          chain: this.chain
        })
        if (isConnected && address) {
          const caipAddress: CaipAddress = `${ConstantsUtil.EIP155}:${chainId}:${address}`
          this.appKit?.setCaipAddress(caipAddress, this.chain)
          if (chain.explorerUrl) {
            const url = `${chain.explorerUrl}/address/${address}`
            this.appKit?.setAddressExplorerUrl(url, this.chain)
          } else {
            this.appKit?.setAddressExplorerUrl(undefined, this.chain)
          }
          if (this.hasSyncedConnectedAccount) {
            await this.syncProfile(address)
            await this.syncBalance(address)
          }
        }
      } else if (isConnected) {
        this.appKit?.setCaipNetwork({
          id: `${ConstantsUtil.EIP155}:${chainId}`,
          chain: this.chain
        })
      }
    }
  }

  private async syncWalletConnectName(address: Address) {
    try {
      const registeredWcNames = await this.appKit?.getWalletConnectName(address)
      if (registeredWcNames?.[0]) {
        const wcName = registeredWcNames[0]
        this.appKit?.setProfileName(wcName.name)
      } else {
        this.appKit?.setProfileName(null, this.chain)
      }
    } catch {
      this.appKit?.setProfileName(null, this.chain)
    }
  }

  private async syncProfile(address: Address) {
    const chainId = EthersStoreUtil.state.chainId

    try {
      const identity = await this.appKit?.fetchIdentity({
        address
      })
      const name = identity?.name
      const avatar = identity?.avatar

      this.appKit?.setProfileName(name, this.chain)
      this.appKit?.setProfileImage(avatar, this.chain)

      if (!name) {
        await this.syncWalletConnectName(address)
      }
    } catch {
      if (chainId === 1) {
        const ensProvider = new InfuraProvider('mainnet')
        const name = await ensProvider.lookupAddress(address)
        const avatar = await ensProvider.getAvatar(address)

        if (name) {
          this.appKit?.setProfileName(name, this.chain)
        } else {
          await this.syncWalletConnectName(address)
        }
        if (avatar) {
          this.appKit?.setProfileImage(avatar, this.chain)
        }
      } else {
        await this.syncWalletConnectName(address)
        this.appKit?.setProfileImage(null, this.chain)
      }
    }
  }

  private async syncBalance(address: Address) {
    const chainId = EthersStoreUtil.state.chainId
    if (chainId && this.chains) {
      const chain = this.chains.find(c => c.chainId === chainId)

      if (chain) {
        const jsonRpcProvider = new JsonRpcProvider(chain.rpcUrl, {
          chainId,
          name: chain.name
        })
        if (jsonRpcProvider) {
          const balance = await jsonRpcProvider.getBalance(address)
          const formattedBalance = formatEther(balance)

          this.appKit?.setBalance(formattedBalance, chain.currency, this.chain)
        }
      }
    }
  }

  private syncConnectedWalletInfo() {
    const currentActiveWallet = window?.localStorage.getItem(EthersConstantsUtil.WALLET_ID)
    const providerType = EthersStoreUtil.state.providerType

    if (providerType === ConstantsUtil.EIP6963_CONNECTOR_ID) {
      if (currentActiveWallet) {
        const currentProvider = this.EIP6963Providers.find(
          provider => provider.info.name === currentActiveWallet
        )

        if (currentProvider) {
          this.appKit?.setConnectedWalletInfo({ ...currentProvider.info }, this.chain)
        }
      }
    } else if (providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
      const provider = EthersStoreUtil.state.provider as unknown as EthereumProvider

      if (provider.session) {
        this.appKit?.setConnectedWalletInfo(
          {
            ...provider.session.peer.metadata,
            name: provider.session.peer.metadata.name,
            icon: provider.session.peer.metadata.icons?.[0]
          },
          this.chain
        )
      }
    } else if (currentActiveWallet) {
      this.appKit?.setConnectedWalletInfo({ name: currentActiveWallet }, this.chain)
    }
  }

  public async switchNetwork(chainId: number) {
    const provider = EthersStoreUtil.state.provider
    const providerType = EthersStoreUtil.state.providerType
    if (this.chains) {
      const chain = this.chains.find(c => c.chainId === chainId)

      if (providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID && chain) {
        const WalletConnectProvider = provider as unknown as EthereumProvider

        if (WalletConnectProvider) {
          try {
            await WalletConnectProvider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: EthersHelpersUtil.numberToHexString(chain.chainId) }]
            })
            EthersStoreUtil.setChainId(chainId)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (switchError: any) {
            const message = switchError?.message as string
            if (/(?<temp1>user rejected)/u.test(message?.toLowerCase())) {
              throw new Error('Chain is not supported')
            }
            await EthersHelpersUtil.addEthereumChain(
              WalletConnectProvider as unknown as Provider,
              chain
            )
          }
        }
      } else if (providerType === ConstantsUtil.INJECTED_CONNECTOR_ID && chain) {
        const InjectedProvider = provider
        if (InjectedProvider) {
          try {
            await InjectedProvider.request({
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
              await EthersHelpersUtil.addEthereumChain(InjectedProvider, chain)
            } else {
              throw new Error('Chain is not supported')
            }
          }
        }
      } else if (providerType === ConstantsUtil.EIP6963_CONNECTOR_ID && chain) {
        const EIP6963Provider = provider

        if (EIP6963Provider) {
          try {
            await EIP6963Provider.request({
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
              await EthersHelpersUtil.addEthereumChain(EIP6963Provider, chain)
            } else {
              throw new Error('Chain is not supported')
            }
          }
        }
      } else if (providerType === ConstantsUtil.COINBASE_SDK_CONNECTOR_ID && chain) {
        const CoinbaseProvider = provider
        if (CoinbaseProvider) {
          try {
            await CoinbaseProvider.request({
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
              await EthersHelpersUtil.addEthereumChain(CoinbaseProvider, chain)
            } else {
              throw new Error('Error switching network')
            }
          }
        }
      } else if (providerType === ConstantsUtil.AUTH_CONNECTOR_ID) {
        if (this.authProvider && chain?.chainId) {
          try {
            this.appKit?.setLoading(true)
            await this.authProvider.switchNetwork(chain?.chainId)
            EthersStoreUtil.setChainId(chain.chainId)

            const { address, preferredAccountType } = await this.authProvider.connect({
              chainId: chain?.chainId
            })

            EthersStoreUtil.setAddress(address as Address)
            EthersStoreUtil.setPreferredAccountType(
              preferredAccountType as W3mFrameTypes.AccountType
            )
            await this.syncAccount()
          } catch {
            throw new Error('Switching chain failed')
          } finally {
            this.appKit?.setLoading(false)
          }
        }
      }
    }
  }

  private syncConnectors(config: ProviderType) {
    const w3mConnectors: Connector[] = []

    const connectorType = PresetsUtil.ConnectorTypesMap[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID]
    if (connectorType) {
      w3mConnectors.push({
        id: ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID,
        explorerId: PresetsUtil.ConnectorExplorerIds[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
        imageId: PresetsUtil.ConnectorImageIds[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
        imageUrl: this.options?.connectorImages?.[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
        name: PresetsUtil.ConnectorNamesMap[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
        type: connectorType,
        chain: this.chain
      })
    }

    if (config.injected) {
      const injectedConnectorType =
        PresetsUtil.ConnectorTypesMap[ConstantsUtil.INJECTED_CONNECTOR_ID]
      if (injectedConnectorType) {
        w3mConnectors.push({
          id: ConstantsUtil.INJECTED_CONNECTOR_ID,
          explorerId: PresetsUtil.ConnectorExplorerIds[ConstantsUtil.INJECTED_CONNECTOR_ID],
          imageId: PresetsUtil.ConnectorImageIds[ConstantsUtil.INJECTED_CONNECTOR_ID],
          imageUrl: this.options?.connectorImages?.[ConstantsUtil.INJECTED_CONNECTOR_ID],
          name: PresetsUtil.ConnectorNamesMap[ConstantsUtil.INJECTED_CONNECTOR_ID],
          type: injectedConnectorType,
          chain: this.chain
        })
      }
    }

    if (config.coinbase) {
      w3mConnectors.push({
        id: ConstantsUtil.COINBASE_SDK_CONNECTOR_ID,
        explorerId: PresetsUtil.ConnectorExplorerIds[ConstantsUtil.COINBASE_SDK_CONNECTOR_ID],
        imageId: PresetsUtil.ConnectorImageIds[ConstantsUtil.COINBASE_SDK_CONNECTOR_ID],
        imageUrl: this.options?.connectorImages?.[ConstantsUtil.COINBASE_SDK_CONNECTOR_ID],
        name: PresetsUtil.ConnectorNamesMap[ConstantsUtil.COINBASE_SDK_CONNECTOR_ID],
        type: 'EXTERNAL',
        chain: this.chain
      })
    }

    this.appKit?.setConnectors(w3mConnectors)
  }

  private async syncAuthConnector(projectId: string, auth: ProviderType['auth']) {
    if (typeof window !== 'undefined') {
      this.authProvider = new W3mFrameProvider(projectId)

      this.appKit?.addConnector({
        id: ConstantsUtil.AUTH_CONNECTOR_ID,
        type: 'AUTH',
        name: 'Auth',
        provider: this.authProvider,
        email: auth?.email,
        socials: auth?.socials,
        showWallets: auth?.showWallets === undefined ? true : auth.showWallets,
        chain: this.chain,
        walletFeatures: auth?.walletFeatures
      })

      this.appKit?.setLoading(true)
      const isLoginEmailUsed = this.authProvider.getLoginEmailUsed()
      this.appKit?.setLoading(isLoginEmailUsed)
      const { isConnected } = await this.authProvider.isConnected()
      if (isConnected) {
        await this.setAuthProvider()
      } else {
        this.appKit?.setLoading(false)
      }
    }
  }

  private eip6963EventHandler(event: CustomEventInit<EIP6963ProviderDetail>) {
    if (event.detail) {
      const { info, provider } = event.detail
      const connectors = this.appKit?.getConnectors()
      const existingConnector = connectors?.find(c => c.name === info.name)
      const coinbaseConnector = connectors?.find(
        c => c.id === ConstantsUtil.COINBASE_SDK_CONNECTOR_ID
      )
      const isCoinbaseDuplicated =
        coinbaseConnector &&
        event.detail.info.rdns ===
          ConstantsUtil.CONNECTOR_RDNS_MAP[ConstantsUtil.COINBASE_SDK_CONNECTOR_ID]

      if (!existingConnector && !isCoinbaseDuplicated) {
        const type = PresetsUtil.ConnectorTypesMap[ConstantsUtil.EIP6963_CONNECTOR_ID]
        if (type) {
          this.appKit?.addConnector({
            id: ConstantsUtil.EIP6963_CONNECTOR_ID,
            type,
            imageUrl:
              info.icon ?? this.options?.connectorImages?.[ConstantsUtil.EIP6963_CONNECTOR_ID],
            name: info.name,
            provider,
            info,
            chain: this.chain
          })

          const eip6963ProviderObj = {
            provider,
            info
          }

          this.EIP6963Providers.push(eip6963ProviderObj)
        }
      }
    }
  }

  private listenConnectors(enableEIP6963: boolean) {
    if (typeof window !== 'undefined' && enableEIP6963) {
      const handler = this.eip6963EventHandler.bind(this)
      window.addEventListener(ConstantsUtil.EIP6963_ANNOUNCE_EVENT, handler)
      window.dispatchEvent(new Event(ConstantsUtil.EIP6963_REQUEST_EVENT))
    }
  }
}
