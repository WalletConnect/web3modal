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
  Token,
  WriteContractArgs
} from '@web3modal/scaffold'
import { Web3ModalScaffold } from '@web3modal/scaffold'
import { ConstantsUtil, PresetsUtil, HelpersUtil } from '@web3modal/scaffold-utils'
import EthereumProvider, { OPTIONAL_METHODS } from '@walletconnect/ethereum-provider'
import type { Web3ModalSIWEClient } from '@web3modal/siwe'
import { ConstantsUtil as CommonConstants } from '@web3modal/common'
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
// -- Types ---------------------------------------------------------------------
export interface Web3ModalClientOptions extends Omit<LibraryOptions, 'defaultChain' | 'tokens'> {
  ethersConfig: ProviderType
  chains: Chain[]
  siweConfig?: Web3ModalSIWEClient
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
  accounts: string[]
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

  private authProvider?: W3mFrameProvider

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

          const clientId = await WalletConnectProvider?.signer?.client?.core?.crypto?.getClientId()
          if (clientId) {
            this.setClientId(clientId)
          }

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
                cacao: signedCacao,
                clientId
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

        if (this.getIsSiweEnabled()) {
          const { SIWEController } = await import('@web3modal/siwe')
          if (SIWEController.state?._client?.options?.signOutOnDisconnect) {
            await SIWEController.signOut()
          }
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
          const chainId = NetworkUtil.caipNetworkIdToNumber(this.getCaipNetwork()?.id)
          let ensName: string | null = null
          let wcName: boolean | string = false

          if (value?.endsWith(CommonConstants.WC_NAME_SUFFIX)) {
            wcName = await this.resolveWalletConnectName(value)
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

    super({
      networkControllerClient,
      connectionControllerClient,
      siweControllerClient: siweConfig,
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

    // Setup EIP6963 providers
    if (typeof window !== 'undefined') {
      this.listenConnectors(true)
      this.checkActive6963Provider()
    }

    this.setEIP6963Enabled(ethersConfig.EIP6963)

    if (ethersConfig.injected) {
      this.checkActiveInjectedProvider(ethersConfig)
    }

    if (ethersConfig.auth) {
      this.syncAuthConnector(w3mOptions.projectId, ethersConfig.auth)
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
    const networkControllerChainId = NetworkUtil.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

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

    if (providerType === ConstantsUtil.AUTH_CONNECTOR_ID) {
      await this.authProvider?.disconnect()
    } else if (providerType === 'injected' || providerType === 'eip6963') {
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
      this.setAddress(WalletConnectProvider.accounts?.[0])
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
        EthersStoreUtil.setProvider(config.injected)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        this.setAddress(address)
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
        EthersStoreUtil.setProvider(provider)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        this.setAddress(address)
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

  private async setAuthProvider() {
    window?.localStorage.setItem(EthersConstantsUtil.WALLET_ID, ConstantsUtil.AUTH_CONNECTOR_ID)

    if (this.authProvider) {
      super.setLoading(true)
      const { address, chainId, smartAccountDeployed, preferredAccountType } =
        await this.authProvider.connect({ chainId: this.getChainId() })

      const { smartAccountEnabledNetworks } =
        await this.authProvider.getSmartAccountEnabledNetworks()

      this.setSmartAccountEnabledNetworks(smartAccountEnabledNetworks)
      if (address && chainId) {
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setProviderType(ConstantsUtil.AUTH_CONNECTOR_ID as 'w3mAuth')
        EthersStoreUtil.setProvider(this.authProvider as unknown as CombinedProvider)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        EthersStoreUtil.setAddress(address as Address)
        EthersStoreUtil.setPreferredAccountType(preferredAccountType as W3mFrameTypes.AccountType)
        this.setSmartAccountDeployed(Boolean(smartAccountDeployed))

        this.watchAuth()
        this.watchModal()
      }
      super.setLoading(false)
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
            if (super.isOpen()) {
              if (super.isTransactionStackEmpty()) {
                return
              }
              if (super.isTransactionShouldReplaceView()) {
                super.replace('ApproveTransaction')
              } else {
                super.redirect('ApproveTransaction')
              }
            } else {
              super.open({ view: 'ApproveTransaction' })
            }
          }
        } else {
          super.open()
          const method = W3mFrameHelpers.getRequestMethod(request)
          // eslint-disable-next-line no-console
          console.error(W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_MESSAGE, { method })
          setTimeout(() => {
            this.showErrorMessage(W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_UI_MESSAGE)
          }, 300)
        }
      })
      this.authProvider.onRpcResponse(response => {
        const responseType = W3mFrameHelpers.getResponseType(response)

        switch (responseType) {
          case W3mFrameConstants.RPC_RESPONSE_TYPE_ERROR: {
            const isModalOpen = super.isOpen()

            if (isModalOpen) {
              if (super.isTransactionStackEmpty()) {
                super.close()
              } else {
                super.popTransactionStack(true)
              }
            }
            break
          }
          case W3mFrameConstants.RPC_RESPONSE_TYPE_TX: {
            if (super.isTransactionStackEmpty()) {
              super.close()
            } else {
              super.popTransactionStack()
            }
            break
          }
          default:
            break
        }
      })
      this.authProvider.onNotConnected(() => {
        this.setIsConnected(false)
        super.setLoading(false)
      })
      this.authProvider.onIsConnected(({ preferredAccountType }) => {
        this.setIsConnected(true)
        super.setLoading(false)
        EthersStoreUtil.setPreferredAccountType(preferredAccountType as W3mFrameTypes.AccountType)
      })

      this.authProvider.onSetPreferredAccount(({ address, type }) => {
        if (!address) {
          return
        }
        super.setLoading(true)
        const chainId = NetworkUtil.caipNetworkIdToNumber(this.getCaipNetwork()?.id)
        EthersStoreUtil.setAddress(address as Address)
        EthersStoreUtil.setChainId(chainId)
        EthersStoreUtil.setStatus('connected')
        EthersStoreUtil.setIsConnected(true)
        EthersStoreUtil.setPreferredAccountType(type as W3mFrameTypes.AccountType)
        this.syncAccount().then(() => super.setLoading(false))
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
    this.resetAccount()

    if (isConnected && address && chainId) {
      const caipAddress: CaipAddress = `${ConstantsUtil.EIP155}:${chainId}:${address}`

      this.setIsConnected(isConnected)
      this.setPreferredAccountType(preferredAccountType)
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
            await this.syncProfile(address)
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

  private async syncWalletConnectName(address: Address) {
    try {
      const registeredWcNames = await this.getWalletConnectName(address)
      if (registeredWcNames[0]) {
        const wcName = registeredWcNames[0]
        this.setProfileName(wcName.name)
      } else {
        this.setProfileName(null)
      }
    } catch {
      this.setProfileName(null)
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

      if (!name) {
        await this.syncWalletConnectName(address)
      }
    } catch {
      if (chainId === 1) {
        const ensProvider = new InfuraProvider('mainnet')
        const name = await ensProvider.lookupAddress(address)
        const avatar = await ensProvider.getAvatar(address)

        if (name) {
          this.setProfileName(name)
        } else {
          await this.syncWalletConnectName(address)
        }
        if (avatar) {
          this.setProfileImage(avatar)
        }
      } else {
        await this.syncWalletConnectName(address)
        this.setProfileImage(null)
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
            super.setLoading(true)
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
            super.setLoading(false)
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

  private async syncAuthConnector(projectId: string, auth: ProviderType['auth']) {
    if (typeof window !== 'undefined') {
      this.authProvider = new W3mFrameProvider(projectId)

      this.addConnector({
        id: ConstantsUtil.AUTH_CONNECTOR_ID,
        type: 'AUTH',
        name: 'Auth',
        provider: this.authProvider,
        email: auth?.email,
        socials: auth?.socials,
        showWallets: auth?.showWallets === undefined ? true : auth.showWallets,
        walletFeatures: auth?.walletFeatures
      })

      super.setLoading(true)
      const isLoginEmailUsed = this.authProvider.getLoginEmailUsed()
      super.setLoading(isLoginEmailUsed)
      const { isConnected } = await this.authProvider.isConnected()
      if (isConnected) {
        await this.setAuthProvider()
      } else {
        super.setLoading(false)
      }
    }
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
