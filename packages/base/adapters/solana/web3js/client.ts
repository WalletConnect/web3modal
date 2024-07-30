import { Connection } from '@solana/web3.js'
import {
  ApiController,
  AssetController,
  CoreHelperUtil,
  EventsController,
  NetworkController
} from '@web3modal/core'
import { ConstantsUtil, PresetsUtil } from '@web3modal/scaffold-utils'
import { ConstantsUtil as CommonConstantsUtil } from '@web3modal/common'
import type { OptionsControllerState } from '@web3modal/core'

import { SolConstantsUtil, SolHelpersUtil, SolStoreUtil } from './utils/scaffold/index.js'
import { WalletConnectConnector } from './connectors/walletConnectConnector.js'

import type { BaseWalletAdapter, StandardWalletAdapter } from '@solana/wallet-adapter-base'
import type { PublicKey, Commitment, ConnectionConfig } from '@solana/web3.js'
import type UniversalProvider from '@walletconnect/universal-provider'
import type {
  CaipNetworkId,
  ConnectionControllerClient,
  NetworkControllerClient,
  Token,
  Connector,
  CaipAddress,
  CaipNetwork
} from '@web3modal/scaffold'
import type { Chain as AvailableChain } from '@web3modal/common'

import type { ProviderType, Chain, Provider, SolStoreUtilState } from './utils/scaffold/index.js'
import { watchStandard } from './utils/wallet-standard/watchStandard.js'
import type { AppKitOptions } from '../../../utils/TypesUtil.js'
import type { AppKit } from '../../../src/client.js'

export interface Web3ModalClientOptions
  extends Omit<AppKitOptions, 'defaultChain' | 'tokens' | 'sdkType' | 'sdkVersion'> {
  solanaConfig: ProviderType
  chains: Chain[]
  connectionSettings?: Commitment | ConnectionConfig
  defaultChain?: Chain
  chainImages?: Record<number | string, string>
  connectorImages?: Record<string, string>
  tokens?: Record<number, Token>
  wallets?: BaseWalletAdapter[]
}

export type ExtendedBaseWalletAdapter = BaseWalletAdapter & {
  isAnnounced: boolean
}
export type Web3ModalOptions = Omit<Web3ModalClientOptions, '_sdkVersion' | 'isUniversalProvider'>

// -- Client --------------------------------------------------------------------
export class SolanaWeb3JsClient {
  private appKit: AppKit | undefined = undefined

  private instanceOptions: Web3ModalClientOptions | undefined = undefined

  public options: AppKitOptions | undefined = undefined

  private hasSyncedConnectedAccount = false

  private WalletConnectConnector: WalletConnectConnector | undefined = undefined

  private walletAdapters: ExtendedBaseWalletAdapter[] = []

  private filteredWalletAdapters: ExtendedBaseWalletAdapter[] | undefined

  private chains: Chain[]

  public chain: AvailableChain = CommonConstantsUtil.CHAIN.SOLANA

  public networkControllerClient: NetworkControllerClient

  public connectionControllerClient: ConnectionControllerClient

  public connectionSettings: Commitment | ConnectionConfig

  public defaultChain: CaipNetwork | undefined = undefined

  public constructor(options: Web3ModalClientOptions) {
    const { solanaConfig, chains, connectionSettings = 'confirmed' } = options
    const wallets = options.wallets ?? []

    if (!solanaConfig) {
      throw new Error('web3modal:constructor - solanaConfig is undefined')
    }

    this.instanceOptions = options

    this.chains = chains

    this.connectionSettings = connectionSettings

    this.networkControllerClient = {
      switchCaipNetwork: async caipNetwork => {
        if (caipNetwork) {
          try {
            // Update chain for Solflare
            this.walletAdapters = wallets as ExtendedBaseWalletAdapter[]
            const walletId = localStorage.getItem(SolConstantsUtil.WALLET_ID)
            const wallet = walletId?.split('_')[1]
            if (wallet === 'solflare' && window[wallet as keyof Window]) {
              const adapter = this.walletAdapters.find(a => a.name.toLocaleLowerCase() === wallet)
              if (!adapter) {
                return
              }
              await adapter.connect()
              this.setInjectedProvider(adapter as unknown as Provider)
            }

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
        const WalletConnectProvider = await this.WalletConnectConnector?.getProvider()
        if (!WalletConnectProvider) {
          throw new Error('connectionControllerClient:getWalletConnectUri - provider is undefined')
        }

        WalletConnectProvider.on('display_uri', onUri)
        const address = await this.WalletConnectConnector?.connect()
        this.setWalletConnectProvider(address)
        WalletConnectProvider.removeListener('display_uri', onUri)
      },

      connectExternal: async ({ id }) => {
        const adapter = this.filteredWalletAdapters?.find(
          a => a.name.toLocaleLowerCase() === id.toLocaleLowerCase()
        )

        if (!adapter) {
          throw Error('connectionControllerClient:connectExternal - adapter was undefined')
        }
        await adapter.connect()
        this.setInjectedProvider(adapter as unknown as Provider)
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
  }

  public construct(appKit: AppKit, options: OptionsControllerState) {
    const { projectId } = options
    const clientOptions = this.instanceOptions

    if (!projectId) {
      throw new Error('Solana:construct - projectId is undefined')
    }

    if (!clientOptions) {
      throw new Error('Solana:construct - clientOptions is undefined')
    }

    this.appKit = appKit

    this.options = options

    const { chains, wallets } = clientOptions

    const chain = SolHelpersUtil.getChainFromCaip(
      chains,
      typeof window === 'object' ? localStorage.getItem(SolConstantsUtil.CAIP_CHAIN_ID) : ''
    )

    this.defaultChain = SolHelpersUtil.getChainFromCaip(
      chains,
      typeof window === 'object' ? localStorage.getItem(SolConstantsUtil.CAIP_CHAIN_ID) : ''
    ) as CaipNetwork
    this.syncRequestedNetworks(chains, this.options?.chainImages)

    if (chain) {
      SolStoreUtil.setCurrentChain(chain)
      SolStoreUtil.setCaipChainId(`solana:${chain.chainId}`)
    }
    this.syncNetwork(this.options?.chainImages)

    this.walletAdapters = wallets as ExtendedBaseWalletAdapter[]

    SolStoreUtil.setConnection(
      new Connection(
        SolHelpersUtil.detectRpcUrl(chain, this.instanceOptions?.projectId || ''),
        this.connectionSettings
      )
    )

    SolStoreUtil.subscribeKey('address', () => {
      this.syncAccount()
    })

    SolStoreUtil.subscribeKey('caipChainId', () => {
      this.syncNetwork(this.instanceOptions?.chainImages)
    })

    AssetController.subscribeNetworkImages(() => {
      this.syncNetwork(this.instanceOptions?.chainImages)
    })

    NetworkController.subscribeKey('caipNetwork', (newCaipNetwork: CaipNetwork | undefined) => {
      const newChain = chains.find(_chain => _chain.chainId === newCaipNetwork?.id.split(':')[1])

      if (!newChain) {
        return
      }

      if (NetworkController.state.caipNetwork && !SolStoreUtil.state.isConnected) {
        SolStoreUtil.setCaipChainId(`solana:${newChain.chainId}`)
        SolStoreUtil.setCurrentChain(newChain)
        localStorage.setItem(SolConstantsUtil.CAIP_CHAIN_ID, `solana:${newChain.chainId}`)
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

    this.WalletConnectConnector = new WalletConnectConnector({
      projectId: clientOptions.projectId,
      relayerRegion: 'wss://relay.walletconnect.com',
      metadata: clientOptions.solanaConfig?.metadata,
      chains: clientOptions.chains,
      qrcode: true
    })

    if (CoreHelperUtil.isClient()) {
      watchStandard(standardAdapters => {
        const uniqueIds = standardAdapters
          ? new Set(standardAdapters.map(s => s.name))
          : new Set([])
        this.filteredWalletAdapters = [
          ...standardAdapters,
          ...this.walletAdapters.filter(
            adapter => !uniqueIds.has(adapter.name) && uniqueIds.add(adapter.name)
          )
        ]
        this.checkActiveProviders.bind(this)(standardAdapters)
        this.syncStandardAdapters.bind(this)(standardAdapters)
      })
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

  public async checkActiveProviders(standardAdapters?: StandardWalletAdapter[]) {
    const walletId = localStorage.getItem(SolConstantsUtil.WALLET_ID)

    if (!walletId) {
      return
    }

    try {
      if (walletId === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
        const provider = await this.WalletConnectConnector?.getProvider()
        if (provider?.session) {
          const account = provider.session.namespaces['solana']?.accounts[0]
          this.setWalletConnectProvider(account?.split(':')[2])
        }
      } else {
        const walletArray = walletId?.split('_') ?? []
        if (walletArray[0] === 'announced' && standardAdapters) {
          const adapter = standardAdapters.find(a => a.name === walletArray[1])

          if (adapter) {
            await adapter.connect()
            this.setInjectedProvider(adapter as unknown as Provider)

            return
          }
        } else if (walletArray[0] === 'injected') {
          const adapter = [...(standardAdapters ?? []), ...this.walletAdapters].find(
            a => a.name === walletArray[1]
          ) as ExtendedBaseWalletAdapter
          await adapter.connect()
          this.setInjectedProvider(adapter as unknown as Provider)

          return
        }

        throw new Error('AppKit:checkActiveProviders - Invalid type in walletId')
      }
    } catch (error) {
      SolStoreUtil.setError(error)
    }
  }

  // -- Private -----------------------------------------------------------------
  private syncStandardAdapters(standardAdapters?: StandardWalletAdapter[]) {
    const w3mConnectors: Connector[] = []

    const connectorType = PresetsUtil.ConnectorTypesMap[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID]
    if (connectorType) {
      w3mConnectors.push({
        id: ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID,
        explorerId: PresetsUtil.ConnectorExplorerIds[ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID],
        type: connectorType,
        imageUrl: 'https://avatars.githubusercontent.com/u/37784886',
        name: this.WalletConnectConnector?.name,
        provider: this.WalletConnectConnector?.getProvider(),
        chain: this.chain
      })
    }

    const uniqueIds = standardAdapters ? new Set(standardAdapters.map(s => s.name)) : new Set([])
    const FILTER_OUT_ADAPTERS = ['Trust']
    const filteredAdapters = this.walletAdapters
      .filter(adapter => FILTER_OUT_ADAPTERS.some(filter => filter === adapter.name))
      .filter(adapter => !uniqueIds.has(adapter.name) && uniqueIds.add(adapter.name))

    standardAdapters?.forEach(adapter => {
      w3mConnectors.push({
        id: adapter.name,
        type: 'ANNOUNCED',
        imageUrl: adapter.icon,
        name: adapter.name,
        provider: adapter,
        chain: CommonConstantsUtil.CHAIN.SOLANA
      })
    })
    filteredAdapters.forEach(adapter => {
      w3mConnectors.push({
        id: adapter.name,
        type: 'EXTERNAL',
        imageUrl: adapter.icon,
        name: adapter.name,
        provider: adapter,
        chain: CommonConstantsUtil.CHAIN.SOLANA
      })
    })

    this.appKit?.setConnectors(w3mConnectors)
  }

  private async syncAccount() {
    const address = SolStoreUtil.state.address
    const chainId = SolStoreUtil.state.currentChain?.chainId
    const isConnected = SolStoreUtil.state.isConnected
    this.appKit?.resetAccount(this.chain)

    if (isConnected && address && chainId) {
      const caipAddress: CaipAddress = `${ConstantsUtil.INJECTED_CONNECTOR_ID}:${chainId}:${address}`
      this.appKit?.setIsConnected(isConnected, this.chain)
      this.appKit?.setCaipAddress(caipAddress, this.chain)
      await Promise.all([this.syncBalance(address)])

      this.hasSyncedConnectedAccount = true
    } else if (!isConnected && this.hasSyncedConnectedAccount) {
      this.appKit?.resetWcConnection()
      this.appKit?.resetNetwork()
    }
  }

  private async syncBalance(address: string) {
    const caipChainId = SolStoreUtil.state.caipChainId
    if (caipChainId && this.chains) {
      const chain = SolHelpersUtil.getChainFromCaip(this.chains, caipChainId)
      if (chain) {
        const balance = await this.WalletConnectConnector?.getBalance(address)
        if (balance) {
          this.appKit?.setBalance(balance.decimals.toString(), chain.currency, this.chain)
        }
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
    this.appKit?.setRequestedCaipNetworks(requestedCaipNetworks ?? [], this.chain)
  }

  public async switchNetwork(caipNetwork: CaipNetwork) {
    const caipChainId = caipNetwork.id
    const providerType = SolStoreUtil.state.providerType
    const provider = SolStoreUtil.state.provider
    const chain = SolHelpersUtil.getChainFromCaip(this.chains, caipChainId)

    if (chain) {
      SolStoreUtil.setCaipChainId(`solana:${chain.chainId}`)
      SolStoreUtil.setCurrentChain(chain)
      localStorage.setItem(SolConstantsUtil.CAIP_CHAIN_ID, `solana:${chain.chainId}`)
      if (!providerType) {
        throw new Error('connectionControllerClient:switchNetwork - providerType is undefined')
      }
      if (providerType === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
        const universalProvider = await this.WalletConnectConnector?.getProvider()

        const namespaces = this.WalletConnectConnector?.generateNamespaces(chain.chainId)
        SolStoreUtil.setConnection(
          new Connection(
            SolHelpersUtil.detectRpcUrl(chain, this.instanceOptions?.projectId || ''),
            this.connectionSettings
          )
        )
        universalProvider?.connect({ namespaces, pairingTopic: undefined })
        await this.syncAccount()
      } else {
        SolStoreUtil.setConnection(
          new Connection(
            SolHelpersUtil.detectRpcUrl(chain, this.instanceOptions?.projectId || ''),
            this.connectionSettings
          )
        )
        const name = provider ? (provider as Provider).name : ''
        this.setAddress(
          this.filteredWalletAdapters?.find(adapter => adapter.name === name)?.publicKey?.toString()
        )
        await this.syncAccount()
      }
    }
  }

  private async syncNetwork(chainImages?: Web3ModalClientOptions['chainImages']) {
    const address = SolStoreUtil.state.address
    const storeChainId = SolStoreUtil.state.caipChainId
    const isConnected = SolStoreUtil.state.isConnected

    if (this.chains) {
      const chain = SolHelpersUtil.getChainFromCaip(this.chains, storeChainId)
      if (chain) {
        const caipChainId: CaipNetworkId = `solana:${chain.chainId}`

        this.appKit?.setCaipNetwork({
          id: caipChainId,
          name: chain.name,
          imageId: PresetsUtil.EIP155NetworkImageIds[chain.chainId],
          imageUrl: chainImages?.[chain.chainId],
          chain: this.chain
        })
        if (isConnected && address) {
          if (chain.explorerUrl) {
            const url = `${chain.explorerUrl}/account/${address}`
            this.appKit?.setAddressExplorerUrl(url, this.chain)
          } else {
            this.appKit?.setAddressExplorerUrl(undefined, this.chain)
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
      this.appKit?.setApprovedCaipNetworksData(this.chain)
    ])
  }

  private setInjectedProvider(provider: Provider) {
    const id = SolHelpersUtil.getStorageInjectedId(provider as unknown as ExtendedBaseWalletAdapter)
    const address = provider.publicKey?.toString()

    window?.localStorage.setItem(SolConstantsUtil.WALLET_ID, id)

    const chainId = SolStoreUtil.state.currentChain?.chainId
    const caipChainId = `solana:${chainId}`

    if (address && chainId) {
      SolStoreUtil.setIsConnected(true)
      SolStoreUtil.setCaipChainId(caipChainId)
      SolStoreUtil.setProviderType(id)
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
