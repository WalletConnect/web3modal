import { Connection } from '@solana/web3.js'
import {
  ApiController,
  AssetController,
  ChainController,
  CoreHelperUtil,
  EventsController,
  NetworkController,
  OptionsController
} from '@web3modal/core'
import type { OptionsControllerState } from '@web3modal/core'
import { ConstantsUtil, PresetsUtil } from '@web3modal/scaffold-utils'

import { createWalletAdapters, syncInjectedWallets } from './connectors/walletAdapters.js'
import { SolConstantsUtil, SolHelpersUtil, SolStoreUtil } from './utils/scaffold/index.js'
import { WalletConnectConnector } from './connectors/walletConnectConnector.js'

import type { BaseWalletAdapter } from '@solana/wallet-adapter-base'
import type { PublicKey, Commitment, ConnectionConfig } from '@solana/web3.js'
import type UniversalProvider from '@walletconnect/universal-provider'
import type {
  ConnectionControllerClient,
  NetworkControllerClient,
  Token,
  Connector,
  CaipAddress,
  CaipNetwork
} from '@web3modal/scaffold'

import type { AdapterKey } from './connectors/walletAdapters.js'
import type { ProviderType, Chain, Provider, SolStoreUtilState } from './utils/scaffold/index.js'

// import type { AppKit } from '@web3modal/appkit'

export interface Web3ModalClientOptions {
  solanaConfig: ProviderType
  chains: Chain[]
  connectionSettings?: Commitment | ConnectionConfig
  defaultChain?: Chain
  chainImages?: Record<number | string, string>
  connectorImages?: Record<string, string>
  tokens?: Record<number, Token>
}

export type Web3ModalOptions = Omit<Web3ModalClientOptions, '_sdkVersion'>

// -- Client --------------------------------------------------------------------
export class SolanaWeb3JsClient {
  private hasSyncedConnectedAccount = false

  private WalletConnectConnector: WalletConnectConnector

  private walletAdapters: Record<AdapterKey, BaseWalletAdapter>

  public networkControllerClient: NetworkControllerClient

  public connectionControllerClient: ConnectionControllerClient

  private scaffold: any | undefined = undefined

  // TODO(enes): Get the types from common or appkit
  public chain: 'evm' | 'solana'

  public options: OptionsControllerState | undefined = undefined

  private chains: Chain[]

  public connectionSettings: Commitment | ConnectionConfig

  public constructor(options: Web3ModalClientOptions) {
    const { solanaConfig, chains, connectionSettings = 'confirmed' } = options
    const { metadata } = solanaConfig
    if (!solanaConfig) {
      throw new Error('web3modal:constructor - solanaConfig is undefined')
    }

    this.chain = 'solana'
    this.networkControllerClient = {
      switchCaipNetwork: async caipNetwork => {
        if (caipNetwork) {
          try {
            await this.switchNetwork(caipNetwork)
          } catch (error) {
            SolStoreUtil.setError(error)
          }
        }
      },

      getApprovedCaipNetworksData: async () =>
        new Promise(resolve => {
          const result = {
            approvedCaipNetworkIds: undefined,
            supportsAllNetworks: true
          }

          resolve(result)
        })
    }

    this.connectionControllerClient = {
      connectWalletConnect: async onUri => {
        const WalletConnectProvider = await this.WalletConnectConnector.getProvider()
        if (!WalletConnectProvider) {
          throw new Error('connectionControllerClient:getWalletConnectUri - provider is undefined')
        }

        WalletConnectProvider.on('display_uri', (uri: string) => {
          onUri(uri)
        })
        const address = await this.WalletConnectConnector.connect()
        this.setWalletConnectProvider(address)
      },

      connectExternal: async ({ id }) => {
        const adapterId = this.transformWalletId(id)
        await this.walletAdapters[adapterId].connect()
        const address = this.walletAdapters[adapterId].publicKey?.toString()
        this.setInjectedProvider(
          this.walletAdapters[adapterId] as unknown as Provider,
          adapterId,
          address
        )
      },

      disconnect: async () => {
        const provider = SolStoreUtil.state.provider as Provider
        const providerType = SolStoreUtil.state.providerType
        localStorage.removeItem(SolConstantsUtil.WALLET_ID)
        if (providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
          const WalletConnectProvider = provider
          await (WalletConnectProvider as unknown as UniversalProvider).disconnect()
        } else if (provider) {
          provider.emit('disconnect')
        }
        SolStoreUtil.reset()
      },

      signMessage: async (message: string) => {
        const provider = SolStoreUtil.state.provider
        if (!provider) {
          throw new Error('connectionControllerClient:signMessage - provider is undefined')
        }

        const signature = await provider.request({
          method: 'personal_sign',
          params: [message, this.getAddress()]
        })

        return signature as string
      },

      estimateGas: async () => await Promise.resolve(BigInt(0)),

      // -- Transaction methods ---------------------------------------------------
      /**
       *
       * These methods are supported only on `wagmi` and `ethers` since the Solana SDK does not support them in the same way.
       * These function definition is to have a type parity between the clients. Currently not in use.
       */
      getEnsAvatar: async (value: string) => await Promise.resolve(value),

      getEnsAddress: async (value: string) => await Promise.resolve(value),

      writeContract: async () => await Promise.resolve('0x'),

      sendTransaction: async () => await Promise.resolve('0x'),

      parseUnits: () => BigInt(0),

      formatUnits: () => ''
    }

    this.chains = chains
    this.connectionSettings = connectionSettings

    const chain = SolHelpersUtil.getChainFromCaip(
      chains,
      typeof window === 'object' ? localStorage.getItem(SolConstantsUtil.CAIP_CHAIN_ID) : ''
    )
    if (chain) {
      SolStoreUtil.setCurrentChain(chain)
      SolStoreUtil.setCaipChainId(`solana:${chain.chainId}`)
    }

    this.walletAdapters = createWalletAdapters()
    this.WalletConnectConnector = new WalletConnectConnector({
      relayerRegion: 'wss://relay.walletconnect.com',
      metadata,
      chains,
      qrcode: true
    })
    SolStoreUtil.setConnection(
      new Connection(
        SolHelpersUtil.detectRpcUrl(chain, OptionsController.state.projectId),
        this.connectionSettings
      )
    )

    SolStoreUtil.subscribeKey('address', () => {
      this.syncAccount()
    })

    SolStoreUtil.subscribeKey('caipChainId', () => {
      this.syncNetwork()
    })

    AssetController.subscribeNetworkImages(() => {
      this.syncNetwork()
    })

    // INFO(enes): This is a workaround to sync the network when the chain is changed.
    ChainController.subscribe(() => {
      const caipNetwork = NetworkController.activeNetwork()
      if (
        caipNetwork &&
        !SolStoreUtil.state.isConnected &&
        ChainController.state.activeChain === 'solana'
      ) {
        SolStoreUtil.setCaipChainId(`solana:${chain.chainId}`)
        SolStoreUtil.setCurrentChain(chain)
        localStorage.setItem(SolConstantsUtil.CAIP_CHAIN_ID, `solana:${chain.chainId}`)
        ApiController.reFetchWallets()
      }
    })

    EventsController.subscribe(state => {
      if (state.data.event === 'SELECT_WALLET' && state.data.properties?.name === 'Phantom') {
        const isMobile = CoreHelperUtil.isMobile()
        const isClient = CoreHelperUtil.isClient()
        if (isMobile && isClient && !window.phantom) {
          const href = window.location.href
          const protocol = href.startsWith('https') ? 'https' : 'http'
          const host = href.split('/')[2]
          const ref = `${protocol}://${host}`
          window.location.href = `https://phantom.app/ul/browse/${href}?ref=${ref}`
        }
      }
    })
  }

  public construct(scaffold: any, options: OptionsControllerState) {
    if (!options.projectId) {
      throw new Error('Solana:construct - projectId is undefined')
    }
    this.scaffold = scaffold
    this.options = options

    this.syncRequestedNetworks(this.chains, this.options?.chainImages)
    this.syncNetwork()

    if (typeof window === 'object') {
      this.checkActiveProviders()
      this.syncConnectors()
    }
  }

  public setAddress(address?: string) {
    SolStoreUtil.setAddress(address ?? '')
  }

  public disconnect() {
    const provider = SolStoreUtil.state.provider as Provider

    if (provider) {
      provider.emit('disconnect')
    }
  }

  public getAddress() {
    const { address } = SolStoreUtil.state

    return address ? SolStoreUtil.state.address : address
  }

  public getWalletProvider() {
    return SolStoreUtil.state.provider
  }

  public getWalletProviderType() {
    return SolStoreUtil.state.providerType
  }

  public getWalletConnection() {
    return SolStoreUtil.state.connection
  }

  public async checkActiveProviders() {
    const walletId = localStorage.getItem(SolConstantsUtil.WALLET_ID)

    try {
      if (walletId === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
        await this.WalletConnectConnector.connect(true)
        const provider = await this.WalletConnectConnector.getProvider()
        const accounts = await provider.enable()
        this.setWalletConnectProvider(accounts[0])
      } else {
        const wallet = walletId?.split('_')[1] as AdapterKey
        const adapter = this.walletAdapters[wallet]
        if (window[wallet as keyof Window]) {
          await adapter.connect()
          const address = adapter.publicKey?.toString()
          this.setInjectedProvider(adapter as unknown as Provider, wallet, address)
        }
      }
    } catch (error) {
      SolStoreUtil.setError(error)
    }
  }

  // -- Private -----------------------------------------------------------------
  private transformWalletId(walletId: string) {
    return walletId.toLocaleLowerCase() === 'Trust'
      ? 'trustWallet'
      : (walletId.toLocaleLowerCase() as AdapterKey)
  }

  private syncConnectors() {
    const w3mConnectors: Connector[] = []

    const connectorType = PresetsUtil.ConnectorTypesMap[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID]
    if (connectorType) {
      w3mConnectors.push({
        id: ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID,
        explorerId: PresetsUtil.ConnectorExplorerIds[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
        type: connectorType,
        imageUrl: 'https://avatars.githubusercontent.com/u/37784886',
        name: this.WalletConnectConnector.name,
        provider: this.WalletConnectConnector.getProvider(),
        chain: this.chain
      })
    }

    syncInjectedWallets(w3mConnectors, this.walletAdapters)

    this.scaffold?.setConnectors(w3mConnectors)
  }

  private async syncAccount() {
    const address = SolStoreUtil.state.address
    const chainId = SolStoreUtil.state.currentChain?.chainId
    const isConnected = SolStoreUtil.state.isConnected

    this.scaffold?.resetAccount('solana')

    if (isConnected && address && chainId) {
      const caipAddress: CaipAddress = `${ConstantsUtil.INJECTED_CONNECTOR_ID}:${chainId}:${address}`
      this.scaffold?.setIsConnected(isConnected, 'solana')
      this.scaffold?.setCaipAddress(caipAddress, 'solana')
      await Promise.all([this.syncBalance(address)])

      this.hasSyncedConnectedAccount = true
    } else if (!isConnected && this.hasSyncedConnectedAccount) {
      this.scaffold?.resetWcConnection()
      this.scaffold?.resetNetwork(this.chain)
    }
  }

  private async syncBalance(address: string) {
    const caipChainId = SolStoreUtil.state.caipChainId
    if (caipChainId && this.chains) {
      const chain = SolHelpersUtil.getChainFromCaip(this.chains, caipChainId)
      if (chain) {
        const balance = await this.WalletConnectConnector.getBalance(address)
        this.scaffold?.setBalance(balance.decimals.toString(), chain.currency, 'solana')
      }
    }
  }

  private syncRequestedNetworks(
    chains: Web3ModalClientOptions['chains'],
    chainImages?: Web3ModalClientOptions['chainImages']
  ) {
    const requestedCaipNetworks = chains?.map(
      chain =>
        ({
          id: `solana:${chain.chainId}`,
          name: chain.name,
          imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId],
          imageUrl: chainImages?.[chain.chainId],
          chain: this.chain
        }) as CaipNetwork
    )
    this.scaffold?.setRequestedCaipNetworks(requestedCaipNetworks ?? [], this.chain)
  }

  public async switchNetwork(caipNetwork: CaipNetwork) {
    const caipChainId = caipNetwork.id
    const providerType = SolStoreUtil.state.providerType
    const chain = SolHelpersUtil.getChainFromCaip(this.chains, caipChainId)

    if (this.chains) {
      if (chain) {
        SolStoreUtil.setCaipChainId(`solana:${chain.chainId}`)
        SolStoreUtil.setCurrentChain(chain)
        localStorage.setItem(SolConstantsUtil.CAIP_CHAIN_ID, `solana:${chain.chainId}`)
        if (providerType?.includes(ConstantsUtil.INJECTED_CONNECTOR_ID)) {
          const wallet = this.transformWalletId(providerType)
          SolStoreUtil.setConnection(
            new Connection(
              SolHelpersUtil.detectRpcUrl(chain, OptionsController.state.projectId),
              this.connectionSettings
            )
          )
          this.setAddress(this.walletAdapters[wallet].publicKey?.toString())
          await this.syncAccount()

          return
        }
        if (providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
          const universalProvider = await this.WalletConnectConnector.getProvider()

          const namespaces = this.WalletConnectConnector.generateNamespaces(chain.chainId)
          SolStoreUtil.setConnection(
            new Connection(
              SolHelpersUtil.detectRpcUrl(chain, OptionsController.state.projectId),
              this.connectionSettings
            )
          )
          universalProvider.connect({ namespaces, pairingTopic: undefined })
          await this.syncAccount()
        }
      }
    }
  }

  private async syncNetwork() {
    const address = SolStoreUtil.state.address
    const storeChainId = SolStoreUtil.state.caipChainId
    const isConnected = SolStoreUtil.state.isConnected

    if (this.chains) {
      const chain = SolHelpersUtil.getChainFromCaip(this.chains, storeChainId)
      if (chain) {
        // const caipChainId: CaipNetworkId = `solana:${chain.chainId}`

        // TODO(enes): refactor this. Instead of setting the network here, we are now setting them in the appkit initializer
        // this.scaffold?.setCaipNetwork(
        //   {
        //     id: caipChainId,
        //     name: chain.name,
        //     imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId],
        //     imageUrl: chainImages?.[chain.chainId]
        //   },
        //   this.chain
        // )
        if (isConnected && address) {
          if (chain.explorerUrl) {
            const url = `${chain.explorerUrl}/account/${address}`
            this.scaffold?.setAddressExplorerUrl(url)
          } else {
            this.scaffold?.setAddressExplorerUrl(undefined)
          }
          if (this.hasSyncedConnectedAccount) {
            await this.syncBalance(address)
          }
        }
      }
    }
  }

  public subscribeProvider(callback: (newState: SolStoreUtilState) => void) {
    return SolStoreUtil.subscribe(callback)
  }

  private async setWalletConnectProvider(address = '') {
    const caipChainId = `${SolStoreUtil.state.currentChain?.name}: ${SolStoreUtil.state.currentChain?.chainId}`
    const chain = SolHelpersUtil.getChainFromCaip(
      this.chains,
      typeof window === 'object' ? localStorage.getItem(SolConstantsUtil.CAIP_CHAIN_ID) : ''
    )
    if (chain) {
      SolStoreUtil.setCurrentChain(chain)
    }
    SolStoreUtil.setIsConnected(true)
    SolStoreUtil.setCaipChainId(caipChainId)

    SolStoreUtil.setProviderType('walletConnect')
    SolStoreUtil.setProvider(this.WalletConnectConnector as unknown as Provider)
    this.setAddress(address)

    window?.localStorage.setItem(
      SolConstantsUtil.WALLET_ID,
      ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID
    )
    await Promise.all([
      this.syncBalance(address),
      this.scaffold?.setApprovedCaipNetworksData(this.chain)
    ])
  }

  private setInjectedProvider(provider: Provider, adapter: AdapterKey, address = '') {
    window?.localStorage.setItem(
      SolConstantsUtil.WALLET_ID,
      `${ConstantsUtil.INJECTED_CONNECTOR_ID}_${adapter}`
    )

    const chainId = SolStoreUtil.state.currentChain?.chainId
    const caipChainId = `solana:${chainId}`

    if (address && chainId) {
      SolStoreUtil.setIsConnected(true)
      SolStoreUtil.setCaipChainId(caipChainId)
      SolStoreUtil.setProviderType(`injected_${adapter}`)
      SolStoreUtil.setProvider(provider)
      this.setAddress(address)
      this.watchInjected(provider)
      this.hasSyncedConnectedAccount = true
    }
  }

  private watchInjected(provider: Provider) {
    function disconnectHandler() {
      localStorage.removeItem(SolConstantsUtil.WALLET_ID)
      SolStoreUtil.reset()

      provider?.removeListener('disconnect', disconnectHandler)
      provider?.removeListener('accountsChanged', accountsChangedHandler)
      provider?.removeListener('connect', accountsChangedHandler)
    }

    function accountsChangedHandler(publicKey: PublicKey) {
      const currentAccount: string = publicKey.toBase58()
      if (currentAccount) {
        SolStoreUtil.setAddress(currentAccount)
      } else {
        localStorage.removeItem(SolConstantsUtil.WALLET_ID)
        SolStoreUtil.reset()
      }
    }

    if (provider) {
      provider.on('disconnect', disconnectHandler)
      provider.on('accountsChanged', accountsChangedHandler)
      provider.on('connect', accountsChangedHandler)
    }
  }
}