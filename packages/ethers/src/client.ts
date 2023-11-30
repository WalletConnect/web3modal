/* eslint-disable max-depth */
import type {
  CaipAddress,
  CaipNetwork,
  CaipNetworkId,
  ConnectionControllerClient,
  Connector,
  LibraryOptions,
  NetworkControllerClient,
  PublicStateControllerState,
  Token
} from '@web3modal/scaffold'
import { Web3ModalScaffold } from '@web3modal/scaffold'
import { ConstantsUtil, PresetsUtil, HelpersUtil } from '@web3modal/scaffold-utils'
import EthereumProvider from '@walletconnect/ethereum-provider'
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
  getAddress as getOriginalAddress
} from 'ethers'
import {
  EthersConstantsUtil,
  EthersHelpersUtil,
  EthersStoreUtil
} from '@web3modal/scaffold-utils/ethers'
import type { EthereumProviderOptions } from '@walletconnect/ethereum-provider'
import type { Eip1193Provider } from 'ethers'
import { W3mFrameProvider } from '@web3modal/smart-account'

// -- Types ---------------------------------------------------------------------
export interface Web3ModalClientOptions extends Omit<LibraryOptions, 'defaultChain' | 'tokens'> {
  ethersConfig: ProviderType
  chains?: Chain[]
  defaultChain?: Chain
  chainImages?: Record<number, string>
  connectorImages?: Record<string, string>
  tokens?: Record<number, Token>
}

export type Web3ModalOptions = Omit<Web3ModalClientOptions, '_sdkVersion'>

declare global {
  interface Window {
    ethereum?: Record<string, unknown>
  }
}

// @ts-expect-error: Overriden state type is correct
interface Web3ModalState extends PublicStateControllerState {
  selectedNetworkId: number | undefined
}

interface Info {
  uuid: string
  name: string
  icon: string
  rdns: string
}

interface Wallet {
  info: Info
  provider: Provider
}

interface IEIP6963Provider {
  name: string
  provider: Provider
}

interface ExternalProvider extends EthereumProvider {
  _addresses?: string[]
}

// -- Client --------------------------------------------------------------------
export class Web3Modal extends Web3ModalScaffold {
  private hasSyncedConnectedAccount = false

  private EIP6963Providers: IEIP6963Provider[] = []

  private walletConnectProvider?: EthereumProvider

  private walletConnectProviderInitPromise?: Promise<void>

  private projectId: string

  private chains?: Chain[]

  private metadata?: Metadata

  private options: Web3ModalClientOptions | undefined = undefined

  private emailProvider?: W3mFrameProvider

  public constructor(options: Web3ModalClientOptions) {
    const { ethersConfig, chains, defaultChain, tokens, chainImages, _sdkVersion, ...w3mOptions } =
      options

    if (!ethersConfig) {
      throw new Error('web3modal:constructor - ethersConfig is undefined')
    }

    if (!w3mOptions.projectId) {
      throw new Error('web3modal:constructor - projectId is undefined')
    }

    const networkControllerClient: NetworkControllerClient = {
      switchCaipNetwork: async caipNetwork => {
        const chainId = HelpersUtil.caipNetworkIdToNumber(caipNetwork?.id)
        if (chainId) {
          await this.switchNetwork(chainId)
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
            const nsChains = ns?.[ConstantsUtil.EIP155]?.chains

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

    const connectionControllerClient: ConnectionControllerClient = {
      connectWalletConnect: async onUri => {
        const WalletConnectProvider = await this.getWalletConnectProvider()
        if (!WalletConnectProvider) {
          throw new Error('connectionControllerClient:getWalletConnectUri - provider is undefined')
        }

        WalletConnectProvider.on('display_uri', (uri: string) => {
          onUri(uri)
        })

        await WalletConnectProvider.connect()
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
        if (id === ConstantsUtil.INJECTED_CONNECTOR_ID) {
          const InjectedProvider = ethersConfig.injected
          if (!InjectedProvider) {
            throw new Error('connectionControllerClient:connectInjected - provider is undefined')
          }
          await InjectedProvider.request({ method: 'eth_requestAccounts' })
          this.setInjectedProvider(ethersConfig)
        } else if (id === ConstantsUtil.EIP6963_CONNECTOR_ID && info && provider) {
          await provider.request({ method: 'eth_requestAccounts' })
          this.setEIP6963Provider(provider, info.name)
        } else if (id === ConstantsUtil.COINBASE_CONNECTOR_ID) {
          const CoinbaseProvider = ethersConfig.coinbase
          if (!CoinbaseProvider) {
            throw new Error('connectionControllerClient:connectCoinbase - connector is undefined')
          }
          await CoinbaseProvider.request({ method: 'eth_requestAccounts' })

          this.setCoinbaseProvider(ethersConfig)
        } else if (id === ConstantsUtil.EMAIL_CONNECTOR_ID) {
          this.setEmailProvider()
        }
      },

      checkInstalled(ids) {
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
        const provider = EthersStoreUtil.state.provider as Provider
        const providerType = EthersStoreUtil.state.providerType
        localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
        EthersStoreUtil.reset()
        if (providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
          const WalletConnectProvider = provider
          await (WalletConnectProvider as unknown as EthereumProvider).disconnect()
          provider?.emit('disconnect')
          // eslint-disable-next-line no-negated-condition
        } else if (providerType !== ConstantsUtil.EMAIL_CONNECTOR_ID) {
          provider?.emit('disconnect')
        } else {
          this.emailProvider?.disconnect()
        }
      }
    }

    super({
      networkControllerClient,
      connectionControllerClient,
      defaultChain: EthersHelpersUtil.getCaipDefaultChain(defaultChain),
      tokens: HelpersUtil.getCaipTokens(tokens),
      _sdkVersion: _sdkVersion ?? `html-ethers-${ConstantsUtil.VERSION}`,
      ...w3mOptions
    })

    this.options = options

    this.metadata = ethersConfig.metadata

    this.projectId = w3mOptions.projectId
    this.chains = chains

    this.createProvider()

    EthersStoreUtil.subscribeKey('address', () => {
      this.syncAccount()
    })

    EthersStoreUtil.subscribeKey('chainId', () => {
      this.syncNetwork(chainImages)
    })

    this.syncRequestedNetworks(chains, chainImages)
    this.syncConnectors(ethersConfig)

    if (ethersConfig.EIP6963) {
      if (typeof window !== 'undefined') {
        this.listenConnectors(ethersConfig.EIP6963)
        this.checkActive6963Provider()
      }
    }

    if (ethersConfig.email) {
      this.syncEmailConnector(w3mOptions.projectId)
      this.listenEmailConnector()
    }

    if (ethersConfig.injected) {
      this.checkActiveInjectedProvider(ethersConfig)
    }
    if (ethersConfig.coinbase) {
      this.checkActiveCoinbaseProvider(ethersConfig)
    }
  }

  // -- Public ------------------------------------------------------------------

  // @ts-expect-error: Overriden state type is correct
  public override getState() {
    const state = super.getState()

    return {
      ...state,
      selectedNetworkId: HelpersUtil.caipNetworkIdToNumber(state.selectedNetworkId)
    }
  }

  // @ts-expect-error: Overriden state type is correct
  public override subscribeState(callback: (state: Web3ModalState) => void) {
    return super.subscribeState(state =>
      callback({
        ...state,
        selectedNetworkId: HelpersUtil.caipNetworkIdToNumber(state.selectedNetworkId)
      })
    )
  }

  public getAddress() {
    return getOriginalAddress(EthersStoreUtil.state.address as string)
  }

  public getChainId() {
    return EthersStoreUtil.state.chainId
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

    if (providerType === 'injected' || providerType === 'eip6963') {
      const typedProvider: Provider = provider as Provider
      typedProvider?.emit('disconnect')
    } else {
      const typedProvider: EthereumProvider = provider as unknown as EthereumProvider
      await typedProvider.disconnect()
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
    const walletConnectProviderOptions: EthereumProviderOptions = {
      projectId: this.projectId,
      showQrModal: false,
      rpcMap: this.chains
        ? this.chains.reduce<Record<number, string>>((map, chain) => {
            map[chain.chainId] = chain.rpcUrl

            return map
          }, {})
        : ({} as Record<number, string>),
      optionalChains: this.chains ? [0, ...this.chains.map(chain => chain.chainId)] : [0],
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

  private async getWalletConnectProvider() {
    if (!this.walletConnectProvider) {
      await this.createProvider()
    }

    return this.walletConnectProvider
  }

  private syncRequestedNetworks(
    chains: Web3ModalClientOptions['chains'],
    chainImages?: Web3ModalClientOptions['chainImages']
  ) {
    const requestedCaipNetworks = chains?.map(
      chain =>
        ({
          id: `${ConstantsUtil.EIP155}:${chain.chainId}`,
          name: chain.name,
          imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId],
          imageUrl: chainImages?.[chain.chainId]
        }) as CaipNetwork
    )
    this.setRequestedCaipNetworks(requestedCaipNetworks ?? [])
  }

  private async checkActiveWalletConnectProvider() {
    const WalletConnectProvider = await this.getWalletConnectProvider()
    const walletId = localStorage.getItem(EthersConstantsUtil.WALLET_ID)

    if (WalletConnectProvider) {
      if (walletId === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
        await this.setWalletConnectProvider()
      }
    }
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
      if (walletId === ConstantsUtil.COINBASE_CONNECTOR_ID) {
        if (CoinbaseProvider._addresses && CoinbaseProvider._addresses?.length > 0) {
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
        provider => provider.name === currentActiveWallet
      )
      if (currentProvider) {
        this.setEIP6963Provider(currentProvider.provider, currentProvider.name)
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
      EthersStoreUtil.setIsConnected(true)
      EthersStoreUtil.setAddress(WalletConnectProvider.accounts[0] as Address)
      this.watchWalletConnect()
    }
  }

  private async setInjectedProvider(config: ProviderType) {
    window?.localStorage.setItem(EthersConstantsUtil.WALLET_ID, ConstantsUtil.INJECTED_CONNECTOR_ID)
    const InjectedProvider = config.injected

    if (InjectedProvider) {
      const { address, chainId } = await EthersHelpersUtil.getUserInfo(InjectedProvider)
      if (address && chainId) {
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType('injected')
        EthersStoreUtil.setProvider(config.injected as unknown as Provider)
        EthersStoreUtil.setIsConnected(true)
        EthersStoreUtil.setAddress(getOriginalAddress(address) as Address)
        this.watchCoinbase(config)
      }
    }
  }

  private async setEIP6963Provider(provider: Provider, name: string) {
    window?.localStorage.setItem(EthersConstantsUtil.WALLET_ID, name)

    if (provider) {
      const { address, chainId } = await EthersHelpersUtil.getUserInfo(provider)
      if (address && chainId) {
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType('eip6963')
        EthersStoreUtil.setProvider(provider as unknown as Provider)
        EthersStoreUtil.setIsConnected(true)
        EthersStoreUtil.setAddress(getOriginalAddress(address) as Address)
        this.watchEIP6963(provider)
      }
    }
  }

  private async setCoinbaseProvider(config: ProviderType) {
    window?.localStorage.setItem(EthersConstantsUtil.WALLET_ID, ConstantsUtil.COINBASE_CONNECTOR_ID)
    const CoinbaseProvider = config.coinbase

    if (CoinbaseProvider) {
      const { address, chainId } = await EthersHelpersUtil.getUserInfo(CoinbaseProvider)
      if (address && chainId) {
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType('coinbaseWallet')
        EthersStoreUtil.setProvider(config.coinbase as unknown as Provider)
        EthersStoreUtil.setIsConnected(true)
        EthersStoreUtil.setAddress(getOriginalAddress(address) as Address)
        this.watchCoinbase(config)
      }
    }
  }

  private async setEmailProvider() {
    window?.localStorage.setItem(EthersConstantsUtil.WALLET_ID, ConstantsUtil.EMAIL_CONNECTOR_ID)

    if (this.emailProvider) {
      const { address, chainId } = await this.emailProvider.connect()
      if (address && chainId) {
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType(ConstantsUtil.EMAIL_CONNECTOR_ID as 'w3mEmail')
        EthersStoreUtil.setProvider(this.emailProvider as unknown as W3mFrameProvider)
        EthersStoreUtil.setIsConnected(true)
        EthersStoreUtil.setAddress(address as Address)
        this.watchEmail()
      }
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
      if (chainId && walletId === ConstantsUtil.COINBASE_CONNECTOR_ID) {
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

  private watchEmail() {
    if (this.emailProvider) {
      this.emailProvider.onRpcRequest(() => {
        super.open({ view: 'ApproveTransaction' })
      })
      this.emailProvider.onRpcResponse(() => {
        super.close()
      })
    }
  }

  private async syncAccount() {
    const address = EthersStoreUtil.state.address
    const chainId = EthersStoreUtil.state.chainId
    const isConnected = EthersStoreUtil.state.isConnected

    this.resetAccount()

    if (isConnected && address && chainId) {
      const caipAddress: CaipAddress = `${ConstantsUtil.EIP155}:${chainId}:${address}`

      this.setIsConnected(isConnected)

      this.setCaipAddress(caipAddress)
      await Promise.all([
        this.syncProfile(address),
        this.syncBalance(address),
        this.getApprovedCaipNetworksData()
      ])
      this.hasSyncedConnectedAccount = true
    } else if (!isConnected && this.hasSyncedConnectedAccount) {
      this.resetWcConnection()
      this.resetNetwork()
    }
  }

  private async syncNetwork(chainImages?: Web3ModalClientOptions['chainImages']) {
    const address = EthersStoreUtil.state.address
    const chainId = EthersStoreUtil.state.chainId
    const isConnected = EthersStoreUtil.state.isConnected
    if (this.chains) {
      const chain = this.chains.find(c => c.chainId === chainId)

      if (chain) {
        const caipChainId: CaipNetworkId = `${ConstantsUtil.EIP155}:${chain.chainId}`

        this.setCaipNetwork({
          id: caipChainId,
          name: chain.name,
          imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId],
          imageUrl: chainImages?.[chain.chainId]
        })
        if (isConnected && address) {
          const caipAddress: CaipAddress = `${ConstantsUtil.EIP155}:${chainId}:${address}`
          this.setCaipAddress(caipAddress)
          if (chain.explorerUrl) {
            const url = `${chain.explorerUrl}/address/${address}`
            this.setAddressExplorerUrl(url)
          } else {
            this.setAddressExplorerUrl(undefined)
          }
          if (this.hasSyncedConnectedAccount) {
            await this.syncBalance(address)
          }
        }
      }
    }
  }

  private async syncProfile(address: Address) {
    const ensProvider = new InfuraProvider('mainnet')
    const name = await ensProvider.lookupAddress(address)
    const avatar = await ensProvider.getAvatar(address)
    if (name) {
      this.setProfileName(name)
    }
    if (avatar) {
      this.setProfileImage(avatar)
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
          this.setBalance(formattedBalance, chain.currency)
        }
      }
    }
  }

  private async switchNetwork(chainId: number) {
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
            if (
              switchError.code === EthersConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID ||
              switchError.code === EthersConstantsUtil.ERROR_CODE_DEFAULT ||
              switchError?.data?.originalError?.code ===
                EthersConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID
            ) {
              await EthersHelpersUtil.addEthereumChain(
                WalletConnectProvider as unknown as Provider,
                chain
              )
            } else {
              throw new Error('Chain is not supported')
            }
          }
        }
      } else if (providerType === ConstantsUtil.INJECTED_CONNECTOR_ID && chain) {
        const InjectedProvider = provider as unknown as Provider
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
        const EIP6963Provider = provider as unknown as Provider

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
      } else if (providerType === ConstantsUtil.COINBASE_CONNECTOR_ID && chain) {
        const CoinbaseProvider = provider as unknown as Provider
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
            }
          }
        }
      } else if (providerType === ConstantsUtil.EMAIL_CONNECTOR_ID) {
        if (this.emailProvider && chain?.chainId) {
          try {
            await this.emailProvider?.switchNetwork(chain?.chainId)
            EthersStoreUtil.setChainId(chain.chainId)
          } catch {
            throw new Error('Switching chain failed')
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
        type: connectorType
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
          type: injectedConnectorType
        })
      }
    }

    if (config.coinbase) {
      w3mConnectors.push({
        id: ConstantsUtil.COINBASE_CONNECTOR_ID,
        explorerId: PresetsUtil.ConnectorExplorerIds[ConstantsUtil.COINBASE_CONNECTOR_ID],
        imageId: PresetsUtil.ConnectorImageIds[ConstantsUtil.COINBASE_CONNECTOR_ID],
        imageUrl: this.options?.connectorImages?.[ConstantsUtil.COINBASE_CONNECTOR_ID],
        name: PresetsUtil.ConnectorNamesMap[ConstantsUtil.COINBASE_CONNECTOR_ID],
        type: 'EXTERNAL'
      })
    }

    this.setConnectors(w3mConnectors)
  }

  private async syncEmailConnector(projectId: string) {
    if (typeof window !== 'undefined') {
      this.emailProvider = new W3mFrameProvider(projectId)
      super.setLoading(true)
      const isConnected = await this.emailProvider.isConnected()
      if (isConnected) {
        this.setEmailProvider()
      }
    }

    this.addConnector({
      id: ConstantsUtil.EMAIL_CONNECTOR_ID,
      type: 'EMAIL',
      name: 'Email',
      provider: this.emailProvider
    })
  }

  private listenEmailConnector() {
    if (this.emailProvider) {
      this.emailProvider.onIsConnected(() => {
        super.setLoading(false)
      })
    }
  }

  private eip6963EventHandler(event: CustomEventInit<Wallet>) {
    if (event.detail) {
      const { info, provider } = event.detail
      const connectors = this.getConnectors()
      const existingConnector = connectors.find(c => c.name === info.name)
      if (!existingConnector) {
        const type = PresetsUtil.ConnectorTypesMap[ConstantsUtil.EIP6963_CONNECTOR_ID]
        if (type) {
          this.addConnector({
            id: ConstantsUtil.EIP6963_CONNECTOR_ID,
            type,
            imageUrl:
              info.icon ?? this.options?.connectorImages?.[ConstantsUtil.EIP6963_CONNECTOR_ID],
            name: info.name,
            provider,
            info
          })

          const eip6963ProviderObj = {
            name: info.name,
            provider
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
