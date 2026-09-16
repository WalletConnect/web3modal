import type { Adapter } from '@tronweb3/tronwallet-abstract-adapter'
import UniversalProvider from '@walletconnect/universal-provider'

import {
  type ChainNamespace,
  ConstantsUtil,
  NumberUtil,
  UserRejectedRequestError
} from '@reown/appkit-common'
import {
  AdapterBlueprint,
  BlockchainApiController,
  ChainController,
  ProviderController,
  WcHelpersUtil
} from '@reown/appkit-controllers'
import { HelpersUtil } from '@reown/appkit-utils'
import type { TronConnector } from '@reown/appkit-utils/tron'

import { TronConnectConnector } from './connectors/TronConnectConnector.js'
import { TronWalletConnectConnector } from './connectors/TronWalletConnectConnector.js'
import { TronConnectUtil } from './utils/TronConnectUtil.js'

// -- Types --------------------------------------------------------------------- //
export interface TronAdapterParams extends AdapterBlueprint.Params {
  /**
   * Array of TRON wallet adapters to support.
   * Install desired wallet adapter packages and pass them here.
   *
   * @example
   * ```typescript
   * import { TronLinkAdapter } from '@tronweb3/tronwallet-adapter-tronlink'
   * import { MetaMaskAdapter } from '@tronweb3/tronwallet-adapter-metamask-tron'
   *
   * const tronAdapter = new TronAdapter({
   *   walletAdapters: [
   *     new TronLinkAdapter({ openUrlWhenWalletNotFound: false, checkTimeout: 3000 }),
   *     new MetaMaskAdapter()
   *   ]
   * })
   * ```
   */
  walletAdapters?: Adapter[]
}

export class TronAdapter extends AdapterBlueprint<TronConnector> {
  private universalProvider: UniversalProvider | undefined = undefined
  private cleanupWalletWatch: (() => void) | undefined
  private walletAdapters: Adapter[]

  constructor(params?: TronAdapterParams) {
    super({
      namespace: ConstantsUtil.CHAIN.TRON,
      adapterType: ConstantsUtil.ADAPTER_TYPES.TRON,
      ...params
    })
    this.walletAdapters = params?.walletAdapters || []
  }

  async syncConnectors() {
    const chains = ChainController.getCaipNetworks()

    this.cleanupWalletWatch?.()
    this.cleanupWalletWatch = TronConnectUtil.watchWalletAdapters(this.walletAdapters, adapter => {
      this.addConnector(new TronConnectConnector({ adapter, chains }))
    })

    await TronConnectUtil.waitForLoadingAdapters(this.walletAdapters)
  }

  override async connect(
    params: AdapterBlueprint.ConnectParams
  ): Promise<AdapterBlueprint.ConnectResult> {
    const connector = this.connectors.find(c => c.id === params.id)

    if (!connector) {
      throw new Error('Connector not found')
    }

    const chain = connector.chains.find(c => c.id === params.chainId) || connector.chains[0]

    if (!chain) {
      throw new Error('The connector does not support any of the requested chains')
    }

    const connection = this.getConnection({
      address: params.address,
      connectorId: connector.id,
      connections: this.connections,
      connectors: this.connectors
    })

    if (connection?.account) {
      this.emit('accountChanged', {
        address: connection.account.address,
        chainId: connection.caipNetwork?.id,
        connector
      })

      return {
        id: connector.id,
        type: connector.type,
        address: connection.account.address,
        chainId: chain.id,
        provider: connector
      }
    }

    const address = await connector.connect().catch(err => {
      throw new UserRejectedRequestError(err)
    })

    this.emit('accountChanged', {
      address,
      chainId: chain.id,
      connector
    })

    this.addConnection({
      connectorId: connector.id,
      accounts: [{ address, type: 'eoa' }],
      caipNetwork: chain
    })

    if (connector.id !== ConstantsUtil.CONNECTOR_ID.WALLET_CONNECT) {
      this.listenProviderEvents(connector.id, connector)
    }

    return {
      id: connector.id,
      type: connector.type,
      address,
      chainId: chain.id,
      provider: connector
    }
  }

  protected getActiveConnector(): TronConnector | undefined {
    return this.connector
  }

  override async getAccounts(): Promise<AdapterBlueprint.GetAccountsResult> {
    return Promise.resolve({
      accounts: []
    })
  }

  override async signMessage(
    params: AdapterBlueprint.SignMessageParams
  ): Promise<AdapterBlueprint.SignMessageResult> {
    const connector = params.provider as TronConnector

    if (!connector) {
      throw new Error('TronAdapter:signMessage - connector is undefined')
    }

    const signature = await connector.signMessage({
      message: params.message,
      from: params.address
    })

    return { signature }
  }

  override async sendTransaction(): Promise<AdapterBlueprint.SendTransactionResult> {
    return Promise.resolve({ hash: '' })
  }

  override async writeSolanaTransaction(): Promise<AdapterBlueprint.WriteSolanaTransactionResult> {
    return Promise.resolve({ hash: '' })
  }

  override async disconnect(
    params?: AdapterBlueprint.DisconnectParams
  ): Promise<AdapterBlueprint.DisconnectResult> {
    if (params?.id) {
      const connector = this.connectors.find(c => c.id === params.id)

      if (!connector) {
        throw new Error('TronAdapter:disconnect - connector not found')
      }

      const connection = this.getConnection({
        connectorId: connector.id,
        connections: this.connections,
        connectors: this.connectors
      })

      try {
        await connector.disconnect()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[TronAdapter] disconnect error:', error)
      }

      this.removeProviderListeners(connector.id)
      this.deleteConnection(connector.id)

      if (this.connections.length === 0) {
        this.emit('disconnect')
      } else {
        this.emitFirstAvailableConnection()
      }

      return { connections: connection ? [connection] : [] }
    }

    return this.disconnectAll()
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

  override async switchNetwork(params: AdapterBlueprint.SwitchNetworkParams): Promise<void> {
    const providerType = ProviderController.getProviderId(params.caipNetwork.chainNamespace)
    const provider = ProviderController.getProvider<TronConnector>(
      params.caipNetwork.chainNamespace
    )

    if (providerType === 'WALLET_CONNECT' || providerType === 'AUTH') {
      return await super.switchNetwork(params)
    }

    if (!provider) {
      throw new Error('Provider not found')
    }

    // Switch the network in the provider
    await provider.switchNetwork(params.caipNetwork.caipNetworkId)

    /*
     * Manually update the connection with the new network.
     * This is needed because TRON uses hex chain IDs, but the base adapter's
     * onChainChanged handler converts hex to decimal, causing network lookup to fail.
     */
    const connection = this.getConnection({
      connectorId: provider.id,
      connections: this.connections,
      connectors: this.connectors
    })

    if (!connection?.accounts[0]) {
      return Promise.resolve()
    }

    const address = connection.accounts[0].address

    // Update the connection with the new network
    this.addConnection({
      connectorId: provider.id,
      accounts: connection.accounts,
      caipNetwork: params.caipNetwork
    })

    // Update the chain account data to ensure address is set
    ChainController.setChainAccountData(params.caipNetwork.chainNamespace, {
      address,
      caipAddress: `${params.caipNetwork.caipNetworkId}:${address}`
    })

    // Now update the active network - this will use the account data we just set
    ChainController.setActiveCaipNetwork(params.caipNetwork)

    // Emit switchNetwork event to update the UI
    this.emit('switchNetwork', {
      address,
      chainId: params.caipNetwork.id
    })

    return Promise.resolve()
  }

  public override async setUniversalProvider(universalProvider: UniversalProvider) {
    this.universalProvider = universalProvider

    const wcConnectorId = ConstantsUtil.CONNECTOR_ID.WALLET_CONNECT

    WcHelpersUtil.listenWcProvider({
      universalProvider,
      namespace: ConstantsUtil.CHAIN.TRON,
      onConnect: accounts => this.onConnect(accounts, wcConnectorId),
      onDisconnect: () => this.onDisconnect(wcConnectorId),
      onAccountsChanged: accounts => super.onAccountsChanged(accounts, wcConnectorId, false)
    })

    this.addConnector(
      new TronWalletConnectConnector({
        provider: universalProvider,
        chains: ChainController.getCaipNetworks()
      })
    )

    return Promise.resolve()
  }

  override async getBalance(
    params: AdapterBlueprint.GetBalanceParams
  ): Promise<AdapterBlueprint.GetBalanceResult> {
    const caipNetworkId = params.caipNetwork?.caipNetworkId
    const address = params.address

    if (!address || !caipNetworkId) {
      return { balance: '0', symbol: 'TRX' }
    }

    try {
      if (params.caipNetwork?.testnet) {
        const balanceInSun = await this.getFullNodeBalance({
          address,
          rpcUrl: params.caipNetwork.rpcUrls?.['chainDefault']?.http?.[0]
        })

        return {
          balance: this.formatTrxBalance(balanceInSun),
          symbol: 'TRX'
        }
      }

      const response = await BlockchainApiController.getAddressBalance<{
        data: { balance: number }[]
      }>({
        caipNetworkId,
        address,
        method: 'tron_getAddressBalance',
        params: [{ address }]
      })

      const balanceInSun = response?.data?.[0]?.balance ?? 0

      return { balance: this.formatTrxBalance(balanceInSun), symbol: 'TRX' }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TronAdapter] getBalance error:', error)

      return { balance: '0', symbol: 'TRX' }
    }
  }

  private async getFullNodeBalance({
    address,
    rpcUrl
  }: {
    address: string
    rpcUrl?: string
  }): Promise<number> {
    if (!rpcUrl) {
      throw new Error('TRON fullnode RPC URL is not configured')
    }

    const normalizedRpcUrl = rpcUrl.replace(/\/+$/u, '')

    const response = await fetch(`${normalizedRpcUrl}/wallet/getaccount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, visible: true })
    })

    if (!response.ok) {
      throw new Error(`TRON fullnode balance request failed: ${response.status}`)
    }

    const result = (await response.json()) as { balance?: number }

    return result.balance ?? 0
  }

  private formatTrxBalance(balanceInSun: number): string {
    return NumberUtil.bigNumber(balanceInSun)
      .div(10 ** 6)
      .toString()
  }

  override parseUnits(): bigint {
    return BigInt(0)
  }

  override formatUnits(): string {
    return ''
  }

  public async syncConnections({
    connectToFirstConnector,
    caipNetwork
  }: AdapterBlueprint.SyncConnectionsParams) {
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
          if (connector.id === ConstantsUtil.CONNECTOR_ID.WALLET_CONNECT) {
            const accounts = WcHelpersUtil.getWalletConnectAccounts(
              this.universalProvider as UniversalProvider,
              this.namespace as ChainNamespace
            )

            if (accounts.length > 0) {
              this.addConnection({
                connectorId: connector.id,
                accounts: accounts.map(account => ({ address: account.address })),
                caipNetwork
              })
            }
          } else {
            const address = await connector.connect({})

            if (address) {
              this.addConnection({
                connectorId: connector.id,
                accounts: [{ address }],
                caipNetwork
              })

              this.listenProviderEvents(connector.id, connector)
            }
          }
        })
    )

    if (connectToFirstConnector) {
      this.emitFirstAvailableConnection()
    }
  }

  override async syncConnection(
    params: AdapterBlueprint.SyncConnectionParams
  ): Promise<AdapterBlueprint.ConnectResult> {
    const connector = this.connectors.find(c => c.id === params.id)

    if (!connector) {
      return { id: '', address: '', chainId: '', provider: undefined, type: 'EXTERNAL' }
    }

    return this.connect({
      id: connector.id,
      chainId: params.chainId,
      type: connector.type
    })
  }

  override async estimateGas(
    _params: AdapterBlueprint.EstimateGasTransactionArgs
  ): Promise<AdapterBlueprint.EstimateGasTransactionResult> {
    return Promise.resolve({ gas: BigInt(0) })
  }

  override async writeContract(
    _params: AdapterBlueprint.WriteContractParams
  ): Promise<AdapterBlueprint.WriteContractResult> {
    return Promise.resolve({ hash: '' })
  }

  override async grantPermissions(
    _params: AdapterBlueprint.GrantPermissionsParams
  ): Promise<unknown> {
    return Promise.resolve({})
  }

  override async getCapabilities(
    _params: AdapterBlueprint.GetCapabilitiesParams
  ): Promise<unknown> {
    return Promise.resolve({})
  }

  override async revokePermissions(
    _params: AdapterBlueprint.RevokePermissionsParams
  ): Promise<`0x${string}`> {
    return Promise.resolve('0x0000000000000000000000000000000000000000')
  }

  override async walletGetAssets(
    _params: AdapterBlueprint.WalletGetAssetsParams
  ): Promise<AdapterBlueprint.WalletGetAssetsResponse> {
    return Promise.resolve({} as AdapterBlueprint.WalletGetAssetsResponse)
  }

  public getWalletConnectProvider(
    params: AdapterBlueprint.GetWalletConnectProviderParams
  ): AdapterBlueprint.GetWalletConnectProviderResult {
    const walletConnectProvider = new TronWalletConnectConnector({
      provider: params.provider as UniversalProvider,
      chains: params.caipNetworks
    })

    return walletConnectProvider as unknown as UniversalProvider
  }
}
