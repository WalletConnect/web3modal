import type { AppKitOptions, AppKitOptionsWithCaipNetworks } from '@reown/appkit'
import {
  SafeLocalStorage,
  SafeLocalStorageKeys,
  type AdapterType,
  type CaipAddress,
  type CaipNetwork,
  type CaipNetworkId,
  type ChainNamespace
} from '@reown/appkit-common'
import {
  AccountController,
  ChainController,
  CoreHelperUtil,
  AlertController,
  type CombinedProvider,
  type Connector
} from '@reown/appkit-core'
import {
  EthersHelpersUtil,
  type Provider,
  type ProviderType,
  type Address
} from '@reown/appkit-utils/ethers'
import type { AppKit } from '@reown/appkit'
import {
  W3mFrameHelpers,
  W3mFrameProvider,
  W3mFrameRpcConstants,
  type W3mFrameTypes
} from '@reown/appkit-wallet'
import { ConstantsUtil as CoreConstantsUtil } from '@reown/appkit-core'
import { ConstantsUtil as CommonConstantsUtil } from '@reown/appkit-common'
import {
  CaipNetworksUtil,
  ConstantsUtil,
  ErrorUtil,
  HelpersUtil,
  PresetsUtil
} from '@reown/appkit-utils'
import UniversalProvider from '@walletconnect/universal-provider'
import type { ConnectionControllerClient, NetworkControllerClient } from '@reown/appkit-core'
import { WcConstantsUtil } from '@reown/appkit'
import { EthersMethods } from './utils/EthersMethods.js'
import { formatEther, InfuraProvider, JsonRpcProvider } from 'ethers'
import type { PublicStateControllerState } from '@reown/appkit-core'
import { ProviderUtil, type ProviderIdType } from '@reown/appkit/store'
import { CoinbaseWalletSDK, type ProviderInterface } from '@coinbase/wallet-sdk'
import { W3mFrameProviderSingleton } from '@reown/appkit/auth-provider'

// -- Types ---------------------------------------------------------------------
export interface AdapterOptions {
  ethersConfig: ProviderType
  defaultCaipNetwork?: CaipNetwork
}

type CoinbaseProviderError = {
  code: number
  message: string
  data: string | undefined
}

interface ExternalProvider extends Provider {
  accounts: string[]
}

declare global {
  interface Window {
    ethereum?: Record<string, unknown>
  }
}

interface Info {
  uuid: string
  name: string
  icon: string
  rdns: string
}

export interface EIP6963ProviderDetail {
  info: Info
  provider: Provider
}

export class EthersAdapter {
  private appKit: AppKit | undefined = undefined

  private EIP6963Providers: EIP6963ProviderDetail[] = []

  private ethersConfig?: AdapterOptions['ethersConfig']

  private authProvider?: W3mFrameProvider

  // -- Public variables --------------------------------------------------------
  public options: AppKitOptions | undefined = undefined

  public caipNetworks: CaipNetwork[] = []

  public chainNamespace: ChainNamespace = CommonConstantsUtil.CHAIN.EVM

  public networkControllerClient?: NetworkControllerClient

  public connectionControllerClient?: ConnectionControllerClient

  public siweControllerClient = this.options?.siweConfig

  public tokens = HelpersUtil.getCaipTokens(this.options?.tokens)

  public defaultCaipNetwork: CaipNetwork | undefined = undefined

  public adapterType: AdapterType = 'ethers'

  private createEthersConfig(options: AppKitOptions) {
    if (!options.metadata) {
      return undefined
    }
    let injectedProvider: Provider | undefined = undefined

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    let coinbaseProvider: ProviderInterface | undefined = undefined

    function getInjectedProvider() {
      if (injectedProvider) {
        return injectedProvider
      }

      if (typeof window === 'undefined') {
        return undefined
      }

      if (!window.ethereum) {
        return undefined
      }

      //  @ts-expect-error window.ethereum satisfies Provider
      injectedProvider = window.ethereum

      return injectedProvider
    }

    function getCoinbaseProvider() {
      if (coinbaseProvider) {
        return coinbaseProvider
      }

      if (typeof window === 'undefined') {
        return undefined
      }

      const coinbaseWallet = new CoinbaseWalletSDK({
        appName: options?.metadata?.name,
        appLogoUrl: options?.metadata?.icons[0],
        appChainIds: options.networks?.map(caipNetwork => caipNetwork.id as number) || [1, 84532]
      })

      coinbaseProvider = coinbaseWallet.makeWeb3Provider({
        options: options.coinbasePreference ?? 'all'
      })

      return coinbaseProvider
    }

    const providers: ProviderType = { metadata: options.metadata }

    if (options.enableInjected !== false) {
      providers.injected = getInjectedProvider()
    }

    if (options.enableCoinbase !== false) {
      providers.coinbase = getCoinbaseProvider()
    }

    providers.EIP6963 = options.enableEIP6963 !== false

    return providers
  }

  // -- Public -------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
  public constructor() {
    ChainController.subscribeKey('activeCaipNetwork', val => {
      const caipAddress = this.appKit?.getCaipAddress(this.chainNamespace)
      const isEVMAddress = caipAddress?.startsWith('eip155:')
      const isEVMNetwork = val?.chainNamespace === this.chainNamespace

      if (isEVMAddress && isEVMNetwork && caipAddress) {
        this.syncBalance(CoreHelperUtil.getPlainAddress(caipAddress) as Address, val)
        this.syncAccount({
          address: CoreHelperUtil.getPlainAddress(caipAddress) as Address | undefined,
          caipNetwork: val
        })
      }
    })
    ChainController.subscribeKey('activeCaipAddress', val => {
      const isEVMAddress = val?.startsWith('eip155:')
      const caipNetwork = ChainController.state.activeCaipNetwork
      const isEVMNetwork = caipNetwork?.chainNamespace === this.chainNamespace

      if (isEVMAddress) {
        if (isEVMNetwork) {
          this.syncBalance(CoreHelperUtil.getPlainAddress(val) as Address, caipNetwork)
        }
        this.syncAccount({ address: CoreHelperUtil.getPlainAddress(val) as Address })
      }
    })
    AccountController.subscribeKey(
      'shouldUpdateToAddress',
      newAddress => {
        const isEVMAddress = newAddress?.startsWith('0x')

        if (isEVMAddress) {
          this.syncAccount({ address: newAddress as Address })
        }
      },
      this.chainNamespace
    )
  }

  public construct(appKit: AppKit, options: AppKitOptionsWithCaipNetworks) {
    this.appKit = appKit
    this.options = options
    this.caipNetworks = options.networks
    this.defaultCaipNetwork = options.defaultNetwork
      ? CaipNetworksUtil.extendCaipNetwork(options.defaultNetwork, {
          customNetworkImageUrls: options.chainImages,
          projectId: options.projectId
        })
      : this.caipNetworks[0]
    this.tokens = HelpersUtil.getCaipTokens(options.tokens)
    this.ethersConfig = this.createEthersConfig(options)

    this.networkControllerClient = {
      switchCaipNetwork: async caipNetwork => {
        if (caipNetwork?.id) {
          try {
            await this.switchNetwork(caipNetwork)
          } catch (error) {
            throw new Error('networkControllerClient:switchCaipNetwork - unable to switch chain')
          }
        }
      },

      // eslint-disable-next-line @typescript-eslint/require-await
      getApprovedCaipNetworksData: async () => this.getApprovedCaipNetworksData()
    }

    this.connectionControllerClient = {
      connectWalletConnect: async onUri => {
        await this.appKit?.universalAdapter?.connectionControllerClient?.connectWalletConnect?.(
          onUri
        )
      },

      //  @ts-expect-error TODO expected types in arguments are incomplete
      connectExternal: async ({
        id,
        info,
        provider
      }: {
        id: string
        info?: Info
        provider: Provider
      }) => {
        this.appKit?.setClientId(null)

        const connectorConfig = {
          [ConstantsUtil.INJECTED_CONNECTOR_ID]: {
            getProvider: () => this.ethersConfig?.injected,
            providerType: 'injected' as const
          },
          [ConstantsUtil.EIP6963_CONNECTOR_ID]: {
            getProvider: () => provider,
            providerType: 'eip6963' as const
          },
          [ConstantsUtil.COINBASE_SDK_CONNECTOR_ID]: {
            getProvider: () => this.ethersConfig?.coinbase,
            providerType: 'coinbase' as const
          },
          [ConstantsUtil.AUTH_CONNECTOR_ID]: {
            getProvider: () => this.authProvider,
            providerType: 'w3mAuth' as const
          }
        }

        const selectedConnector = connectorConfig[id]

        if (!selectedConnector) {
          throw new Error(`Unsupported connector ID: ${id}`)
        }

        const selectedProvider = selectedConnector.getProvider() as Provider

        if (!selectedProvider) {
          throw new Error(`Provider for connector ${id} is undefined`)
        }

        try {
          if (selectedProvider && id !== ConstantsUtil.AUTH_CONNECTOR_ID) {
            await selectedProvider.request({ method: 'eth_requestAccounts' })
          }
          await this.setProvider(
            selectedProvider,
            selectedConnector.providerType as ProviderIdType,
            info?.name
          )
        } catch (error) {
          if (id === ConstantsUtil.COINBASE_SDK_CONNECTOR_ID) {
            throw new Error((error as CoinbaseProviderError).message)
          }
        }
      },

      checkInstalled: (ids?: string[]) => {
        if (!ids) {
          return Boolean(window.ethereum)
        }

        if (this.ethersConfig?.injected) {
          if (!window?.ethereum) {
            return false
          }
        }

        return ids.some(id => Boolean(window.ethereum?.[String(id)]))
      },

      disconnect: async () => {
        const provider = ProviderUtil.getProvider<UniversalProvider | Provider>('eip155')
        const providerId = ProviderUtil.state.providerIds['eip155']

        this.appKit?.setClientId(null)
        if (this.options?.siweConfig?.options?.signOutOnDisconnect) {
          const { SIWEController } = await import('@reown/appkit-siwe')
          await SIWEController.signOut()
        }

        const disconnectConfig = {
          [ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID]: async () =>
            await this.appKit?.universalAdapter?.connectionControllerClient?.disconnect(),

          coinbaseWalletSDK: async () =>
            await this.appKit?.universalAdapter?.connectionControllerClient?.disconnect(),

          [ConstantsUtil.AUTH_CONNECTOR_ID]: async () => {
            await this.authProvider?.disconnect()
          },

          [ConstantsUtil.EIP6963_CONNECTOR_ID]: async () => {
            if (provider) {
              await this.revokeProviderPermissions(provider as Provider)
            }
          },
          [ConstantsUtil.INJECTED_CONNECTOR_ID]: async () => {
            if (provider) {
              ;(provider as Provider).emit('disconnect')
              await this.revokeProviderPermissions(provider as Provider)
            }
          }
        }
        const disconnectFunction = disconnectConfig[providerId as string]

        if (disconnectFunction) {
          await disconnectFunction()
        } else {
          console.warn(`No disconnect function found for provider type: ${providerId}`)
        }

        // Common cleanup actions
        SafeLocalStorage.removeItem(SafeLocalStorageKeys.WALLET_ID)
        this.appKit?.resetAccount(this.chainNamespace)
      },
      signMessage: async (message: string) => {
        const provider = ProviderUtil.getProvider<Provider>(this.chainNamespace)
        const caipAddress = ChainController.state.activeCaipAddress
        const address = CoreHelperUtil.getPlainAddress(caipAddress)

        if (!address) {
          throw new Error('Address is undefined')
        }

        if (!provider) {
          throw new Error('Provider is undefined')
        }

        return await EthersMethods.signMessage(message, provider, address)
      },

      parseUnits: EthersMethods.parseUnits,
      formatUnits: EthersMethods.formatUnits,

      estimateGas: async data => {
        if (data.chainNamespace && data.chainNamespace !== 'eip155') {
          throw new Error(`Invalid chain namespace - Expected eip155, got ${data.chainNamespace}`)
        }
        const provider = ProviderUtil.getProvider<Provider>('eip155')
        const caipAddress = ChainController.state.activeCaipAddress
        const address = CoreHelperUtil.getPlainAddress(caipAddress)
        const caipNetwork = this.appKit?.getCaipNetwork()

        if (!address) {
          throw new Error('Address is undefined')
        }

        if (!provider) {
          throw new Error('Provider is undefined')
        }

        return await EthersMethods.estimateGas(data, provider, address, Number(caipNetwork?.id))
      },

      getCapabilities: async (params: string) => {
        const provider = ProviderUtil.getProvider(CommonConstantsUtil.CHAIN.EVM)

        if (!provider) {
          throw new Error('Provider is undefined')
        }

        const walletCapabilitiesString = provider.session?.sessionProperties?.['capabilities']
        if (walletCapabilitiesString) {
          const walletCapabilities = EthersMethods.parseWalletCapabilities(walletCapabilitiesString)
          const accountCapabilities = walletCapabilities[params]
          if (accountCapabilities) {
            return accountCapabilities
          }
        }

        return await provider.request({ method: 'wallet_getCapabilities', params: [params] })
      },

      grantPermissions: async params => {
        const provider = ProviderUtil.getProvider<Provider>(CommonConstantsUtil.CHAIN.EVM)

        if (!provider) {
          throw new Error('Provider is undefined')
        }

        return await provider.request({ method: 'wallet_grantPermissions', params })
      },

      sendTransaction: async data => {
        if (data.chainNamespace && data.chainNamespace !== 'eip155') {
          throw new Error(`Invalid chain namespace - Expected eip155, got ${data.chainNamespace}`)
        }
        const provider = ProviderUtil.getProvider<Provider>('eip155')
        const caipAddress = ChainController.state.activeCaipAddress
        const address = CoreHelperUtil.getPlainAddress(caipAddress)
        const caipNetwork = this.appKit?.getCaipNetwork()

        if (!address) {
          throw new Error('Address is undefined')
        }

        if (!provider) {
          throw new Error('Provider is undefined')
        }

        return await EthersMethods.sendTransaction(data, provider, address, Number(caipNetwork?.id))
      },

      writeContract: async data => {
        const provider = ProviderUtil.getProvider<Provider>('eip155')
        const caipAddress = ChainController.state.activeCaipAddress
        const address = CoreHelperUtil.getPlainAddress(caipAddress)
        const caipNetwork = this.appKit?.getCaipNetwork()

        if (!address) {
          throw new Error('Address is undefined')
        }

        if (!provider) {
          throw new Error('Provider is undefined')
        }

        return await EthersMethods.writeContract(data, provider, address, Number(caipNetwork?.id))
      },

      getEnsAddress: async (value: string) => {
        if (this.appKit) {
          return await EthersMethods.getEnsAddress(value, this.appKit)
        }

        return false
      },

      getEnsAvatar: async (value: string) => {
        const caipNetwork = this.appKit?.getCaipNetwork()

        return await EthersMethods.getEnsAvatar(value, Number(caipNetwork?.id))
      }
    }

    ChainController.state.chains.set(this.chainNamespace, {
      chainNamespace: this.chainNamespace,
      connectionControllerClient: this.connectionControllerClient,
      networkControllerClient: this.networkControllerClient,
      adapterType: this.adapterType,
      caipNetworks: this.caipNetworks
    })

    if (this.ethersConfig) {
      this.syncConnectors(this.ethersConfig)
    }

    if (typeof window !== 'undefined') {
      this.listenConnectors(true)
    }

    this.appKit?.setEIP6963Enabled(this.ethersConfig?.EIP6963)

    const emailEnabled =
      options.features?.email === undefined
        ? CoreConstantsUtil.DEFAULT_FEATURES.email
        : options.features?.email
    const socialsEnabled = options.features?.socials
      ? options.features?.socials?.length > 0
      : CoreConstantsUtil.DEFAULT_FEATURES.socials

    if (emailEnabled || socialsEnabled) {
      this.syncAuthConnector(this.options.projectId)
    }

    if (this.ethersConfig) {
      this.checkActiveProviders(this.ethersConfig)
    }

    this.syncRequestedNetworks(this.caipNetworks)
  }

  public subscribeState(callback: (state: PublicStateControllerState) => void) {
    return this.appKit?.subscribeState(state => callback(state))
  }

  public async disconnect() {
    await this.connectionControllerClient?.disconnect()
  }

  // -- Private -----------------------------------------------------------------
  private async revokeProviderPermissions(provider: Provider | CombinedProvider) {
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
      // eslint-disable-next-line no-console
      console.info('Could not revoke permissions from wallet. Disconnecting...', error)
    }
  }

  private getApprovedCaipNetworksData(): Promise<{
    supportsAllNetworks: boolean
    approvedCaipNetworkIds: CaipNetworkId[]
  }> {
    return new Promise(resolve => {
      const walletId = SafeLocalStorage.getItem(SafeLocalStorageKeys.WALLET_ID)

      if (!walletId) {
        throw new Error('No wallet id found to get approved networks data')
      }

      const providerConfigs = {
        [ConstantsUtil.AUTH_CONNECTOR_ID]: {
          supportsAllNetworks: true,
          approvedCaipNetworkIds: PresetsUtil.WalletConnectRpcChainIds.map(
            id => `${ConstantsUtil.EIP155}:${id}`
          ) as CaipNetworkId[]
        }
      }

      const networkData = providerConfigs[walletId as unknown as keyof typeof providerConfigs]

      if (networkData) {
        resolve(networkData)
      } else {
        resolve({
          supportsAllNetworks: true,
          approvedCaipNetworkIds: []
        })
      }
    })
  }

  private checkActiveProviders(config: ProviderType) {
    const walletId = SafeLocalStorage.getItem(SafeLocalStorageKeys.WALLET_ID)
    const walletName = SafeLocalStorage.getItem(SafeLocalStorageKeys.WALLET_NAME)

    if (!walletId) {
      return
    }

    const providerConfigs = {
      [ConstantsUtil.INJECTED_CONNECTOR_ID]: {
        provider: config.injected
      },
      [ConstantsUtil.COINBASE_SDK_CONNECTOR_ID]: {
        provider: config.coinbase as unknown as ExternalProvider
      },
      [ConstantsUtil.EIP6963_CONNECTOR_ID]: {
        provider: this.EIP6963Providers.find(p => p.info.name === walletName)?.provider
      }
    }

    const activeConfig = providerConfigs[walletId as unknown as keyof typeof providerConfigs]

    if (activeConfig?.provider) {
      this.setProvider(activeConfig.provider, walletId as ProviderIdType)
      this.setupProviderListeners(activeConfig.provider, walletId as ProviderIdType)
    }
  }

  private async setProvider(provider: Provider, providerId: ProviderIdType, name?: string) {
    if (providerId === 'w3mAuth') {
      this.setAuthProvider()
    } else {
      const walletId = providerId
      SafeLocalStorage.setItem(SafeLocalStorageKeys.WALLET_ID, walletId)

      if (name) {
        SafeLocalStorage.setItem(SafeLocalStorageKeys.WALLET_NAME, name)
      }

      if (provider) {
        const { addresses, chainId } = await EthersHelpersUtil.getUserInfo(provider)
        const firstAddress = addresses?.[0]
        const caipAddress = `${this.chainNamespace}:${chainId}:${firstAddress}` as CaipAddress

        if (firstAddress && chainId) {
          this.appKit?.setCaipAddress(caipAddress, this.chainNamespace)
          ProviderUtil.setProviderId('eip155', providerId)
          ProviderUtil.setProvider<Provider>('eip155', provider)
          this.appKit?.setStatus('connected', this.chainNamespace)
          this.appKit?.setAllAccounts(
            addresses.map(address => ({ address, type: 'eoa' })),
            this.chainNamespace
          )
        }
      }
    }
  }

  private async setAuthProvider() {
    SafeLocalStorage.setItem(SafeLocalStorageKeys.WALLET_ID, ConstantsUtil.AUTH_CONNECTOR_ID)

    if (this.authProvider) {
      this.appKit?.setLoading(true)
      const {
        address,
        chainId,
        smartAccountDeployed,
        preferredAccountType,
        accounts = []
      } = await this.authProvider.connect({
        chainId: Number(this.appKit?.getCaipNetwork()?.id || this.caipNetworks[0]?.id)
      })

      const { smartAccountEnabledNetworks } =
        await this.authProvider.getSmartAccountEnabledNetworks()

      this.appKit?.setSmartAccountEnabledNetworks(smartAccountEnabledNetworks, this.chainNamespace)
      if (address && chainId) {
        this.appKit?.setAllAccounts(
          accounts.length > 0
            ? accounts
            : [{ address, type: preferredAccountType as 'eoa' | 'smartAccount' }],
          this.chainNamespace
        )
        this.appKit?.setStatus('connected', this.chainNamespace)
        this.appKit?.setCaipAddress(
          `${this.chainNamespace}:${chainId}:${address}`,
          this.chainNamespace
        )
        this.appKit?.setPreferredAccountType(
          preferredAccountType as W3mFrameTypes.AccountType,
          this.chainNamespace
        )
        this.appKit?.setSmartAccountDeployed(Boolean(smartAccountDeployed), this.chainNamespace)
        ProviderUtil.setProvider<Provider>('eip155', this.authProvider as unknown as Provider)
        ProviderUtil.setProviderId('eip155', ConstantsUtil.AUTH_CONNECTOR_ID as ProviderIdType)
        this.setupProviderListeners(this.authProvider as unknown as Provider, 'w3mAuth')
        this.watchModal()
      }
      this.appKit?.setLoading(false)
    }
  }

  private watchModal() {
    if (this.authProvider) {
      this.subscribeState(val => {
        if (!val.open) {
          this.authProvider?.rejectRpcRequests()
        }
      })
    }
  }

  private setupProviderListeners(provider: Provider, providerId: ProviderIdType) {
    const disconnectHandler = () => {
      SafeLocalStorage.removeItem(SafeLocalStorageKeys.WALLET_ID)
      this.removeListeners(provider)
    }

    const accountsChangedHandler = (accounts: string[]) => {
      const currentAccount = accounts?.[0] as CaipAddress | undefined
      if (currentAccount) {
        this.appKit?.setCaipAddress(currentAccount, this.chainNamespace)

        if (providerId === ConstantsUtil.EIP6963_CONNECTOR_ID) {
          this.appKit?.setAllAccounts(
            accounts.map(address => ({ address, type: 'eoa' })),
            this.chainNamespace
          )
        }
      } else {
        if (providerId === ConstantsUtil.EIP6963_CONNECTOR_ID) {
          this.appKit?.setAllAccounts([], this.chainNamespace)
        }
        SafeLocalStorage.removeItem(SafeLocalStorageKeys.WALLET_ID)
        this.appKit?.resetAccount(this.chainNamespace)
      }
    }

    const chainChangedHandler = (chainId: string) => {
      const chainIdNumber =
        typeof chainId === 'string' ? EthersHelpersUtil.hexStringToNumber(chainId) : Number(chainId)
      const caipNetwork = this.caipNetworks.find(c => c.id === chainIdNumber)
      const currentCaipNetwork = this.appKit?.getCaipNetwork()

      if (!currentCaipNetwork || currentCaipNetwork?.id !== caipNetwork?.id) {
        this.appKit?.setCaipNetwork(caipNetwork)
      }
    }

    if (providerId === ConstantsUtil.AUTH_CONNECTOR_ID) {
      this.setupAuthListeners(provider as unknown as W3mFrameProvider)
    } else {
      provider.on('disconnect', disconnectHandler)
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('chainChanged', chainChangedHandler)
    }

    this.providerHandlers = {
      disconnect: disconnectHandler,
      accountsChanged: accountsChangedHandler,
      chainChanged: chainChangedHandler
    }
  }

  private providerHandlers: {
    disconnect: () => void
    accountsChanged: (accounts: string[]) => void
    chainChanged: (networkId: string) => void
  } | null = null

  private removeListeners(provider: Provider) {
    if (this.providerHandlers) {
      provider.removeListener('disconnect', this.providerHandlers.disconnect)
      provider.removeListener('accountsChanged', this.providerHandlers.accountsChanged)
      provider.removeListener('chainChanged', this.providerHandlers.chainChanged)
      this.providerHandlers = null
    }
  }

  private setupAuthListeners(authProvider: W3mFrameProvider) {
    authProvider.onRpcRequest(request => {
      if (W3mFrameHelpers.checkIfRequestExists(request)) {
        if (!W3mFrameHelpers.checkIfRequestIsSafe(request)) {
          this.appKit?.handleUnsafeRPCRequest()
        }
      } else {
        this.handleInvalidAuthRequest()
      }
    })

    authProvider.onRpcError(() => this.handleAuthRpcError())
    authProvider.onRpcSuccess((_, request) => this.handleAuthRpcSuccess(_, request))
    authProvider.onNotConnected(() => this.handleAuthNotConnected())
    authProvider.onConnect(({ preferredAccountType }) =>
      this.handleAuthIsConnected(preferredAccountType)
    )
    authProvider.onSetPreferredAccount(({ address, type }) => {
      if (address) {
        this.handleAuthSetPreferredAccount(address, type)
      }
    })
  }

  private handleInvalidAuthRequest() {
    this.appKit?.open()
    setTimeout(() => {
      this.appKit?.showErrorMessage(W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_UI_MESSAGE)
    }, 300)
  }

  private handleAuthRpcError() {
    if (this.appKit?.isOpen()) {
      if (this.appKit?.isTransactionStackEmpty()) {
        this.appKit?.close()
      } else {
        this.appKit?.popTransactionStack(true)
      }
    }
  }

  private handleAuthRpcSuccess(_: W3mFrameTypes.FrameEvent, request: W3mFrameTypes.RPCRequest) {
    const isSafeRequest = W3mFrameHelpers.checkIfRequestIsSafe(request)
    if (isSafeRequest) {
      return
    }

    if (this.appKit?.isTransactionStackEmpty()) {
      this.appKit?.close()
    } else {
      this.appKit?.popTransactionStack()
    }
  }

  private handleAuthNotConnected() {
    this.appKit?.setCaipAddress(undefined, this.chainNamespace)
  }

  private handleAuthIsConnected(preferredAccountType: string | undefined) {
    const activeNamespace = this.appKit?.getActiveChainNamespace()

    if (activeNamespace !== this.chainNamespace) {
      return
    }

    this.appKit?.setPreferredAccountType(
      preferredAccountType as W3mFrameTypes.AccountType,
      this.chainNamespace
    )
  }

  private handleAuthSetPreferredAccount(address: string, type: string) {
    if (!address) {
      return
    }

    this.appKit?.setLoading(true)
    const chainId = this.appKit?.getCaipNetwork()?.id
    this.appKit?.setCaipAddress(`${this.chainNamespace}:${chainId}:${address}`, this.chainNamespace)
    this.appKit?.setStatus('connected', this.chainNamespace)
    this.appKit?.setPreferredAccountType(type as W3mFrameTypes.AccountType, this.chainNamespace)

    this.syncAccount({
      address: address as Address
    }).then(() => this.appKit?.setLoading(false))
    this.appKit?.setLoading(false)
  }

  private async syncReownName(address: Address) {
    try {
      const registeredWcNames = await this.appKit?.getReownName(address)
      if (registeredWcNames?.[0]) {
        const wcName = registeredWcNames[0]
        this.appKit?.setProfileName(wcName.name, this.chainNamespace)
      } else {
        this.appKit?.setProfileName(null, this.chainNamespace)
      }
    } catch {
      this.appKit?.setProfileName(null, this.chainNamespace)
    }
  }

  private async syncAccount({
    address,
    caipNetwork
  }: {
    address?: Address
    caipNetwork?: CaipNetwork
  }) {
    const currentCaipNetwork = caipNetwork || this.appKit?.getCaipNetwork()
    const preferredAccountType = this.appKit?.getPreferredAccountType()
    const isEipNetwork = currentCaipNetwork?.chainNamespace === CommonConstantsUtil.CHAIN.EVM
    const caipNetworkId = currentCaipNetwork?.id as CaipNetworkId

    if (address) {
      if (isEipNetwork) {
        this.appKit?.setPreferredAccountType(preferredAccountType, this.chainNamespace)
        this.appKit?.setCaipAddress(
          `${this.chainNamespace}:${caipNetworkId}:${address}`,
          this.chainNamespace
        )

        this.syncConnectedWalletInfo()
        if (this.ethersConfig) {
          this.checkActiveProviders(this.ethersConfig)
        }

        if (currentCaipNetwork?.blockExplorers?.default.url) {
          this.appKit?.setAddressExplorerUrl(
            `${currentCaipNetwork.blockExplorers.default.url}/address/${address}`,
            this.chainNamespace
          )
        }

        await Promise.all([
          this.syncProfile(address),
          this.appKit?.setApprovedCaipNetworksData(this.chainNamespace)
        ])
      }
    } else {
      this.appKit?.resetWcConnection()
      this.appKit?.resetNetwork(this.chainNamespace)
      this.appKit?.setAllAccounts([], this.chainNamespace)
    }
  }

  private async syncProfile(address: Address) {
    const caipNetwork = this.appKit?.getCaipNetwork()

    try {
      const identity = await this.appKit?.fetchIdentity({
        address
      })
      const name = identity?.name
      const avatar = identity?.avatar

      this.appKit?.setProfileName(name, this.chainNamespace)
      this.appKit?.setProfileImage(avatar, this.chainNamespace)

      if (!name) {
        await this.syncReownName(address)
      }
    } catch {
      if (caipNetwork?.id === 1) {
        const ensProvider = new InfuraProvider('mainnet')
        const name = await ensProvider.lookupAddress(address)
        const avatar = await ensProvider.getAvatar(address)

        if (name) {
          this.appKit?.setProfileName(name, this.chainNamespace)
        } else {
          await this.syncReownName(address)
        }
        if (avatar) {
          this.appKit?.setProfileImage(avatar, this.chainNamespace)
        }
      } else {
        await this.syncReownName(address)
        this.appKit?.setProfileImage(null, this.chainNamespace)
      }
    }
  }

  private async syncBalance(address: Address, caipNetwork: CaipNetwork) {
    const isExistingNetwork = this.appKit
      ?.getCaipNetworks(caipNetwork.chainNamespace)
      .find(network => network.id === caipNetwork.id)
    const isEVMNetwork = caipNetwork.chainNamespace === CommonConstantsUtil.CHAIN.EVM

    if (caipNetwork && isExistingNetwork && isEVMNetwork) {
      const jsonRpcProvider = new JsonRpcProvider(caipNetwork.rpcUrls.default.http[0], {
        chainId: caipNetwork.id as number,
        name: caipNetwork.name
      })

      if (jsonRpcProvider) {
        const balance = await jsonRpcProvider.getBalance(address)
        const formattedBalance = formatEther(balance)

        this.appKit?.setBalance(
          formattedBalance,
          caipNetwork.nativeCurrency.symbol,
          this.chainNamespace
        )
      }
    }
  }

  private syncConnectedWalletInfo() {
    const currentActiveWallet = SafeLocalStorage.getItem(SafeLocalStorageKeys.WALLET_ID)
    const providerType = ProviderUtil.state.providerIds['eip155']

    if (providerType === ConstantsUtil.EIP6963_CONNECTOR_ID) {
      if (currentActiveWallet) {
        const currentProvider = this.EIP6963Providers.find(
          provider => provider.info.name === currentActiveWallet
        )

        if (currentProvider) {
          this.appKit?.setConnectedWalletInfo({ ...currentProvider.info }, this.chainNamespace)
        }
      }
    } else if (providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
      const provider = ProviderUtil.getProvider('eip155')

      if (provider?.session) {
        this.appKit?.setConnectedWalletInfo(
          {
            ...provider.session.peer.metadata,
            name: provider.session.peer.metadata.name,
            icon: provider.session.peer.metadata.icons?.[0]
          },
          this.chainNamespace
        )
      }
    } else if (providerType === ConstantsUtil.COINBASE_SDK_CONNECTOR_ID) {
      const connector = this.appKit
        ?.getConnectors()
        .find(c => c.id === ConstantsUtil.COINBASE_SDK_CONNECTOR_ID)

      this.appKit?.setConnectedWalletInfo(
        { name: 'Coinbase Wallet', icon: this.appKit?.getConnectorImage(connector) },
        this.chainNamespace
      )
    } else if (currentActiveWallet) {
      this.appKit?.setConnectedWalletInfo({ name: currentActiveWallet }, this.chainNamespace)
    }
  }

  private syncRequestedNetworks(caipNetworks: CaipNetwork[]) {
    const uniqueChainNamespaces = [
      ...new Set(caipNetworks.map(caipNetwork => caipNetwork.chainNamespace))
    ]
    uniqueChainNamespaces.forEach(chainNamespace => {
      this.appKit?.setRequestedCaipNetworks(
        caipNetworks.filter(caipNetwork => caipNetwork.chainNamespace === chainNamespace),
        chainNamespace
      )
    })
  }

  public async switchNetwork(caipNetwork: CaipNetwork) {
    async function requestSwitchNetwork(provider: Provider) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: EthersHelpersUtil.numberToHexString(caipNetwork.id) }]
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (switchError: any) {
        if (
          switchError.code === WcConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID ||
          switchError.code === WcConstantsUtil.ERROR_CODE_DEFAULT ||
          switchError?.data?.originalError?.code ===
            WcConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID
        ) {
          await EthersHelpersUtil.addEthereumChain(provider, caipNetwork)
        } else {
          throw new Error('Chain is not supported')
        }
      }
    }

    const provider = ProviderUtil.getProvider<Provider | UniversalProvider>('eip155')
    const providerType = ProviderUtil.state.providerIds['eip155']

    if (provider) {
      switch (providerType) {
        case ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID:
          this.appKit?.universalAdapter?.networkControllerClient.switchCaipNetwork(caipNetwork)
          break
        case ConstantsUtil.INJECTED_CONNECTOR_ID:
        case ConstantsUtil.EIP6963_CONNECTOR_ID:
        case ConstantsUtil.COINBASE_SDK_CONNECTOR_ID:
          if (provider) {
            await requestSwitchNetwork(provider as Provider)
          }
          break
        case ConstantsUtil.AUTH_CONNECTOR_ID:
          if (this.authProvider) {
            try {
              this.appKit?.setLoading(true)
              const { chainId } = await this.authProvider.switchNetwork(caipNetwork.id as number)
              const { address, preferredAccountType } = await this.authProvider.connect({
                chainId: caipNetwork.id as number | undefined
              })
              const caipAddress = `${this.chainNamespace}:${chainId}:${address}`

              this.appKit?.setCaipNetwork(caipNetwork)
              this.appKit?.setCaipAddress(caipAddress as CaipAddress, this.chainNamespace)
              this.appKit?.setPreferredAccountType(
                preferredAccountType as W3mFrameTypes.AccountType,
                this.chainNamespace
              )
              await this.syncAccount({ address: address as Address })
              this.appKit?.setLoading(false)
            } catch {
              throw new Error('Switching chain failed')
            } finally {
              this.appKit?.setLoading(false)
            }
          }
          break
        default:
          throw new Error('Unsupported provider type')
      }
    }
  }

  private syncConnectors(config: ProviderType) {
    const w3mConnectors: Connector[] = []

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
          chain: this.chainNamespace
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
        chain: this.chainNamespace
      })
    }

    this.appKit?.setConnectors(w3mConnectors)
  }

  private async syncAuthConnector(projectId: string, bypassWindowCheck = false) {
    if (bypassWindowCheck || typeof window !== 'undefined') {
      this.authProvider = W3mFrameProviderSingleton.getInstance({
        projectId,
        onTimeout: () => {
          AlertController.open(ErrorUtil.ALERT_ERRORS.INVALID_APP_CONFIGURATION_SOCIALS, 'error')
        }
      })

      this.appKit?.addConnector({
        id: ConstantsUtil.AUTH_CONNECTOR_ID,
        type: 'AUTH',
        name: 'Auth',
        provider: this.authProvider,
        chain: this.chainNamespace
      })

      const isLoginEmailUsed = this.authProvider.getLoginEmailUsed()

      if (isLoginEmailUsed) {
        this.appKit?.setLoading(isLoginEmailUsed)
      }

      const { isConnected } = await this.authProvider.isConnected()
      if (isConnected) {
        await this.setAuthProvider()
      } else if (isLoginEmailUsed) {
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
            chain: this.chainNamespace
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
