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
  SendTransactionArgs,
  Token
} from '@web3modal/scaffold'
import { Web3ModalScaffold } from '@web3modal/scaffold'
import type { Web3ModalSIWEClient } from '@web3modal/siwe'
import { ConstantsUtil, PresetsUtil, HelpersUtil } from '@web3modal/scaffold-utils'
import EthereumProvider, { OPTIONAL_METHODS } from '@walletconnect/ethereum-provider'
import type {
  Address,
  Metadata,
  ProviderType,
  Chain,
  Provider,
  EthersStoreUtilState
} from '@web3modal/scaffold-utils/ethers'
import { ethers, utils } from 'ethers'
import {
  EthersConstantsUtil,
  EthersHelpersUtil,
  EthersStoreUtil
} from '@web3modal/scaffold-utils/ethers'
import type { EthereumProviderOptions } from '@walletconnect/ethereum-provider'
import { NetworkUtil } from '@web3modal/common'

// -- Types ---------------------------------------------------------------------
export interface Web3ModalClientOptions extends Omit<LibraryOptions, 'defaultChain' | 'tokens'> {
  ethersConfig: ProviderType
  siweConfig?: Web3ModalSIWEClient
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

interface EIP6963ProviderDetail {
  info: Info
  provider: Provider
}

interface ExternalProvider extends EthereumProvider {
  _addresses?: string[]
}

// -- Client --------------------------------------------------------------------
export class Web3Modal extends Web3ModalScaffold {
  private hasSyncedConnectedAccount = false

  private EIP6963Providers: EIP6963ProviderDetail[] = []

  private walletConnectProvider?: EthereumProvider

  private walletConnectProviderInitPromise?: Promise<void>

  private projectId: string

  private chains: Chain[]

  private metadata?: Metadata

  private options: Web3ModalClientOptions | undefined = undefined

  public constructor(options: Web3ModalClientOptions) {
    const {
      ethersConfig,
      siweConfig,
      chains,
      defaultChain,
      tokens,
      chainImages,
      _sdkVersion,
      ...w3mOptions
    } = options

    if (!ethersConfig) {
      throw new Error('web3modal:constructor - ethersConfig is undefined')
    }

    if (!w3mOptions.projectId) {
      throw new Error('web3modal:constructor - projectId is undefined')
    }

    const networkControllerClient: NetworkControllerClient = {
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
                'networkControllerClient:getApprovedCaipNetworks - provider is undefined'
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

        if (this.getIsSiweEnabled()) {
          const { SIWEController, getDidChainId, getDidAddress } = await import('@web3modal/siwe')
          if (!SIWEController.state._client) {
            return
          }
          const result = await WalletConnectProvider.authenticate({
            nonce: await SIWEController.getNonce(),
            methods: OPTIONAL_METHODS,
            ...(await SIWEController.getMessageParams()),
            chains: this.chains.map(chain => chain.chainId)
          })
          // Auths is an array of signed CACAO objects https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-74.md
          const signedCacao = result?.auths?.[0]
          if (signedCacao) {
            const { p, s } = signedCacao
            const chainId = getDidChainId(p.iss)
            const address = getDidAddress(p.iss)
            if (address && chainId) {
              SIWEController.setSession({
                address,
                chainId: parseInt(chainId, 10)
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
          await WalletConnectProvider.connect()
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
          } catch (error) {
            EthersStoreUtil.setError(error)
          }
          this.setEIP6963Provider(provider, info.name)
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
        if (this.getIsSiweEnabled()) {
          const { SIWEController } = await import('@web3modal/siwe')
          if (SIWEController.state._client?.options?.signOutOnDisconnect) {
            await SIWEController.signOut()
          }
        }
        if (providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
          const WalletConnectProvider = provider
          await (WalletConnectProvider as unknown as EthereumProvider).disconnect()
        } else if (provider) {
          provider.emit('disconnect')
        }
      },

      signMessage: async (message: string) => {
        const provider = EthersStoreUtil.state.provider
        if (!provider) {
          throw new Error('connectionControllerClient:signMessage - provider is undefined')
        }
        const hexMessage = utils.isHexString(message)
          ? message
          : utils.hexlify(utils.toUtf8Bytes(message))
        const signature = await provider.request({
          method: 'personal_sign',
          params: [hexMessage, this.getAddress()]
        })

        return signature as `0x${string}`
      },

      parseUnits: (value: string, decimals: number) =>
        ethers.utils.parseUnits(value, decimals).toBigInt(),

      formatUnits: (value: bigint, decimals: number) => ethers.utils.formatUnits(value, decimals),

      sendTransaction: async (data: SendTransactionArgs) => {
        const provider = EthersStoreUtil.state.provider
        const address = EthersStoreUtil.state.address

        if (!provider) {
          throw new Error('connectionControllerClient:sendTransaction - provider is undefined')
        }

        if (!address) {
          throw new Error('connectionControllerClient:sendTransaction - address is undefined')
        }

        const txParams = {
          to: data.to,
          value: data.value,
          gasLimit: data.gas,
          gasPrice: data.gasPrice,
          data: data.data,
          type: 0
        }

        const browserProvider = new ethers.providers.Web3Provider(provider)
        const signer = browserProvider.getSigner()

        const txResponse = await signer.sendTransaction(txParams)
        const txReceipt = await txResponse.wait()

        return (txReceipt?.blockHash as `0x${string}`) || null
      }
    }

    super({
      networkControllerClient,
      connectionControllerClient,
      siweControllerClient: siweConfig,
      defaultChain: EthersHelpersUtil.getCaipDefaultChain(defaultChain),
      tokens: HelpersUtil.getCaipTokens(tokens),
      _sdkVersion: _sdkVersion ?? `html-ethers5-${ConstantsUtil.VERSION}`,
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

    if (ethersConfig.injected) {
      this.checkActiveInjectedProvider(ethersConfig)
    }

    if (ethersConfig.coinbase) {
      this.checkActiveCoinbaseProvider(ethersConfig)
    }

    // Setup EIP6963 providers
    if (typeof window !== 'undefined') {
      this.listenConnectors(true)
      this.checkActive6963Provider()
    }

    this.setEIP6963Enabled(ethersConfig.EIP6963)
  }

  // -- Public ------------------------------------------------------------------

  // @ts-expect-error: Overriden state type is correct
  public override getState() {
    const state = super.getState()

    return {
      ...state,
      selectedNetworkId: NetworkUtil.caipNetworkIdToNumber(state.selectedNetworkId)
    }
  }

  // @ts-expect-error: Overriden state type is correct
  public override subscribeState(callback: (state: Web3ModalState) => void) {
    return super.subscribeState(state =>
      callback({
        ...state,
        selectedNetworkId: NetworkUtil.caipNetworkIdToNumber(state.selectedNetworkId)
      })
    )
  }

  public setAddress(address?: string) {
    const originalAddress = address ? (utils.getAddress(address) as Address) : undefined
    EthersStoreUtil.setAddress(originalAddress)
  }

  public getAddress() {
    const { address } = EthersStoreUtil.state

    return address ? utils.getAddress(address) : address
  }

  public getError() {
    return EthersStoreUtil.state.error
  }

  public getChainId() {
    return EthersStoreUtil.state.chainId
  }

  public getStatus() {
    return EthersStoreUtil.state.status
  }

  public getIsConnected() {
    return EthersStoreUtil.state.isConnected
  }

  public getWalletProvider() {
    return EthersStoreUtil.state.provider
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
      provider?.emit('disconnect')
    } else {
      await (provider as unknown as EthereumProvider).disconnect()
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
      this.setAddress(WalletConnectProvider.accounts?.[0])
      this.watchWalletConnect()
    }
  }

  private async setEIP6963Provider(provider: Provider, name: string) {
    window?.localStorage.setItem(EthersConstantsUtil.WALLET_ID, name)

    if (provider) {
      const { address, chainId } = await EthersHelpersUtil.getUserInfo(provider)
      if (address && chainId) {
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType('eip6963')
        EthersStoreUtil.setProvider(provider)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        this.setAddress(address)
        this.watchEIP6963(provider)
      }
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
        EthersStoreUtil.setProvider(config.injected)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        this.setAddress(address)
        this.watchCoinbase(config)
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
      const { address, chainId } = await EthersHelpersUtil.getUserInfo(CoinbaseProvider)
      if (address && chainId) {
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType('coinbaseWalletSDK')
        EthersStoreUtil.setProvider(config.coinbase)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        this.setAddress(address)
        this.watchCoinbase(config)
      }
    }
  }

  private async watchWalletConnect() {
    const WalletConnectProvider = await this.getWalletConnectProvider()

    function disconnectHandler() {
      localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
      EthersStoreUtil.reset()

      WalletConnectProvider?.removeListener('disconnect', disconnectHandler)
      WalletConnectProvider?.removeListener('accountsChanged', accountsChangedHandler)
      WalletConnectProvider?.removeListener('chainChanged', chainChangedHandler)
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

    if (WalletConnectProvider) {
      WalletConnectProvider.on('disconnect', disconnectHandler)
      WalletConnectProvider.on('accountsChanged', accountsChangedHandler)
      WalletConnectProvider.on('chainChanged', chainChangedHandler)
    }
  }

  private watchInjected(config: ProviderType) {
    const InjectedProvider = config.injected

    function disconnectHandler() {
      localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
      EthersStoreUtil.reset()

      InjectedProvider?.removeListener('disconnect', disconnectHandler)
      InjectedProvider?.removeListener('accountsChanged', accountsChangedHandler)
      InjectedProvider?.removeListener('chainChanged', chainChangedHandler)
    }

    function accountsChangedHandler(accounts: string[]) {
      const currentAccount = accounts?.[0]
      if (currentAccount) {
        EthersStoreUtil.setAddress(utils.getAddress(currentAccount) as Address)
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

    if (InjectedProvider) {
      InjectedProvider.on('disconnect', disconnectHandler)
      InjectedProvider.on('accountsChanged', accountsChangedHandler)
      InjectedProvider.on('chainChanged', chainChangedHandler)
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
        EthersStoreUtil.setAddress(utils.getAddress(currentAccount) as Address)
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

    provider.on('disconnect', disconnectHandler)
    provider.on('accountsChanged', accountsChangedHandler)
    provider.on('chainChanged', chainChangedHandler)
  }

  private watchCoinbase(config: ProviderType) {
    const CoinbaseProvider = config.coinbase
    const walletId = localStorage.getItem(EthersConstantsUtil.WALLET_ID)

    function disconnectHandler() {
      localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
      EthersStoreUtil.reset()

      CoinbaseProvider?.removeListener('disconnect', disconnectHandler)
      CoinbaseProvider?.removeListener('accountsChanged', accountsChangedHandler)
      CoinbaseProvider?.removeListener('chainChanged', chainChangedHandler)
    }

    function accountsChangedHandler(accounts: string[]) {
      if (accounts.length === 0) {
        localStorage.removeItem(EthersConstantsUtil.WALLET_ID)
        EthersStoreUtil.reset()
      } else {
        EthersStoreUtil.setAddress(accounts[0] as Address)
      }
    }

    function chainChangedHandler(chainId: string) {
      if (chainId && walletId === ConstantsUtil.COINBASE_SDK_CONNECTOR_ID) {
        const chain = Number(chainId)
        EthersStoreUtil.setChainId(chain)
      }
    }

    if (CoinbaseProvider) {
      CoinbaseProvider.on('disconnect', disconnectHandler)
      CoinbaseProvider.on('accountsChanged', accountsChangedHandler)
      CoinbaseProvider.on('chainChanged', chainChangedHandler)
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
      this.syncConnectedWalletInfo()

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
      } else if (isConnected) {
        this.setCaipNetwork({
          id: `${ConstantsUtil.EIP155}:${chainId}`
        })
      }
    }
  }

  private async syncProfile(address: Address) {
    const chainId = EthersStoreUtil.state.chainId

    try {
      const { name, avatar } = await this.fetchIdentity({
        address
      })
      this.setProfileName(name)
      this.setProfileImage(avatar)
    } catch {
      if (chainId === 1) {
        const ensProvider = new ethers.providers.InfuraProvider('mainnet')
        const name = await ensProvider.lookupAddress(address)
        const avatar = await ensProvider.getAvatar(address)

        if (name) {
          this.setProfileName(name)
        }
        if (avatar) {
          this.setProfileImage(avatar)
        }
      } else {
        this.setProfileName(null)
        this.setProfileImage(null)
      }
    }
  }

  private async syncBalance(address: Address) {
    const chainId = EthersStoreUtil.state.chainId
    if (chainId && this.chains) {
      const chain = this.chains.find(c => c.chainId === chainId)

      if (chain) {
        const JsonRpcProvider = new ethers.providers.JsonRpcProvider(chain.rpcUrl, {
          chainId,
          name: chain.name
        })
        if (JsonRpcProvider) {
          const balance = await JsonRpcProvider.getBalance(address)
          const formattedBalance = utils.formatEther(balance)
          this.setBalance(formattedBalance, chain.currency)
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
          this.setConnectedWalletInfo({
            ...currentProvider.info
          })
        }
      }
    } else if (providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
      const provider = EthersStoreUtil.state.provider as unknown as EthereumProvider

      if (provider.session) {
        this.setConnectedWalletInfo({
          ...provider.session.peer.metadata,
          name: provider.session.peer.metadata.name,
          icon: provider.session.peer.metadata.icons?.[0]
        })
      }
    } else if (currentActiveWallet) {
      this.setConnectedWalletInfo({
        name: currentActiveWallet
      })
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
            }
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
        id: ConstantsUtil.COINBASE_SDK_CONNECTOR_ID,
        explorerId: PresetsUtil.ConnectorExplorerIds[ConstantsUtil.COINBASE_SDK_CONNECTOR_ID],
        imageId: PresetsUtil.ConnectorImageIds[ConstantsUtil.COINBASE_SDK_CONNECTOR_ID],
        imageUrl: this.options?.connectorImages?.[ConstantsUtil.COINBASE_SDK_CONNECTOR_ID],
        name: PresetsUtil.ConnectorNamesMap[ConstantsUtil.COINBASE_SDK_CONNECTOR_ID],
        type: 'EXTERNAL'
      })
    }

    this.setConnectors(w3mConnectors)
  }

  private eip6963EventHandler(event: CustomEventInit<EIP6963ProviderDetail>) {
    if (event.detail) {
      const { info, provider } = event.detail
      const connectors = this.getConnectors()
      const existingConnector = connectors.find(c => c.name === info.name)
      const coinbaseConnector = connectors.find(
        c => c.id === ConstantsUtil.COINBASE_SDK_CONNECTOR_ID
      )
      const isCoinbaseDuplicated =
        coinbaseConnector &&
        event.detail.info.rdns ===
          ConstantsUtil.CONNECTOR_RDNS_MAP[ConstantsUtil.COINBASE_SDK_CONNECTOR_ID]

      if (!existingConnector && !isCoinbaseDuplicated) {
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
