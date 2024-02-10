import { EthereumProvider } from '@walletconnect/ethereum-provider'
import {
  connect,
  disconnect,
  signMessage,
  getBalance,
  getEnsAvatar,
  getEnsName,
  getAccount,
  switchChain,
  watchAccount,
  watchConnectors
} from '@wagmi/core'
import { mainnet } from '@wagmi/core/chains'
import type { Chain } from '@wagmi/core/chains'
import type { GetAccountReturnType } from '@wagmi/core'
import type {
  CaipAddress,
  CaipNetwork,
  CaipNetworkId,
  ConnectionControllerClient,
  Connector,
  LibraryOptions,
  NetworkControllerClient,
  PublicStateControllerState,
  SocialProvider,
  Token
} from '@web3modal/scaffold'
import type { Hex } from 'viem'
import { Web3ModalScaffold } from '@web3modal/scaffold'
import type { Web3ModalSIWEClient } from '@web3modal/siwe'
import { ConstantsUtil, PresetsUtil, HelpersUtil } from '@web3modal/scaffold-utils'
import {
  getCaipDefaultChain,
  getEmailCaipNetworks,
  getWalletConnectCaipNetworks
} from './utils/helpers.js'
import { W3mFrameHelpers } from '@web3modal/wallet'
import type { W3mFrameProvider } from '@web3modal/wallet'
import { ConstantsUtil as CoreConstants } from '@web3modal/core'
import type { defaultWagmiConfig as coreConfig } from './utils/defaultWagmiCoreConfig.js'
import type { defaultWagmiConfig as reactConfig } from './utils/defaultWagmiReactConfig.js'

// -- Types ---------------------------------------------------------------------
export type CoreConfig = ReturnType<typeof coreConfig>
export type ReactConfig = ReturnType<typeof reactConfig>
type Config = CoreConfig | ReactConfig

export interface Web3ModalClientOptions<C extends Config>
  extends Omit<LibraryOptions, 'defaultChain' | 'tokens'> {
  wagmiConfig: C
  siweConfig?: Web3ModalSIWEClient
  defaultChain?: Chain
  chainImages?: Record<number, string>
  connectorImages?: Record<string, string>
  tokens?: Record<number, Token>
}

export type Web3ModalOptions<C extends Config> = Omit<Web3ModalClientOptions<C>, '_sdkVersion'>

// @ts-expect-error: Overriden state type is correct
interface Web3ModalState extends PublicStateControllerState {
  selectedNetworkId: number | undefined
}

// -- Client --------------------------------------------------------------------
export class Web3Modal extends Web3ModalScaffold {
  private hasSyncedConnectedAccount = false

  private options: Web3ModalClientOptions<CoreConfig> | undefined = undefined

  private wagmiConfig: Web3ModalClientOptions<CoreConfig>['wagmiConfig']

  public constructor(options: Web3ModalClientOptions<CoreConfig>) {
    const { wagmiConfig, siweConfig, defaultChain, tokens, _sdkVersion, ...w3mOptions } = options

    if (!wagmiConfig) {
      throw new Error('web3modal:constructor - wagmiConfig is undefined')
    }

    if (!w3mOptions.projectId) {
      throw new Error('web3modal:constructor - projectId is undefined')
    }

    const networkControllerClient: NetworkControllerClient = {
      switchCaipNetwork: async caipNetwork => {
        const chainId = HelpersUtil.caipNetworkIdToNumber(caipNetwork?.id)
        if (chainId) {
          await switchChain(this.wagmiConfig, { chainId })
        }
      },

      getApprovedCaipNetworksData: async () =>
        new Promise(resolve => {
          const connections = new Map(wagmiConfig.state.connections)
          const connection = connections.get(wagmiConfig.state.current || '')

          if (connection?.connector?.id === ConstantsUtil.AUTH_CONNECTOR_ID) {
            resolve(getEmailCaipNetworks())
          } else if (connection?.connector?.id === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
            const connector = wagmiConfig.connectors.find(
              c => c.id === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID
            )

            resolve(getWalletConnectCaipNetworks(connector))
          }

          resolve({ approvedCaipNetworkIds: undefined, supportsAllNetworks: true })
        })
    }

    const connectionControllerClient: ConnectionControllerClient = {
      connectWalletConnect: async onUri => {
        const connector = wagmiConfig.connectors.find(
          c => c.id === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID
        )
        if (!connector) {
          throw new Error('connectionControllerClient:getWalletConnectUri - connector is undefined')
        }
        const provider = (await connector.getProvider()) as Awaited<
          ReturnType<(typeof EthereumProvider)['init']>
        >

        provider.on('display_uri', data => {
          onUri(data)
        })

        const chainId = HelpersUtil.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        await connect(this.wagmiConfig, { connector, chainId })
      },

      connectExternal: async ({ id, provider, info }) => {
        const connector = wagmiConfig.connectors.find(c => c.id === id)
        if (!connector) {
          throw new Error('connectionControllerClient:connectExternal - connector is undefined')
        }
        if (provider && info && connector.id === ConstantsUtil.EIP6963_CONNECTOR_ID) {
          // @ts-expect-error Exists on EIP6963Connector
          connector.setEip6963Wallet?.({ provider, info })
        }
        const chainId = HelpersUtil.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        await connect(this.wagmiConfig, { connector, chainId })
      },

      checkInstalled: ids => {
        const injectedConnector = this.getConnectors().find(c => c.type === 'INJECTED')

        if (!ids) {
          return Boolean(window.ethereum)
        }

        if (injectedConnector) {
          if (!window?.ethereum) {
            return false
          }

          return ids.some(id => Boolean(window.ethereum?.[String(id)]))
        }

        return false
      },

      disconnect: async () => {
        await disconnect(this.wagmiConfig)
        if (siweConfig?.options?.signOutOnDisconnect) {
          await siweConfig.signOut()
        }
      },

      signMessage: async message => signMessage(this.wagmiConfig, { message })
    }

    super({
      networkControllerClient,
      connectionControllerClient,
      siweControllerClient: siweConfig,
      defaultChain: getCaipDefaultChain(defaultChain),
      tokens: HelpersUtil.getCaipTokens(tokens),
      _sdkVersion: _sdkVersion ?? `html-wagmi-${ConstantsUtil.VERSION}`,
      ...w3mOptions
    })

    this.options = options
    this.wagmiConfig = wagmiConfig

    this.syncRequestedNetworks([...wagmiConfig.chains])
    this.syncConnectors([...wagmiConfig.connectors])

    watchConnectors(this.wagmiConfig, {
      onChange: connectors => this.syncConnectors(connectors)
    })
    watchAccount(this.wagmiConfig, {
      onChange: accountData => this.syncAccount({ ...accountData })
    })
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

  // -- Private -----------------------------------------------------------------
  private syncRequestedNetworks(chains: Chain[]) {
    const requestedCaipNetworks = chains?.map(
      chain =>
        ({
          id: `${ConstantsUtil.EIP155}:${chain.id}`,
          name: chain.name,
          imageId: PresetsUtil.EIP155NetworkImageIds[chain.id],
          imageUrl: this.options?.chainImages?.[chain.id]
        }) as CaipNetwork
    )
    this.setRequestedCaipNetworks(requestedCaipNetworks ?? [])
  }

  private async syncAccount({ address, isConnected, chainId }: GetAccountReturnType) {
    this.resetAccount()
    // TOD0: Check with Sven. Now network is synced when acc is synced.
    this.syncNetwork()
    if (isConnected && address && chainId) {
      const caipAddress: CaipAddress = `${ConstantsUtil.EIP155}:${chainId}:${address}`
      this.setIsConnected(isConnected)
      this.setCaipAddress(caipAddress)
      await Promise.all([
        this.syncProfile(address, chainId),
        this.syncBalance(address, chainId),
        this.getApprovedCaipNetworksData()
      ])
      this.hasSyncedConnectedAccount = true
    } else if (!isConnected && this.hasSyncedConnectedAccount) {
      this.resetWcConnection()
      this.resetNetwork()
    }
  }

  private async syncNetwork() {
    const { address, isConnected, chainId } = getAccount(this.wagmiConfig)
    const chain = this.wagmiConfig.chains.find((c: Chain) => c.id === chainId)

    if (chain || chainId) {
      const name = chain?.name ?? chainId?.toString()
      const id = Number(chain?.id ?? chainId)
      const caipChainId: CaipNetworkId = `${ConstantsUtil.EIP155}:${id}`
      this.setCaipNetwork({
        id: caipChainId,
        name,
        imageId: PresetsUtil.EIP155NetworkImageIds[id],
        imageUrl: this.options?.chainImages?.[id]
      })
      if (isConnected && address && chainId) {
        const caipAddress: CaipAddress = `${ConstantsUtil.EIP155}:${id}:${address}`
        this.setCaipAddress(caipAddress)
        if (chain?.blockExplorers?.default?.url) {
          const url = `${chain.blockExplorers.default.url}/address/${address}`
          this.setAddressExplorerUrl(url)
        } else {
          this.setAddressExplorerUrl(undefined)
        }
        if (this.hasSyncedConnectedAccount) {
          await this.syncProfile(address, chainId)
          await this.syncBalance(address, chainId)
        }
      }
    }
  }

  private async syncProfile(address: Hex, chainId: Chain['id']) {
    if (chainId !== mainnet.id) {
      this.setProfileName(null)
      this.setProfileImage(null)

      return
    }

    try {
      const { name, avatar } = await this.fetchIdentity({
        caipChainId: `${ConstantsUtil.EIP155}:${chainId}`,
        address
      })
      this.setProfileName(name)
      this.setProfileImage(avatar)
    } catch {
      const profileName = await getEnsName(this.wagmiConfig, { address, chainId })
      if (profileName) {
        this.setProfileName(profileName)
        const profileImage = await getEnsAvatar(this.wagmiConfig, {
          name: profileName,
          chainId
        })
        if (profileImage) {
          this.setProfileImage(profileImage)
        }
      }
    }
  }

  private async syncBalance(address: Hex, chainId: number) {
    const chain = this.wagmiConfig.chains.find((c: Chain) => c.id === chainId)
    if (chain) {
      const balance = await getBalance(this.wagmiConfig, {
        address,
        chainId: chain.id,
        token: this.options?.tokens?.[chain.id]?.address as Hex
      })
      this.setBalance(balance.formatted, balance.symbol)

      return
    }
    this.setBalance(undefined, undefined)
  }

  private syncConnectors(
    connectors: Web3ModalClientOptions<CoreConfig>['wagmiConfig']['connectors']
  ) {
    const uniqueIds = new Set()
    const filteredConnectors = connectors.filter(
      item => !uniqueIds.has(item.id) && uniqueIds.add(item.id)
    )

    const w3mConnectors: Connector[] = []

    const coinbaseSDKId = ConstantsUtil.COINBASE_SDK_CONNECTOR_ID

    // Check if coinbase injected connector is present
    const coinbaseConnector = filteredConnectors.find(
      c => c.id === CoreConstants.CONNECTOR_RDNS_MAP[coinbaseSDKId]
    )

    filteredConnectors.forEach(({ id, name, type, icon }) => {
      // If coinbase injected connector is present, skip coinbase sdk connector.
      const shouldSkip =
        (coinbaseConnector && id === coinbaseSDKId) || ConstantsUtil.AUTH_CONNECTOR_ID === id
      if (!shouldSkip) {
        w3mConnectors.push({
          id,
          explorerId: PresetsUtil.ConnectorExplorerIds[id],
          imageUrl: this.options?.connectorImages?.[id] ?? icon,
          name: PresetsUtil.ConnectorNamesMap[id] ?? name,
          imageId: PresetsUtil.ConnectorImageIds[id],
          type: PresetsUtil.ConnectorTypesMap[type] ?? 'EXTERNAL'
        })
      }
    })
    this.setConnectors(w3mConnectors)
    this.syncAuthConnector(filteredConnectors)
  }

  private async syncAuthConnector(
    connectors: Web3ModalClientOptions<CoreConfig>['wagmiConfig']['connectors']
  ) {
    const authConnector = connectors.find(
      ({ id }) => id === ConstantsUtil.AUTH_CONNECTOR_ID
    ) as unknown as Web3ModalClientOptions<CoreConfig>['wagmiConfig']['connectors'][0] & {
      email: boolean
      socials: SocialProvider[]
    }
    if (authConnector) {
      const provider = await authConnector.getProvider()
      this.addConnector({
        id: ConstantsUtil.AUTH_CONNECTOR_ID,
        type: 'AUTH',
        name: 'Auth',
        provider,
        email: authConnector.email,
        socials: authConnector.socials
      })
      this.listenAuthConnector(authConnector)
    }
  }

  private async listenAuthConnector(
    connector: Web3ModalClientOptions<CoreConfig>['wagmiConfig']['connectors'][number]
  ) {
    if (typeof window !== 'undefined' && connector) {
      super.setLoading(true)
      const provider = (await connector.getProvider()) as W3mFrameProvider
      const isLoginEmailUsed = provider.getLoginEmailUsed()

      super.setLoading(isLoginEmailUsed)
      provider.onRpcRequest(request => {
        if (!W3mFrameHelpers.checkIfRequestIsAllowed(request)) {
          super.open({ view: 'ApproveTransaction' })
        }
      })
      provider.onRpcResponse(() => {
        super.close()
      })
      provider.onIsConnected(() => {
        super.setLoading(false)
      })
    }
  }
}
