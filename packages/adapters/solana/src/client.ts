import type { BaseWalletAdapter } from '@solana/wallet-adapter-base'
import type { Commitment, ConnectionConfig } from '@solana/web3.js'
import {
  PublicKey,
  SendTransactionError,
  Connection as SolanaConnection,
  Transaction,
  TransactionInstruction
} from '@solana/web3.js'
import UniversalProvider from '@walletconnect/universal-provider'
import bs58 from 'bs58'

import { SendTransactionError as CommonSendTransactionError } from '@reown/appkit-common'
import { type ChainNamespace, ConstantsUtil as CommonConstantsUtil } from '@reown/appkit-common'
import {
  AdapterBlueprint,
  AlertController,
  ChainController,
  CoreHelperUtil,
  type Provider as CoreProvider,
  OptionsController,
  StorageUtil,
  WcHelpersUtil
} from '@reown/appkit-controllers'
import { ErrorUtil } from '@reown/appkit-utils'
import { HelpersUtil } from '@reown/appkit-utils'
import type { Provider as SolanaProvider } from '@reown/appkit-utils/solana'
import { SolConstantsUtil } from '@reown/appkit-utils/solana'
import { W3mFrameProvider } from '@reown/appkit-wallet'

import { AuthProvider } from './providers/AuthProvider.js'
import {
  CoinbaseWalletProvider,
  type SolanaCoinbaseWallet
} from './providers/CoinbaseWalletProvider.js'
import { SolanaWalletConnectProvider } from './providers/SolanaWalletConnectProvider.js'
import { SolStoreUtil } from './utils/SolanaStoreUtil.js'
import { createSPLTokenTransaction } from './utils/createSPLTokenTransaction.js'
import { createSendTransaction } from './utils/createSendTransaction.js'
import { waitForSignatureConfirmation } from './utils/waitForSignatureConfirmation.js'
import { watchStandard } from './utils/watchStandard.js'

export interface AdapterOptions {
  connectionSettings?: Commitment | ConnectionConfig
  /**
   * @deprecated Wallets are automatically recognized from the browser.
   */
  wallets?: BaseWalletAdapter[]
  /**
   * Enable or disable registering WalletConnect as a Wallet Standard wallet.
   * @default false
   */
  registerWalletStandard?: boolean
}

const IGNORED_CONNECTIONS_IDS: string[] = [
  CommonConstantsUtil.CONNECTOR_ID.AUTH,
  CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT
]

const TRANSACTION_ERROR_MAP = [
  {
    pattern: /Attempt to debit an account but found no record of a prior credit/iu,
    message: 'Not enough SOL to cover fees or rent'
  },
  {
    pattern: /Insufficient funds for fee/iu,
    message: 'Not enough SOL to cover fees or rent'
  },
  {
    pattern: /Transfer: insufficient lamports/iu,
    message: 'Not enough SOL to cover this transfer'
  }
]

export class SolanaAdapter extends AdapterBlueprint<SolanaProvider> {
  private connectionSettings: Commitment | ConnectionConfig
  public wallets?: BaseWalletAdapter[]
  private registerWalletStandard?: boolean
  private balancePromises: Record<string, Promise<AdapterBlueprint.GetBalanceResult>> = {}
  private universalProvider: UniversalProvider | undefined

  constructor(options: AdapterOptions = {}) {
    super({
      adapterType: CommonConstantsUtil.ADAPTER_TYPES.SOLANA,
      namespace: CommonConstantsUtil.CHAIN.SOLANA
    })
    this.connectionSettings = options.connectionSettings || 'confirmed'
    this.wallets = options.wallets
    this.registerWalletStandard = options.registerWalletStandard
  }

  public override construct(params: AdapterBlueprint.Params): void {
    super.construct(params)
    const connectedCaipNetwork = StorageUtil.getActiveCaipNetworkId()
    const caipNetwork =
      params.networks?.find(n => n.caipNetworkId === connectedCaipNetwork) || params.networks?.[0]
    const rpcUrl = caipNetwork?.rpcUrls.default.http[0] as string
    if (rpcUrl) {
      SolStoreUtil.setConnection(new SolanaConnection(rpcUrl, this.connectionSettings))
    }
  }

  public override setAuthProvider(w3mFrameProvider: W3mFrameProvider) {
    this.addConnector(
      new AuthProvider({
        w3mFrameProvider,
        getActiveChain: () => ChainController.getCaipNetworkByNamespace(this.namespace),
        chains: this.getCaipNetworks()
      })
    )
  }

  override syncConnectors() {
    if (!OptionsController.state.projectId) {
      AlertController.open(ErrorUtil.ALERT_ERRORS.PROJECT_ID_NOT_CONFIGURED, 'error')
    }

    const getActiveChain = () => ChainController.getActiveCaipNetwork(this.namespace)

    // Add Coinbase Wallet if available
    if (CoreHelperUtil.isClient() && 'coinbaseSolana' in window) {
      this.addConnector(
        new CoinbaseWalletProvider({
          provider: window.coinbaseSolana as SolanaCoinbaseWallet,
          chains: this.getCaipNetworks(),
          getActiveChain
        })
      )
    }

    // Watch for standard wallet adapters
    watchStandard(this.getCaipNetworks(), getActiveChain, this.addConnector.bind(this))
  }

  // -- Transaction methods ---------------------------------------------------
  /**
   *
   * These methods are supported only on `wagmi` and `ethers` since the Solana SDK does not support them in the same way.
   * These function definition is to have a type parity between the clients. Currently not in use.
   */
  // eslint-disable-next-line @typescript-eslint/require-await

  public async writeContract(): Promise<AdapterBlueprint.WriteContractResult> {
    return Promise.resolve({
      hash: ''
    })
  }

  public async writeSolanaTransaction(
    params: AdapterBlueprint.WriteSolanaTransactionParams
  ): Promise<AdapterBlueprint.WriteSolanaTransactionResult> {
    const provider = params.provider as SolanaProvider

    const connection = SolStoreUtil.state.connection

    if (!connection || !params.provider) {
      throw new Error('Connection is not set')
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()

    const transaction = new Transaction({
      feePayer: provider.publicKey,
      blockhash,
      lastValidBlockHeight
    })

    for (const instruction of params.instructions) {
      transaction.add(
        new TransactionInstruction({
          keys: instruction.keys.map(key => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable
          })),
          programId: new PublicKey(instruction.programId),
          data: Buffer.from(instruction.data, 'hex')
        })
      )
    }

    const result = await provider.sendTransaction(transaction, connection).catch(error => {
      if (error instanceof SendTransactionError) {
        // Check both message and logs
        const errMessage = error?.transactionError?.message ?? error?.message ?? ''
        const logs = error?.logs?.join(' ') ?? ''
        const fullErrorText = `${errMessage} ${logs}`

        for (const { pattern, message } of TRANSACTION_ERROR_MAP) {
          if (pattern.test(fullErrorText)) {
            throw new Error(message)
          }
        }
      }

      throw error
    })

    await waitForSignatureConfirmation(connection, result)

    return {
      hash: result
    }
  }

  public async getCapabilities(): Promise<unknown> {
    return Promise.resolve({})
  }

  public async grantPermissions(): Promise<unknown> {
    return Promise.resolve({})
  }

  public async revokePermissions(): Promise<`0x${string}`> {
    return Promise.resolve('0x')
  }

  public override async walletGetAssets(
    _params: AdapterBlueprint.WalletGetAssetsParams
  ): Promise<AdapterBlueprint.WalletGetAssetsResponse> {
    return Promise.resolve({})
  }

  public async getAccounts(
    params: AdapterBlueprint.GetAccountsParams
  ): Promise<AdapterBlueprint.GetAccountsResult> {
    const connector = this.connectors.find(c => c.id === params.id)
    if (!connector) {
      return { accounts: [] }
    }

    return { accounts: await connector.getAccounts() }
  }

  public async signMessage(
    params: AdapterBlueprint.SignMessageParams
  ): Promise<AdapterBlueprint.SignMessageResult> {
    const provider = params.provider as SolanaProvider
    if (!provider) {
      throw new Error('connectionControllerClient:signMessage - provider is undefined')
    }

    const signature = await provider.signMessage(new TextEncoder().encode(params.message))

    return {
      signature: bs58.encode(signature)
    }
  }

  public async estimateGas(
    params: AdapterBlueprint.EstimateGasTransactionArgs
  ): Promise<AdapterBlueprint.EstimateGasTransactionResult> {
    const connection = SolStoreUtil.state.connection

    if (!connection || !params.provider) {
      throw new Error('Connection is not set')
    }

    const transaction = await createSendTransaction({
      provider: params.provider as SolanaProvider,
      connection,
      to: '11111111111111111111111111111111',
      value: 1
    })

    const fee = await transaction.getEstimatedFee(connection)

    return {
      gas: BigInt(fee || 0)
    }
  }

  public async sendTransaction(
    params: AdapterBlueprint.SendTransactionParams
  ): Promise<AdapterBlueprint.SendTransactionResult> {
    const connection = SolStoreUtil.state.connection

    if (!connection || !params.provider) {
      throw new Error('Connection is not set')
    }

    const provider = params.provider as SolanaProvider

    const transaction = params.tokenMint
      ? await createSPLTokenTransaction({
          provider,
          connection,
          to: params.to,
          amount: Number(params.value),
          tokenMint: params.tokenMint
        })
      : await createSendTransaction({
          provider,
          connection,
          to: params.to,
          value: Number.isNaN(Number(params.value)) ? 0 : Number(params.value)
        })

    const result = await provider.sendTransaction(transaction, connection).catch(error => {
      if (error instanceof SendTransactionError) {
        // Check both message and logs
        const errMessage = error?.transactionError?.message ?? error?.message ?? ''
        const logs = error?.logs?.join(' ') ?? ''
        const fullErrorText = `${errMessage} ${logs}`

        for (const { pattern, message } of TRANSACTION_ERROR_MAP) {
          if (pattern.test(fullErrorText)) {
            throw new CommonSendTransactionError(message)
          }
        }
      }

      throw error
    })

    await waitForSignatureConfirmation(connection, result)

    return {
      hash: result
    }
  }

  public parseUnits(): bigint {
    return 0n
  }

  public formatUnits(): string {
    return ''
  }

  public async connect(
    params: AdapterBlueprint.ConnectParams
  ): Promise<AdapterBlueprint.ConnectResult> {
    const connector = this.connectors.find(c => c.id === params.id)

    if (!connector) {
      throw new Error('Provider not found')
    }

    const connectorWithProvider = {
      ...connector,
      ...(params.id === CommonConstantsUtil.CONNECTOR_ID.AUTH
        ? {
            /*
             * For AuthProvider, we need to pass connector as the provider
             * so the useAppKitProvider hook works properly when signing
             * messages and transactions
             */
            provider: connector as CoreProvider
          }
        : {})
    }

    const rpcUrl =
      params.rpcUrl ||
      this.getCaipNetworks()?.find(n => n.id === params.chainId)?.rpcUrls.default.http[0]

    if (!rpcUrl) {
      throw new Error(`RPC URL not found for chainId: ${params.chainId}`)
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
        connector: connectorWithProvider
      })

      return {
        id: connector.id,
        address: connection.account.address,
        chainId: params.chainId as string,
        provider: connector as CoreProvider,
        type: connector.type
      }
    }

    const address = await connector.connect({
      chainId: params.chainId as string,
      socialUri: params.socialUri
    })

    SolStoreUtil.setConnection(new SolanaConnection(rpcUrl, this.connectionSettings))

    this.emit('accountChanged', {
      address,
      chainId: params.chainId as string,
      connector: connectorWithProvider
    })

    const isAuth = connector.id === CommonConstantsUtil.CONNECTOR_ID.AUTH
    const caipNetwork = this.getCaipNetworks()?.find(network => network.id === params.chainId)

    this.addConnection({
      connectorId: connector.id,
      accounts: [{ address }],
      caipNetwork,
      auth: isAuth
        ? {
            name: StorageUtil.getConnectedSocialProvider(),
            username: StorageUtil.getConnectedSocialUsername()
          }
        : undefined
    })

    if (connector.id !== CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT) {
      this.listenSolanaProviderEvents(connector.id, connector.provider as SolanaProvider)
    }

    return {
      id: connector.id,
      address,
      chainId: params.chainId as string,
      provider: connector as CoreProvider,
      type: connector.type
    }
  }

  public async getBalance(
    params: AdapterBlueprint.GetBalanceParams
  ): Promise<AdapterBlueprint.GetBalanceResult> {
    const address = params.address
    const caipNetwork = this.getCaipNetworks()?.find(network => network.id === params.chainId)

    if (!address) {
      return Promise.resolve({ balance: '0.00', symbol: 'SOL' })
    }

    const connection = new SolanaConnection(
      caipNetwork?.rpcUrls?.default?.http?.[0] as string,
      this.connectionSettings
    )

    const caipAddress = `${caipNetwork?.caipNetworkId}:${params.address}`
    const cachedPromise = this.balancePromises[caipAddress]
    if (cachedPromise) {
      return cachedPromise
    }
    const cachedBalance = StorageUtil.getNativeBalanceCacheForCaipAddress(caipAddress)
    if (cachedBalance) {
      return { balance: cachedBalance.balance, symbol: cachedBalance.symbol }
    }
    this.balancePromises[caipAddress] = new Promise<AdapterBlueprint.GetBalanceResult>(
      async resolve => {
        try {
          const balance = await connection.getBalance(new PublicKey(address))
          const formattedBalance = (balance / SolConstantsUtil.LAMPORTS_PER_SOL).toString()

          StorageUtil.updateNativeBalanceCache({
            caipAddress,
            balance: formattedBalance,
            symbol: params.caipNetwork?.nativeCurrency.symbol || 'SOL',
            timestamp: Date.now()
          })

          if (!params.caipNetwork) {
            throw new Error('caipNetwork is required')
          }

          resolve({
            balance: formattedBalance,
            symbol: params.caipNetwork?.nativeCurrency.symbol
          })
        } catch (error) {
          resolve({ balance: '0.00', symbol: 'SOL' })
        }
      }
    ).finally(() => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.balancePromises[caipAddress]
    })

    return this.balancePromises[caipAddress] || { balance: '0.00', symbol: 'SOL' }
  }

  public override async switchNetwork(params: AdapterBlueprint.SwitchNetworkParams): Promise<void> {
    await super.switchNetwork(params)

    const { caipNetwork } = params

    if (caipNetwork?.rpcUrls?.default?.http?.[0]) {
      SolStoreUtil.setConnection(
        new SolanaConnection(caipNetwork.rpcUrls.default.http[0], this.connectionSettings)
      )
    }
  }

  // We use listenSolanaProviderEvents instead of listenProviderEvents
  protected override listenProviderEvents() {
    return undefined
  }

  public listenSolanaProviderEvents(connectorId: string, provider: SolanaProvider) {
    if (IGNORED_CONNECTIONS_IDS.includes(connectorId)) {
      return
    }

    const accountsChangedHandler = (publicKey: PublicKey) => {
      this.onAccountsChanged([publicKey.toBase58()], connectorId, false)
    }
    const disconnectHandler = () => this.onDisconnect(connectorId)

    if (!this.providerHandlers[connectorId]) {
      provider.on('disconnect', disconnectHandler)
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('connect', accountsChangedHandler)

      this.providerHandlers[connectorId] = {
        provider: provider as CoreProvider,
        disconnect: disconnectHandler,
        accountsChanged: accountsChangedHandler as unknown as (accounts: string[]) => void,
        chainChanged: () => undefined
      }
    }
  }

  public override async setUniversalProvider(universalProvider: UniversalProvider): Promise<void> {
    this.universalProvider = universalProvider

    const wcConnectorId = CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT

    WcHelpersUtil.listenWcProvider({
      universalProvider,
      namespace: CommonConstantsUtil.CHAIN.SOLANA,
      onConnect: accounts => this.onConnect(accounts, wcConnectorId),
      onDisconnect: () => this.onDisconnect(wcConnectorId),
      onAccountsChanged: accounts => this.onAccountsChanged(accounts, wcConnectorId, false)
    })

    const solanaProvider = new SolanaWalletConnectProvider({
      provider: universalProvider,
      chains: this.getCaipNetworks(),
      getActiveChain: () => ChainController.getCaipNetworkByNamespace(this.namespace)
    })

    if (this.registerWalletStandard) {
      const { SolanaWalletConnectStandardWallet } = await import(
        '@reown/appkit-utils/wallet-standard'
      )
      SolanaWalletConnectStandardWallet.register(universalProvider)
    }

    this.addConnector(solanaProvider)

    return Promise.resolve()
  }

  public override async connectWalletConnect(chainId?: string | number) {
    const result = await super.connectWalletConnect(chainId)

    const rpcUrl = this.getCaipNetworks()?.find(n => n.id === chainId)?.rpcUrls.default
      .http[0] as string
    const connection = new SolanaConnection(rpcUrl, this.connectionSettings)

    SolStoreUtil.setConnection(connection)

    return result
  }

  public async disconnect(params: AdapterBlueprint.DisconnectParams) {
    if (params.id) {
      const connector = this.connectors.find(c => c.id === params.id)

      if (!connector) {
        throw new Error('Provider not found')
      }

      const connection = this.connections.find(c =>
        HelpersUtil.isLowerCaseMatch(c.connectorId, params.id)
      )

      await connector.provider.disconnect()

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

  public async syncConnection(
    params: AdapterBlueprint.SyncConnectionParams
  ): Promise<AdapterBlueprint.ConnectResult> {
    return this.connect({
      ...params,
      type: ''
    })
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
          if (connector.id === CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT) {
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
            const address = await connector.connect({
              chainId: caipNetwork?.id as string
            })

            if (address) {
              this.addConnection({
                connectorId: connector.id,
                accounts: [{ address }],
                caipNetwork
              })

              this.listenSolanaProviderEvents(connector.id, connector.provider as SolanaProvider)
            }
          }
        })
    )

    if (connectToFirstConnector) {
      this.emitFirstAvailableConnection()
    }
  }

  public getWalletConnectProvider(
    params: AdapterBlueprint.GetWalletConnectProviderParams
  ): AdapterBlueprint.GetWalletConnectProviderResult {
    const walletConnectProvider = new SolanaWalletConnectProvider({
      provider: params.provider as UniversalProvider,
      chains: params.caipNetworks,
      getActiveChain: () => ChainController.getCaipNetworkByNamespace(this.namespace)
    })

    return walletConnectProvider as unknown as UniversalProvider
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
}
