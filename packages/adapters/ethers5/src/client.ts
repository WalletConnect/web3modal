import UniversalProvider from '@walletconnect/universal-provider'
import * as ethers from 'ethers'
import { formatEther } from 'ethers/lib/utils.js'

import { WcConstantsUtil } from '@reown/appkit'
import {
  type CaipAddress,
  type ChainNamespace,
  ConstantsUtil as CommonConstantsUtil,
  ErrorUtil,
  ParseUtil,
  UserRejectedRequestError
} from '@reown/appkit-common'
import { ConstantsUtil, PresetsUtil } from '@reown/appkit-common'
import {
  AdapterBlueprint,
  AssetController,
  ChainController,
  type CombinedProvider,
  type Connector,
  type ConnectorType,
  ConnectorUtil,
  CoreHelperUtil,
  OptionsController,
  type Provider,
  SIWXUtil,
  StorageUtil,
  WalletConnectConnector,
  WcHelpersUtil,
  getPreferredAccountType
} from '@reown/appkit-controllers'
import { ProviderController } from '@reown/appkit-controllers'
import { HelpersUtil } from '@reown/appkit-utils'
import {
  type Address,
  BaseProvider,
  CoinbaseWalletProvider,
  EthersHelpersUtil,
  InjectedProvider,
  type ProviderType,
  SafeProvider
} from '@reown/appkit-utils/ethers'
import type { W3mFrameProvider } from '@reown/appkit-wallet'

import { Ethers5Methods } from './utils/Ethers5Methods.js'

export interface EIP6963ProviderDetail {
  info: Connector['info']
  provider: Provider
}

export class Ethers5Adapter extends AdapterBlueprint {
  private ethersConfig?: ProviderType
  private balancePromises: Record<string, Promise<AdapterBlueprint.GetBalanceResult>> = {}
  private universalProvider?: UniversalProvider
  private ethersProviders: Omit<ProviderType, 'metadata' | 'EIP6963'> = {}

  constructor() {
    super({
      adapterType: CommonConstantsUtil.ADAPTER_TYPES.ETHERS5,
      namespace: CommonConstantsUtil.CHAIN.EVM
    })
  }

  private async createEthersConfig() {
    const { metadata, enableCoinbase, enableBaseAccount, enableInjected, enableEIP6963 } =
      OptionsController.state
    if (!metadata) {
      return undefined
    }

    if (enableInjected !== false) {
      const injectedProvider = new InjectedProvider()
      await injectedProvider.initialize()
      this.ethersProviders.injected = injectedProvider
    }

    if (enableBaseAccount !== false) {
      // Do not initialize provider to prevent unnecessary api calls - lazy load
      this.ethersProviders.baseAccount = new BaseProvider()
      if (this.hasStoredConnection(CommonConstantsUtil.CONNECTOR_ID.BASE_ACCOUNT)) {
        await this.ethersProviders.baseAccount.initialize()
      }
    }

    if (enableCoinbase !== false) {
      // Do not initialize provider to prevent unnecessary api calls - lazy load
      this.ethersProviders.coinbaseWallet = new CoinbaseWalletProvider()
      if (this.hasStoredConnection(CommonConstantsUtil.CONNECTOR_ID.COINBASE)) {
        await this.ethersProviders.coinbaseWallet.initialize()
      }
    }

    if (CoreHelperUtil.isSafeApp()) {
      const safeProvider = new SafeProvider()
      await safeProvider.initialize()
      this.ethersProviders.safe = safeProvider
    }

    return {
      ...this.ethersProviders,
      EIP6963: enableEIP6963 !== false,
      metadata
    }
  }

  private hasStoredConnection(connectorId: string) {
    const { hasConnected, hasDisconnected } = HelpersUtil.getConnectorStorageInfo(
      connectorId,
      this.namespace as ChainNamespace
    )

    return hasConnected && !hasDisconnected
  }

  public async signMessage(
    params: AdapterBlueprint.SignMessageParams
  ): Promise<AdapterBlueprint.SignMessageResult> {
    const { message, address, provider } = params

    if (!provider) {
      throw new Error('Provider is undefined')
    }
    try {
      const signature = await Ethers5Methods.signMessage(message, provider as Provider, address)

      return { signature }
    } catch (error) {
      throw new Error('EthersAdapter:signMessage - Sign message failed')
    }
  }

  public async sendTransaction(
    params: AdapterBlueprint.SendTransactionParams
  ): Promise<AdapterBlueprint.SendTransactionResult> {
    if (!params.provider) {
      throw new Error('Provider is undefined')
    }

    const address = ChainController.getAccountData(CommonConstantsUtil.CHAIN.EVM)?.address

    if (!address) {
      throw new Error('Address is undefined')
    }

    const tx = await Ethers5Methods.sendTransaction(
      {
        value: Number.isNaN(Number(params.value)) ? BigInt(0) : BigInt(params.value),
        to: params.to as Address,
        data: params.data ? (params.data as Address) : '0x',
        gas: params.gas ? BigInt(params.gas) : undefined,
        gasPrice: params.gasPrice ? BigInt(params.gasPrice) : undefined,
        address: address as Address
      },
      params.provider as Provider,
      address as Address,
      Number(params.caipNetwork?.id)
    )

    return { hash: tx }
  }

  public async writeContract(
    params: AdapterBlueprint.WriteContractParams
  ): Promise<AdapterBlueprint.WriteContractResult> {
    if (!params.provider) {
      throw new Error('Provider is undefined')
    }

    const { address } = ParseUtil.parseCaipAddress(params.caipAddress)
    const result = await Ethers5Methods.writeContract(
      params,
      params.provider as Provider,
      address,
      Number(params.caipNetwork?.id)
    )

    return { hash: result }
  }

  public async estimateGas(
    params: AdapterBlueprint.EstimateGasTransactionArgs
  ): Promise<AdapterBlueprint.EstimateGasTransactionResult> {
    const { provider, caipNetwork, address } = params
    if (!provider) {
      throw new Error('Provider is undefined')
    }

    try {
      const result = await Ethers5Methods.estimateGas(
        {
          data: params.data as Address,
          to: params.to as Address,
          address: address as Address
        },
        provider as Provider,
        address as Address,
        Number(caipNetwork?.id)
      )

      return { gas: result }
    } catch (error) {
      throw new Error('EthersAdapter:estimateGas - Estimate gas failed')
    }
  }

  public parseUnits(params: AdapterBlueprint.ParseUnitsParams): AdapterBlueprint.ParseUnitsResult {
    return Ethers5Methods.parseUnits(params.value, params.decimals)
  }

  public formatUnits(
    params: AdapterBlueprint.FormatUnitsParams
  ): AdapterBlueprint.FormatUnitsResult {
    return Ethers5Methods.formatUnits(params.value, params.decimals)
  }

  public async syncConnection(
    params: Pick<AdapterBlueprint.SyncConnectionParams, 'id' | 'chainId'>
  ): Promise<AdapterBlueprint.ConnectResult> {
    const { id, chainId } = params

    const connector = this.connectors.find(c => c.id === id)
    const selectedProvider = connector?.provider as Provider

    if (!selectedProvider) {
      throw new Error('Provider not found')
    }

    const accounts: string[] = await selectedProvider.request({
      method: 'eth_requestAccounts'
    })

    const requestChainId = await selectedProvider.request({
      method: 'eth_chainId'
    })

    this.listenProviderEvents(id, selectedProvider)

    if (!accounts[0]) {
      throw new Error('No accounts found')
    }

    if (!connector?.type) {
      throw new Error('Connector type not found')
    }

    return {
      address: this.toChecksummedAddress(accounts[0]),
      chainId: Number(requestChainId) || Number(chainId),
      provider: selectedProvider,
      type: connector.type,
      id
    }
  }

  public async writeSolanaTransaction() {
    return Promise.resolve({ hash: '' })
  }

  override async syncConnectors(): Promise<void> {
    this.ethersConfig = await this.createEthersConfig()

    if (this.ethersConfig?.EIP6963) {
      this.listenInjectedConnector(true)
    }

    const connectors = Object.keys(this.ethersConfig || {}).filter(
      key => key !== 'metadata' && key !== 'EIP6963'
    )

    connectors.forEach(async connector => {
      const isInjectedConnector = connector === CommonConstantsUtil.CONNECTOR_ID.INJECTED

      if (this.namespace) {
        const provider =
          this.ethersProviders[connector as keyof Omit<ProviderType, 'metadata' | 'EIP6963'>]
        this.addConnector({
          id: connector,
          explorerId: PresetsUtil.ConnectorExplorerIds[connector],
          imageUrl: AssetController.state.connectorImages?.[connector],
          name: PresetsUtil.ConnectorNamesMap[connector] || 'Unknown',
          imageId: PresetsUtil.ConnectorImageIds[connector],
          type: PresetsUtil.ConnectorTypesMap[connector] ?? 'EXTERNAL',
          info: isInjectedConnector ? undefined : { rdns: connector },
          chain: this.namespace,
          chains: [],
          provider: (await provider?.getProvider()) as Provider
        })
      }
    })
  }

  private async disconnectAll() {
    const connections = await Promise.all(
      this.connections.map(async connection => {
        const connector = this.connectors.find(c =>
          HelpersUtil.isLowerCaseMatch(c.id, connection.connectorId)
        )

        if (!connector) {
          throw new Error('Connector not found')
        }

        await this.disconnect({
          id: connector.id
        })

        return connection
      })
    )

    return { connections }
  }

  public async syncConnections({
    connectToFirstConnector
  }: AdapterBlueprint.SyncConnectionsParams) {
    const caipNetworks = this.getCaipNetworks()
    await Promise.all(
      this.connectors
        .filter(c => {
          const { hasDisconnected, hasConnected } = HelpersUtil.getConnectorStorageInfo(
            c.id,
            this.namespace as ChainNamespace
          )

          return !hasDisconnected && hasConnected
        })
        .map(async connector => {
          if (connector.id === CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT) {
            const accounts = WcHelpersUtil.getWalletConnectAccounts(
              this.universalProvider as UniversalProvider,
              this.namespace as ChainNamespace
            )
            const caipNetwork = caipNetworks.find(
              n =>
                n.chainNamespace === this.namespace &&
                n.id.toString() === accounts[0]?.chainId?.toString()
            )

            if (accounts.length > 0) {
              this.addConnection({
                connectorId: connector.id,
                accounts: accounts.map(account => ({ address: account.address })),
                caipNetwork
              })
            }
          } else {
            const { accounts, chainId } = await ConnectorUtil.fetchProviderData(connector)

            if (accounts.length > 0 && chainId) {
              const caipNetwork = caipNetworks.find(
                n => n.chainNamespace === this.namespace && n.id.toString() === chainId.toString()
              )

              this.addConnection({
                connectorId: connector.id,
                accounts: accounts.map(address => ({ address })),
                caipNetwork
              })

              if (
                connector.provider &&
                connector.id !== CommonConstantsUtil.CONNECTOR_ID.AUTH &&
                connector.id !== CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT
              ) {
                this.listenProviderEvents(
                  connector.id,
                  connector.provider as Provider | CombinedProvider
                )
              }
            }
          }
        })
    )

    if (connectToFirstConnector) {
      this.emitFirstAvailableConnection()
    }
  }

  public override async setUniversalProvider(universalProvider: UniversalProvider) {
    this.universalProvider = universalProvider

    const wcConnectorId = CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT

    WcHelpersUtil.listenWcProvider({
      universalProvider,
      namespace: CommonConstantsUtil.CHAIN.EVM,
      onConnect: accounts => this.onConnect(accounts, wcConnectorId),
      onDisconnect: () => this.onDisconnect(wcConnectorId),
      onAccountsChanged: accounts => this.onAccountsChanged(accounts, wcConnectorId, false),
      onChainChanged: chainId => this.onChainChanged(chainId, wcConnectorId)
    })

    this.addConnector(
      new WalletConnectConnector({
        provider: universalProvider,
        caipNetworks: this.getCaipNetworks(),
        namespace: CommonConstantsUtil.CHAIN.EVM
      })
    )

    return Promise.resolve()
  }

  private eip6963EventHandler(event: CustomEventInit<EIP6963ProviderDetail>) {
    if (event.detail) {
      const { info, provider } = event.detail
      const existingConnector = this.connectors?.find(c => c.name === info?.name)

      if (!existingConnector) {
        const type = PresetsUtil.ConnectorTypesMap[CommonConstantsUtil.CONNECTOR_ID.EIP6963]

        const id = info?.rdns || info?.name || info?.uuid
        if (type && this.namespace && id) {
          this.addConnector({
            id,
            type,
            explorerId:
              PresetsUtil.ConnectorExplorerIds[info.rdns || ''] ??
              PresetsUtil.ConnectorExplorerIds[info.name || ''],
            imageUrl: info?.icon,
            name: info?.name || 'Unknown',
            provider,
            info,
            chain: this.namespace,
            chains: []
          })
        }
      }
    }
  }

  private listenInjectedConnector(enableEIP6963: boolean) {
    if (typeof window !== 'undefined' && enableEIP6963) {
      const handler = this.eip6963EventHandler.bind(this)
      window.addEventListener(ConstantsUtil.EIP6963_ANNOUNCE_EVENT, handler)
      window.dispatchEvent(new Event(ConstantsUtil.EIP6963_REQUEST_EVENT))
    }
  }

  public async connect({
    id,
    address,
    type,
    chainId,
    socialUri
  }: AdapterBlueprint.ConnectParams): Promise<AdapterBlueprint.ConnectResult> {
    try {
      const connector = this.connectors.find(c => HelpersUtil.isLowerCaseMatch(c.id, id))

      if (!connector) {
        throw new Error('Connector not found')
      }

      const connection = this.getConnection({
        address,
        connectorId: id,
        connections: this.connections,
        connectors: this.connectors
      })

      if (connection) {
        const caipNetwork = connection.caipNetwork

        if (!caipNetwork) {
          throw new Error('Ethers5Adapter:connect - could not find the caipNetwork to connect')
        }

        if (connection.account) {
          /*
           * Resolve the provider before emitting so the base-client's accountChanged
           * handler can call syncProvider() — keeping useAppKitProvider reactive
           * when the user switches accounts inside the modal.
           */
          const ethersProvider =
            this.ethersProviders[connector.id as keyof Omit<ProviderType, 'metadata' | 'EIP6963'>]
          if (!connector.provider && ethersProvider) {
            await ethersProvider.initialize()
            connector.provider = (await ethersProvider.getProvider()) as Provider | undefined
          }

          this.emit('accountChanged', {
            address: this.toChecksummedAddress(connection.account.address),
            chainId: caipNetwork.id,
            connector
          })

          return {
            address: this.toChecksummedAddress(connection.account.address),
            chainId: caipNetwork.id,
            provider: connector.provider,
            type: connector.type,
            id
          }
        }
      }

      let selectedProvider = connector?.provider as Provider | undefined
      const ethersProvider =
        this.ethersProviders[connector.id as keyof Omit<ProviderType, 'metadata' | 'EIP6963'>]
      if (ethersProvider) {
        await ethersProvider.initialize()
        selectedProvider = (await ethersProvider.getProvider()) as Provider | undefined
      }

      if (!selectedProvider) {
        throw new Error('Provider not found')
      }

      connector.provider = selectedProvider

      let accounts: string[] = []

      let requestChainId: string | undefined = undefined

      if (type === 'AUTH') {
        const { address: _address, accounts: authAccounts } =
          await SIWXUtil.authConnectorAuthenticate({
            authConnector: selectedProvider as unknown as W3mFrameProvider,
            chainNamespace: CommonConstantsUtil.CHAIN.EVM,
            chainId,
            socialUri,
            preferredAccountType: getPreferredAccountType('eip155')
          })

        const caipNetwork = this.getCaipNetworks().find(
          n => n.id.toString() === chainId?.toString()
        )

        accounts = [_address]

        this.addConnection({
          connectorId: id,
          accounts: authAccounts
            ? authAccounts.map(account => ({ address: account.address }))
            : accounts.map(account => ({ address: account })),
          caipNetwork,
          auth: {
            name: StorageUtil.getConnectedSocialProvider(),
            username: StorageUtil.getConnectedSocialUsername()
          }
        })

        this.emit('accountChanged', {
          address: this.toChecksummedAddress(accounts[0] as Address),
          chainId: Number(chainId),
          connector
        })
      } else {
        accounts = await selectedProvider.request({
          method: 'eth_requestAccounts'
        })

        requestChainId = await selectedProvider.request({
          method: 'eth_chainId'
        })

        const caipNetwork = this.getCaipNetworks().find(
          n => n.id.toString() === chainId?.toString()
        )

        if (requestChainId !== chainId) {
          if (!caipNetwork) {
            throw new Error('Ethers5Adapter:connect - could not find the caipNetwork to switch')
          }

          try {
            await selectedProvider?.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: EthersHelpersUtil.numberToHexString(caipNetwork.id) }]
            })
          } catch (error) {
            throw new Error('Ethers5Adapter:connect - Switch network failed')
          }
        }

        this.emit('accountChanged', {
          address: this.toChecksummedAddress(accounts[0] as Address),
          chainId: Number(chainId),
          connector
        })

        this.addConnection({
          connectorId: id,
          accounts: accounts.map(account => ({ address: account })),
          caipNetwork
        })

        if (connector.id !== CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT) {
          this.listenProviderEvents(id, selectedProvider)
        }
      }

      return {
        address: this.toChecksummedAddress(accounts[0] as Address),
        chainId: Number(chainId),
        provider: selectedProvider,
        type: type as ConnectorType,
        id
      }
    } catch (err) {
      if (ErrorUtil.isUserRejectedRequestError(err)) {
        throw new UserRejectedRequestError(err)
      }

      throw err
    }
  }

  public async getAccounts(
    params: AdapterBlueprint.GetAccountsParams
  ): Promise<AdapterBlueprint.GetAccountsResult> {
    const connector = this.connectors.find(c => c.id === params.id)
    const selectedProvider = connector?.provider as Provider

    if (!selectedProvider || !connector) {
      throw new Error('Provider not found')
    }

    const connection = this.getConnection({
      connectorId: params.id,
      connections: this.connections,
      connectors: this.connectors
    })

    if (connection && connection.caipNetwork) {
      return {
        accounts: connection.accounts.map(({ address }) =>
          CoreHelperUtil.createAccount({
            caipAddress: `${connection?.caipNetwork?.caipNetworkId}:${address}` as CaipAddress,
            type: 'eoa'
          })
        )
      }
    }

    if (params.id === CommonConstantsUtil.CONNECTOR_ID.AUTH) {
      const provider = connector['provider'] as W3mFrameProvider
      if (!provider.user) {
        return { accounts: [] }
      }
      const { accounts, address, chainId } = provider.user

      return Promise.resolve({
        accounts: (accounts || [{ address, type: 'eoa' }]).map(account =>
          CoreHelperUtil.createAccount({
            caipAddress: `eip155:${chainId}:${account.address}` as CaipAddress,
            type: account.type
          })
        )
      })
    }

    const accounts: string[] = await selectedProvider.request({
      method: 'eth_requestAccounts'
    })

    const caipNetwork = ChainController.getActiveCaipNetwork(this.namespace as ChainNamespace)

    return {
      accounts: caipNetwork
        ? accounts.map(account =>
            CoreHelperUtil.createAccount({
              caipAddress: `${caipNetwork?.caipNetworkId}:${account}`,
              type: 'eoa'
            })
          )
        : []
    }
  }

  public override async reconnect(params: AdapterBlueprint.ConnectParams): Promise<void> {
    const { id, chainId } = params

    const connector = this.connectors.find(c => c.id === id)

    if (connector && connector.type === 'AUTH' && chainId) {
      await SIWXUtil.authConnectorAuthenticate({
        authConnector: connector.provider as unknown as W3mFrameProvider,
        chainNamespace: CommonConstantsUtil.CHAIN.EVM,
        chainId,
        preferredAccountType: getPreferredAccountType('eip155')
      })
    }
  }

  public async disconnect(params: AdapterBlueprint.DisconnectParams) {
    if (params.id) {
      const connector = this.connectors.find(c => HelpersUtil.isLowerCaseMatch(c.id, params.id))

      if (!connector) {
        throw new Error('Connector not found')
      }

      const connection = this.getConnection({
        connectorId: params.id,
        connections: this.connections,
        connectors: this.connectors
      })

      switch (connector.type) {
        case ConstantsUtil.CONNECTOR_TYPE_WALLET_CONNECT:
          if ((connector.provider as UniversalProvider).session) {
            ;(connector.provider as UniversalProvider).disconnect()
          }
          break
        case ConstantsUtil.CONNECTOR_TYPE_AUTH:
          await connector.provider?.disconnect()
          break
        case ConstantsUtil.CONNECTOR_TYPE_ANNOUNCED:
        case ConstantsUtil.CONNECTOR_TYPE_EXTERNAL:
          await this.revokeProviderPermissions(connector.provider as Provider)
          break
        default:
          throw new Error('Unsupported provider type')
      }

      if (connector.id) {
        this.removeProviderListeners(connector.id)
        this.deleteConnection(connector.id)
      }

      if (this.connections.length === 0) {
        this.emit('disconnect')
      } else {
        this.emitFirstAvailableConnection()
      }

      return { connections: connection ? [connection] : [] }
    }

    return this.disconnectAll()
  }

  public async getBalance(
    params: AdapterBlueprint.GetBalanceParams
  ): Promise<AdapterBlueprint.GetBalanceResult> {
    const address = params.address
    const caipNetwork = this.getCaipNetworks().find(
      network => network.id.toString() === params.chainId?.toString()
    )

    if (!address) {
      return Promise.resolve({ balance: '0.00', symbol: 'ETH' })
    }

    if (caipNetwork) {
      const caipAddress = `${caipNetwork.caipNetworkId}:${address}`

      const cachedPromise = this.balancePromises[caipAddress]
      if (cachedPromise) {
        return cachedPromise
      }

      const cachedBalance = StorageUtil.getNativeBalanceCacheForCaipAddress(caipAddress)
      if (cachedBalance) {
        return { balance: cachedBalance.balance, symbol: cachedBalance.symbol }
      }

      const jsonRpcProvider = new ethers.providers.JsonRpcProvider(
        caipNetwork.rpcUrls.default.http[0],
        {
          chainId: caipNetwork.id as number,
          name: caipNetwork.name
        }
      )

      if (jsonRpcProvider) {
        try {
          this.balancePromises[caipAddress] = new Promise<AdapterBlueprint.GetBalanceResult>(
            async resolve => {
              try {
                const balance = await jsonRpcProvider.getBalance(address)
                const formattedBalance = formatEther(balance)

                StorageUtil.updateNativeBalanceCache({
                  caipAddress,
                  balance: formattedBalance,
                  symbol: caipNetwork.nativeCurrency.symbol,
                  timestamp: Date.now()
                })

                resolve({ balance: formattedBalance, symbol: caipNetwork.nativeCurrency.symbol })
              } catch (error) {
                resolve({ balance: '0.00', symbol: 'ETH' })
              }
            }
          ).finally(() => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete this.balancePromises[caipAddress]
          })

          return this.balancePromises[caipAddress] || { balance: '0.00', symbol: 'ETH' }
        } catch (error) {
          return { balance: '0.00', symbol: 'ETH' }
        }
      }
    }

    return { balance: '0.00', symbol: 'ETH' }
  }

  public override async switchNetwork(params: AdapterBlueprint.SwitchNetworkParams): Promise<void> {
    const { caipNetwork } = params
    const providerType = ProviderController.getProviderId(caipNetwork.chainNamespace)
    const provider = ProviderController.getProvider<Provider>(caipNetwork.chainNamespace)

    if (providerType === 'AUTH' || providerType === 'WALLET_CONNECT') {
      await super.switchNetwork(params)

      return
    }

    if (!provider) {
      throw new Error('Provider not found')
    }

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: EthersHelpersUtil.numberToHexString(caipNetwork.id) }]
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (switchError: any) {
      if (
        switchError.code === WcConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID ||
        switchError.code === WcConstantsUtil.ERROR_INVALID_CHAIN_ID ||
        switchError.code === WcConstantsUtil.ERROR_CODE_DEFAULT ||
        switchError?.data?.originalError?.code === WcConstantsUtil.ERROR_CODE_UNRECOGNIZED_CHAIN_ID
      ) {
        await EthersHelpersUtil.addEthereumChain(provider, caipNetwork)
      } else if (
        providerType === 'ANNOUNCED' ||
        providerType === 'EXTERNAL' ||
        providerType === 'INJECTED'
      ) {
        throw new Error('Chain is not supported')
      }
    }
  }

  public getWalletConnectProvider(): AdapterBlueprint.GetWalletConnectProviderResult {
    return this.connectors.find(c => c.type === 'WALLET_CONNECT')?.provider as UniversalProvider
  }

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

  public async getCapabilities(params: AdapterBlueprint.GetCapabilitiesParams): Promise<unknown> {
    const provider = ProviderController.getProvider(CommonConstantsUtil.CHAIN.EVM)

    if (!provider) {
      throw new Error('Provider is undefined')
    }

    return await provider.request({ method: 'wallet_getCapabilities', params: [params] })
  }

  public async grantPermissions(params: AdapterBlueprint.GrantPermissionsParams): Promise<unknown> {
    const provider = ProviderController.getProvider(CommonConstantsUtil.CHAIN.EVM)

    if (!provider) {
      throw new Error('Provider is undefined')
    }

    return await provider.request({ method: 'wallet_grantPermissions', params })
  }

  public async revokePermissions(
    params: AdapterBlueprint.RevokePermissionsParams
  ): Promise<Address> {
    const provider = ProviderController.getProvider(CommonConstantsUtil.CHAIN.EVM)

    if (!provider) {
      throw new Error('Provider is undefined')
    }

    return await provider.request({ method: 'wallet_revokePermissions', params: [params] })
  }

  public async walletGetAssets(
    params: AdapterBlueprint.WalletGetAssetsParams
  ): Promise<AdapterBlueprint.WalletGetAssetsResponse> {
    const provider = ProviderController.getProvider(CommonConstantsUtil.CHAIN.EVM)

    if (!provider) {
      throw new Error('Provider is undefined')
    }

    return await provider.request({
      method: 'wallet_getAssets',
      params: [params]
    })
  }

  private toChecksummedAddress(address: string) {
    try {
      return ethers.utils.getAddress(address.toLowerCase() as `0x${string}`)
    } catch {
      return address
    }
  }
}
