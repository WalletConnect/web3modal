/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */
import type { AppKit, AppKitOptions, AppKitOptionsWithCaipNetworks } from '@reown/appkit'
import type {
  AdapterType,
  AppKitNetwork,
  BaseNetwork,
  CaipAddress,
  CaipNetwork,
  ChainNamespace
} from '@reown/appkit-common'
import {
  ConstantsUtil as CommonConstantsUtil,
  isReownName,
  NetworkUtil,
  SafeLocalStorage,
  SafeLocalStorageKeys
} from '@reown/appkit-common'
import type {
  ChainAdapter,
  ConnectionControllerClient,
  Connector,
  NetworkControllerClient,
  PublicStateControllerState,
  SendTransactionArgs,
  WriteContractArgs
} from '@reown/appkit-core'
import {
  ChainController,
  ConstantsUtil as CoreConstantsUtil,
  StorageUtil
} from '@reown/appkit-core'
import {
  CaipNetworksUtil,
  ConstantsUtil,
  ErrorUtil,
  HelpersUtil,
  PresetsUtil
} from '@reown/appkit-utils'
import type { W3mFrameProvider, W3mFrameTypes } from '@reown/appkit-wallet'
import { W3mFrameHelpers, W3mFrameRpcConstants } from '@reown/appkit-wallet'
import { ProviderUtil, type ProviderIdType } from '@reown/appkit/store'
import { coinbaseWallet } from '@wagmi/connectors'
import type {
  Config,
  CreateConfigParameters,
  CreateConnectorFn,
  GetAccountReturnType,
  GetEnsAddressReturnType
} from '@wagmi/core'
import {
  connect,
  createConfig,
  disconnect,
  getAccount,
  getBalance,
  getConnections,
  getConnectors,
  getEnsName,
  injected,
  prepareTransactionRequest,
  reconnect,
  signMessage,
  switchAccount,
  switchChain,
  estimateGas as wagmiEstimateGas,
  getEnsAddress as wagmiGetEnsAddress,
  getEnsAvatar as wagmiGetEnsAvatar,
  sendTransaction as wagmiSendTransaction,
  writeContract as wagmiWriteContract,
  waitForTransactionReceipt,
  watchAccount,
  watchConnectors
} from '@wagmi/core'
import type { Chain } from '@wagmi/core/chains'
import type UniversalProvider from '@walletconnect/universal-provider'
import type { Hex } from 'viem'
import { formatUnits, parseUnits } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import { authConnector } from './connectors/AuthConnector.js'
import { walletConnect } from './connectors/UniversalConnector.js'
import {
  getEmailCaipNetworks,
  getTransport,
  getWalletConnectCaipNetworks,
  parseWalletCapabilities,
  requireCaipAddress
} from './utils/helpers.js'

// -- Types ---------------------------------------------------------------------
export interface AdapterOptions<C extends Config>
  extends Pick<AppKitOptions, 'siweConfig' | 'enableEIP6963'> {
  wagmiConfig: C
  defaultNetwork?: Chain
}

const OPTIONAL_METHODS = [
  'eth_accounts',
  'eth_requestAccounts',
  'eth_sendRawTransaction',
  'eth_sign',
  'eth_signTransaction',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_sendTransaction',
  'personal_sign',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
  'wallet_getPermissions',
  'wallet_requestPermissions',
  'wallet_registerOnboarding',
  'wallet_watchAsset',
  'wallet_scanQRCode',
  'wallet_getCallsStatus',
  'wallet_sendCalls',
  'wallet_getCapabilities',
  'wallet_grantPermissions'
]

// @ts-expect-error: Overridden state type is correct
interface AppKitState extends PublicStateControllerState {
  selectedNetworkId: number | undefined
}

// -- Client --------------------------------------------------------------------
export class WagmiAdapter implements ChainAdapter {
  // -- Private variables -------------------------------------------------------
  private appKit: AppKit | undefined = undefined

  // -- Public variables --------------------------------------------------------
  public options: AppKitOptions | undefined = undefined

  public chainNamespace: ChainNamespace = CommonConstantsUtil.CHAIN.EVM

  public caipNetworks: [CaipNetwork, ...CaipNetwork[]]

  public wagmiChains: [BaseNetwork, ...BaseNetwork[]]

  public wagmiConfig: AdapterOptions<Config>['wagmiConfig']

  public networkControllerClient?: NetworkControllerClient

  public connectionControllerClient?: ConnectionControllerClient

  public defaultCaipNetwork: CaipNetwork | undefined = undefined

  public tokens = HelpersUtil.getCaipTokens(this.options?.tokens)

  public siweControllerClient = this.options?.siweConfig

  public adapterType: AdapterType = 'wagmi'

  public constructor(
    configParams: Partial<CreateConfigParameters> & {
      networks: AppKitNetwork[]
      projectId: string
    }
  ) {
    if (!configParams.projectId) {
      throw new Error(ErrorUtil.ALERT_ERRORS.PROJECT_ID_NOT_CONFIGURED.shortMessage)
    }

    this.caipNetworks = CaipNetworksUtil.extendCaipNetworks(configParams.networks, {
      projectId: configParams.projectId,
      customNetworkImageUrls: {}
    }) as [CaipNetwork, ...CaipNetwork[]]

    this.wagmiChains = this.caipNetworks.filter(
      caipNetwork => caipNetwork.chainNamespace === CommonConstantsUtil.CHAIN.EVM
    ) as unknown as [BaseNetwork, ...BaseNetwork[]]

    const transportsArr = this.wagmiChains.map(chain => [
      chain.id,
      getTransport({ chain: chain as Chain, projectId: configParams.projectId })
    ])

    const transports = Object.fromEntries(transportsArr)
    const connectors: CreateConnectorFn[] = [...(configParams.connectors ?? [])]

    this.wagmiConfig = createConfig({
      ...configParams,
      chains: this.wagmiChains,
      transports,
      connectors: [...connectors, ...(configParams?.connectors ?? [])]
    })
  }

  private setCustomConnectors(options: AppKitOptions, appKit: AppKit) {
    const customConnectors: CreateConnectorFn[] = []

    if (options.enableWalletConnect !== false) {
      customConnectors.push(walletConnect(options, appKit, this.caipNetworks))
    }

    if (options.enableInjected !== false) {
      customConnectors.push(injected({ shimDisconnect: true }))
    }

    if (options.enableCoinbase !== false) {
      customConnectors.push(
        coinbaseWallet({
          version: '4',
          appName: options.metadata?.name ?? 'Unknown',
          appLogoUrl: options.metadata?.icons[0] ?? 'Unknown',
          preference: options.coinbasePreference ?? 'all'
        })
      )
    }

    const emailEnabled =
      options.features?.email === undefined
        ? CoreConstantsUtil.DEFAULT_FEATURES.email
        : options.features?.email
    const socialsEnabled = options.features?.socials
      ? options.features?.socials?.length > 0
      : CoreConstantsUtil.DEFAULT_FEATURES.socials

    if (emailEnabled || socialsEnabled) {
      customConnectors.push(
        authConnector({
          chains: this.wagmiChains,
          options: { projectId: options.projectId }
        })
      )
    }

    customConnectors.forEach(connector => {
      const cnctr = this.wagmiConfig._internal.connectors.setup(connector)
      this.wagmiConfig._internal.connectors.setState(prev => [...prev, cnctr])
    })
  }

  public construct(appKit: AppKit, options: AppKitOptionsWithCaipNetworks) {
    this.appKit = appKit
    this.options = options
    this.defaultCaipNetwork = options.defaultNetwork || options.networks?.[0]
    this.tokens = HelpersUtil.getCaipTokens(options.tokens)
    this.setCustomConnectors(options, appKit)

    if (!this.wagmiConfig) {
      throw new Error('appkit:wagmiConfig - is undefined')
    }

    this.networkControllerClient = {
      switchCaipNetwork: async caipNetwork => {
        const chainId = caipNetwork?.id as number | undefined

        if (chainId && this.wagmiConfig) {
          await switchChain(this.wagmiConfig, { chainId })
        }
      },
      getApprovedCaipNetworksData: async () => {
        if (!this.wagmiConfig) {
          throw new Error(
            'networkControllerClient:getApprovedCaipNetworksData - wagmiConfig is undefined'
          )
        }

        return new Promise(resolve => {
          const connections = new Map(this.wagmiConfig.state.connections)
          const connection = connections.get(this.wagmiConfig.state.current || '')
          if (connection?.connector?.id === ConstantsUtil.AUTH_CONNECTOR_ID) {
            resolve(getEmailCaipNetworks())
          } else if (connection?.connector?.id === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID) {
            const connector = this.wagmiConfig.connectors.find(
              c => c.id === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID
            )
            resolve(getWalletConnectCaipNetworks(connector))
          }
          resolve({ approvedCaipNetworkIds: [], supportsAllNetworks: true })
        })
      }
    }

    this.connectionControllerClient = {
      connectWalletConnect: async () => {
        if (!this.wagmiConfig) {
          throw new Error(
            'connectionControllerClient:getWalletConnectUri - wagmiConfig is undefined'
          )
        }
        const connector = this.wagmiConfig.connectors.find(
          c => c.id === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID
        )

        if (!connector) {
          throw new Error('connectionControllerClient:getWalletConnectUri - connector is undefined')
        }

        const provider = (await connector.getProvider()) as Awaited<
          ReturnType<(typeof UniversalProvider)['init']>
        >

        const clientId = await provider.client?.core?.crypto?.getClientId()
        if (clientId) {
          this.appKit?.setClientId(clientId)
        }

        let chainId = this.appKit?.getCaipNetworkId<number>()
        let address: string | undefined = undefined
        let isSuccessfulOneClickAuth = false

        const isSiweEnabled = this.appKit?.getIsSiweEnabled()
        const isProviderSupported = typeof provider?.authenticate === 'function'
        const supportsOneClickAuth = isSiweEnabled && isProviderSupported

        if (supportsOneClickAuth) {
          const { SIWEController, getDidChainId, getDidAddress } = await import(
            '@reown/appkit-siwe'
          )
          if (!SIWEController.state._client) {
            return
          }

          const siweParams = await SIWEController?.getMessageParams?.()
          const isSiweParamsValid = siweParams && Object.keys(siweParams || {}).length > 0

          if (!isSiweParamsValid) {
            return
          }

          let reorderedChains = this.wagmiChains.map(chain => chain.id)

          // @ts-expect-error - setting requested chains beforehand avoids wagmi auto disconnecting the session when `connect` is called because it thinks chains are stale
          await connector.setRequestedChainsIds(reorderedChains)

          if (chainId) {
            reorderedChains = [chainId, ...reorderedChains.filter(c => c !== chainId)]
          }

          SIWEController.setIsOneClickAuthenticating(true)
          const result = await provider.authenticate({
            nonce: await SIWEController.getNonce(),
            methods: [...OPTIONAL_METHODS],
            ...siweParams,
            chains: reorderedChains.map(chain => `eip155:${chain}`)
          })

          // Auths is an array of signed CACAO objects https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-74.md
          const signedCacao = result?.auths?.[0]

          if (signedCacao) {
            const { p, s } = signedCacao
            const cacaoChainId = getDidChainId(p.iss)
            address = getDidAddress(p.iss)

            if (address && cacaoChainId) {
              chainId = parseInt(cacaoChainId, 10)

              SIWEController.setSession({
                address,
                chainId: parseInt(cacaoChainId, 10)
              })
            }

            SIWEController.setStatus('authenticating')

            try {
              // Kicks off verifyMessage and populates external states
              const message = provider.client.formatAuthMessage({
                request: p,
                iss: p.iss
              })

              await SIWEController.verifyMessage({
                message,
                signature: s.s,
                cacao: signedCacao,
                clientId
              })
              isSuccessfulOneClickAuth = true
            } catch (error) {
              isSuccessfulOneClickAuth = false
              SIWEController.setIsOneClickAuthenticating(false)

              // eslint-disable-next-line no-console
              console.error('Error verifying message', error)
              // eslint-disable-next-line no-console
              await provider.disconnect().catch(console.error)
              await this.connectionControllerClient?.disconnect().catch(console.error)
              SIWEController.setStatus('error')
              throw error
            }
          }
          SIWEController.setIsOneClickAuthenticating(false)
        }

        await connect(this.wagmiConfig, { connector, chainId })
        const { SIWEController } = await import('@reown/appkit-siwe')
        if (supportsOneClickAuth && address && chainId && isSuccessfulOneClickAuth) {
          SIWEController.setStatus('authenticating')
          await SIWEController.onSignIn?.({
            address,
            chainId
          })
          SIWEController.setStatus('success')
        }
      },
      connectExternal: async ({ id, provider, info }) => {
        if (!this.wagmiConfig) {
          throw new Error(
            'networkControllerClient:getApprovedCaipNetworksData - wagmiConfig is undefined'
          )
        }
        const connector = this.wagmiConfig.connectors.find(c => c.id === id)
        if (!connector) {
          throw new Error('connectionControllerClient:connectExternal - connector is undefined')
        }
        this.appKit?.setClientId(null)
        if (provider && info && connector.id === ConstantsUtil.EIP6963_CONNECTOR_ID) {
          // @ts-expect-error Exists on EIP6963Connector
          connector.setEip6963Wallet?.({ provider, info })
        }
        const chainId = this.appKit?.getCaipNetworkId<number>()
        await connect(this.wagmiConfig, { connector, chainId })
      },
      checkInstalled: ids => {
        const injectedConnector = this.appKit
          ?.getConnectors()
          .find((c: Connector) => c.type === 'INJECTED')
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
        if (this.options?.siweConfig?.options?.signOutOnDisconnect) {
          const { SIWEController } = await import('@reown/appkit-siwe')
          await SIWEController.signOut()
        }
        SafeLocalStorage.removeItem(SafeLocalStorageKeys.WALLET_ID)
        SafeLocalStorage.removeItem(SafeLocalStorageKeys.CONNECTED_CONNECTOR)
        SafeLocalStorage.removeItem(SafeLocalStorageKeys.WALLET_NAME)
        this.appKit?.setClientId(null)
        this.syncAccount({
          address: undefined,
          chainId: undefined,
          connector: undefined,
          addresses: undefined,
          status: 'disconnected'
        })
        // Should we do this?
        this.appKit?.resetAccount('solana')
      },
      signMessage: async message => {
        const caipAddress = this.appKit?.getCaipAddress() || ''
        const account = requireCaipAddress(caipAddress)

        return signMessage(this.wagmiConfig, { message, account })
      },
      estimateGas: async args => {
        if (args.chainNamespace && args.chainNamespace !== 'eip155') {
          throw new Error(`Invalid chain namespace - Expected eip155, got ${args.chainNamespace}`)
        }
        try {
          return await wagmiEstimateGas(this.wagmiConfig, {
            account: args.address,
            to: args.to,
            data: args.data,
            type: 'legacy'
          })
        } catch (error) {
          return BigInt(0)
        }
      },

      getCapabilities: async (params: string) => {
        if (!this.wagmiConfig) {
          throw new Error('connectionControllerClient:getCapabilities - wagmiConfig is undefined')
        }

        const connections = getConnections(this.wagmiConfig)
        const connection = connections[0]

        if (!connection?.connector) {
          throw new Error('connectionControllerClient:getCapabilities - connector is undefined')
        }

        const provider = (await connection.connector.getProvider()) as UniversalProvider

        if (!provider) {
          throw new Error('connectionControllerClient:getCapabilities - provider is undefined')
        }

        const walletCapabilitiesString = provider.session?.sessionProperties?.['capabilities']
        if (walletCapabilitiesString) {
          const walletCapabilities = parseWalletCapabilities(walletCapabilitiesString)
          const accountCapabilities = walletCapabilities[params]
          if (accountCapabilities) {
            return accountCapabilities
          }
        }

        return await provider.request({ method: 'wallet_getCapabilities', params: [params] })
      },

      grantPermissions: async params => {
        if (!this.wagmiConfig) {
          throw new Error('connectionControllerClient:grantPermissions - wagmiConfig is undefined')
        }

        const connections = getConnections(this.wagmiConfig)
        const connection = connections[0]

        if (!connection?.connector) {
          throw new Error('connectionControllerClient:grantPermissions - connector is undefined')
        }

        const provider = (await connection.connector.getProvider()) as UniversalProvider

        if (!provider) {
          throw new Error('connectionControllerClient:grantPermissions - provider is undefined')
        }

        return provider.request({ method: 'wallet_grantPermissions', params })
      },

      sendTransaction: async (data: SendTransactionArgs) => {
        if (data.chainNamespace && data.chainNamespace !== 'eip155') {
          throw new Error(`Invalid chain namespace - Expected eip155, got ${data.chainNamespace}`)
        }
        const { chainId } = getAccount(this.wagmiConfig)
        const txParams = {
          account: data.address,
          to: data.to,
          value: data.value,
          gas: data.gas,
          gasPrice: data.gasPrice,
          data: data.data,
          chainId,
          type: 'legacy' as const
        }
        await prepareTransactionRequest(this.wagmiConfig, txParams)
        const tx = await wagmiSendTransaction(this.wagmiConfig, txParams)
        await waitForTransactionReceipt(this.wagmiConfig, { hash: tx, timeout: 25000 })

        return tx
      },
      writeContract: async (data: WriteContractArgs) => {
        const caipAddress = this.appKit?.getCaipAddress() || ''
        const account = requireCaipAddress(caipAddress)
        const chainId = this.appKit?.getCaipNetworkId<number>()

        if (!chainId) {
          throw new Error('networkControllerClient:writeContract - chainId is undefined')
        }

        const tx = await wagmiWriteContract(this.wagmiConfig, {
          chain: this.wagmiChains?.[chainId],
          chainId,
          address: data.tokenAddress,
          account,
          abi: data.abi,
          functionName: data.method,
          args: [data.receiverAddress, data.tokenAmount]
        })

        return tx
      },
      getEnsAddress: async (value: string) => {
        try {
          if (!this.wagmiConfig) {
            throw new Error(
              'networkControllerClient:getApprovedCaipNetworksData - wagmiConfig is undefined'
            )
          }
          const chainId = this.appKit?.getCaipNetworkId<number>()

          let ensName: boolean | GetEnsAddressReturnType = false
          let wcName: boolean | string = false

          if (isReownName(value)) {
            wcName = (await this.appKit?.resolveReownName(value)) || false
          }
          if (chainId === 1) {
            ensName = await wagmiGetEnsAddress(this.wagmiConfig, {
              name: normalize(value),
              chainId
            })
          }

          return ensName || wcName || false
        } catch {
          return false
        }
      },
      getEnsAvatar: async (value: string) => {
        const chainId = this.appKit?.getCaipNetworkId<number>()
        if (chainId !== mainnet.id) {
          return false
        }
        const avatar = await wagmiGetEnsAvatar(this.wagmiConfig, {
          name: normalize(value),
          chainId
        })

        return avatar || false
      },
      parseUnits,
      formatUnits
    }

    ChainController.state.chains.set(this.chainNamespace, {
      chainNamespace: this.chainNamespace,
      connectionControllerClient: this.connectionControllerClient,
      networkControllerClient: this.networkControllerClient,
      adapterType: this.adapterType,
      caipNetworks: this.caipNetworks
    })

    this.syncConnectors(this.wagmiConfig.connectors)
    this.syncAuthConnector(
      this.wagmiConfig?.connectors.find(c => c.id === ConstantsUtil.AUTH_CONNECTOR_ID)
    )
    this.syncRequestedNetworks(this.caipNetworks)

    watchConnectors(this.wagmiConfig, {
      onChange: _connectors => {
        this.syncConnectors(_connectors)
        this.syncAuthConnector(_connectors.find(c => c.id === ConstantsUtil.AUTH_CONNECTOR_ID))
      }
    })
    watchAccount(this.wagmiConfig, {
      onChange: accountData => {
        this.syncAccount(accountData)
      }
    })

    this.appKit?.setEIP6963Enabled(options.enableEIP6963 !== false)
    this.appKit?.subscribeShouldUpdateToAddress((newAddress?: string) => {
      if (newAddress) {
        const connections = getConnections(this.wagmiConfig)
        const connector = connections[0]?.connector
        if (connector) {
          switchAccount(this.wagmiConfig, {
            connector
          }).then(response =>
            this.syncAccount({
              address: newAddress as Hex,
              isConnected: true,
              addresses: response.accounts,
              connector,
              chainId: response.chainId,
              status: 'connected'
            })
          )
        }
      }
    })
  }

  // @ts-expect-error: Overriden state type is correct
  public override subscribeState(callback: (state: AppKitState) => void) {
    return this.appKit?.subscribeState((state: PublicStateControllerState) =>
      callback({
        ...state,
        selectedNetworkId: state.selectedNetworkId
          ? Number(NetworkUtil.caipNetworkIdToNumber(state.selectedNetworkId))
          : undefined
      })
    )
  }

  // -- Private -----------------------------------------------------------------
  private syncRequestedNetworks(caipNetworks: CaipNetwork[]) {
    const uniqueChainNamespaces = Array.from(
      new Set(caipNetworks.map(caipNetwork => caipNetwork.chainNamespace))
    )
    uniqueChainNamespaces
      .filter(c => Boolean(c))
      .forEach(chainNamespace => {
        this.appKit?.setRequestedCaipNetworks(
          caipNetworks.filter(caipNetwork => caipNetwork.chainNamespace === chainNamespace),
          chainNamespace
        )
      })
  }

  private async syncAccount({
    address,
    chainId,
    connector,
    addresses,
    status
  }: Partial<
    Pick<
      GetAccountReturnType,
      | 'address'
      | 'isConnected'
      | 'isDisconnected'
      | 'chainId'
      | 'connector'
      | 'addresses'
      | 'status'
    >
  >) {
    const isAuthConnector = connector?.id === ConstantsUtil.AUTH_CONNECTOR_ID
    if (status === 'disconnected') {
      this.appKit?.resetAccount(this.chainNamespace)
      this.appKit?.resetWcConnection()
      this.appKit?.resetNetwork(this.chainNamespace)
      this.appKit?.setAllAccounts([], this.chainNamespace)
      SafeLocalStorage.removeItem(SafeLocalStorageKeys.WALLET_ID)
      if (isAuthConnector) {
        await connector.disconnect()
      }

      return
    }

    if (this.wagmiConfig) {
      if (connector) {
        if (connector.name === 'WalletConnect' && connector.getProvider && address) {
          const activeCaipNetwork = this.appKit?.getCaipNetwork()
          const currentChainId = chainId || (activeCaipNetwork?.id as number | undefined)
          const provider = (await connector.getProvider()) as UniversalProvider

          const namespaces = provider?.session?.namespaces || {}
          const namespaceKeys = namespaces ? Object.keys(namespaces) : []

          const preferredAccountType = this.appKit?.getPreferredAccountType()

          namespaceKeys.forEach(key => {
            const chainNamespace = key as ChainNamespace
            const caipAddress = namespaces?.[key]?.accounts[0] as CaipAddress

            ProviderUtil.setProvider(chainNamespace, provider)
            ProviderUtil.setProviderId(chainNamespace, 'walletConnect')

            this.appKit?.setPreferredAccountType(preferredAccountType, chainNamespace)
            this.appKit?.setCaipAddress(caipAddress, chainNamespace)
          })
          if (
            this.appKit?.getCaipNetwork()?.chainNamespace !== CommonConstantsUtil.CHAIN.SOLANA &&
            currentChainId
          ) {
            this.syncNetwork(address, currentChainId, true)
            await Promise.all([
              this.syncProfile(address, currentChainId),
              this.syncBalance(address, currentChainId),
              this.syncConnectedWalletInfo(connector),
              this.appKit?.setApprovedCaipNetworksData(this.chainNamespace)
            ])
          }
        } else if (status === 'connected' && address && chainId) {
          ProviderUtil.setProvider(this.chainNamespace, await connector.getProvider())
          ProviderUtil.setProviderId(this.chainNamespace, connector.id as ProviderIdType)
          const caipAddress = `eip155:${chainId}:${address}` as CaipAddress
          this.syncNetwork(address, chainId, true)
          await Promise.all([
            this.syncProfile(address, chainId),
            this.syncBalance(address, chainId),
            this.syncConnectedWalletInfo(connector),
            this.appKit?.setApprovedCaipNetworksData(this.chainNamespace)
          ])
          this.appKit?.setCaipAddress(caipAddress, this.chainNamespace)
          this.appKit?.setStatus('connected', this.chainNamespace)
          // Set by authConnector.onIsConnectedHandler as we need the account type
          if (!isAuthConnector && addresses?.length) {
            this.appKit?.setAllAccounts(
              addresses.map(addr => ({ address: addr, type: 'eoa' })),
              this.chainNamespace
            )
          }
        } else if (status === 'reconnecting') {
          this.appKit?.setLoading(true)
          const connectors = getConnectors(this.wagmiConfig)
          const currentConnector = connectors.find(c => c.id === connector.id)

          if (currentConnector) {
            await reconnect(this.wagmiConfig, {
              connectors: [currentConnector]
            })
            this.appKit?.setLoading(false)
          }
        }
      }
    }
  }

  private async syncNetwork(address?: Hex, chainId?: number, isConnected?: boolean) {
    const caipNetwork = this.caipNetworks.find((c: CaipNetwork) => c.id === chainId)

    if (caipNetwork && chainId) {
      this.appKit?.setCaipNetwork(caipNetwork)

      if (isConnected && address && chainId) {
        const caipAddress: CaipAddress = `eip155:${chainId}:${address}`
        this.appKit?.setCaipAddress(caipAddress, this.chainNamespace)
        if (caipNetwork?.blockExplorers?.default.url) {
          const url = `${caipNetwork.blockExplorers.default.url}/address/${address}`
          this.appKit?.setAddressExplorerUrl(url, this.chainNamespace)
        } else {
          this.appKit?.setAddressExplorerUrl(undefined, this.chainNamespace)
        }

        await this.syncBalance(address, chainId)
      }
    }
  }

  private async syncReownName(address: Hex) {
    if (!this.appKit) {
      throw new Error('syncReownName - appKit is undefined')
    }

    try {
      const registeredWcNames = await this.appKit.getReownName(address)
      if (registeredWcNames[0]) {
        const wcName = registeredWcNames[0]
        this.appKit?.setProfileName(wcName.name, this.chainNamespace)
      } else {
        this.appKit?.setProfileName(null, this.chainNamespace)
      }
    } catch {
      this.appKit?.setProfileName(null, this.chainNamespace)
    }
  }

  private async syncProfile(address: Hex, chainId: Chain['id']) {
    if (!this.appKit) {
      throw new Error('syncProfile - appKit is undefined')
    }

    try {
      const { name, avatar } = await this.appKit.fetchIdentity({
        address
      })
      this.appKit?.setProfileName(name, this.chainNamespace)
      this.appKit?.setProfileImage(avatar, this.chainNamespace)

      if (!name) {
        await this.syncReownName(address)
      }
    } catch {
      if (chainId === mainnet.id) {
        const profileName = await getEnsName(this.wagmiConfig, { address, chainId })
        if (profileName) {
          this.appKit?.setProfileName(profileName, this.chainNamespace)
          const profileImage = await wagmiGetEnsAvatar(this.wagmiConfig, {
            name: profileName,
            chainId
          })
          if (profileImage) {
            this.appKit?.setProfileImage(profileImage, this.chainNamespace)
          }
        } else {
          await this.syncReownName(address)
          this.appKit?.setProfileImage(null, this.chainNamespace)
        }
      } else {
        await this.syncReownName(address)
        this.appKit?.setProfileImage(null, this.chainNamespace)
      }
    }
  }

  private async syncBalance(address: Hex, chainId: number) {
    const caipNetwork = this.caipNetworks.find((c: CaipNetwork) => c.id === chainId)

    if (caipNetwork && this.wagmiConfig) {
      const balance = await getBalance(this.wagmiConfig, {
        address,
        chainId,
        token: this.options?.tokens?.[caipNetwork.caipNetworkId]?.address as Hex
      })
      this.appKit?.setBalance(balance.formatted, balance.symbol, this.chainNamespace)

      return
    }
    this.appKit?.setBalance(undefined, undefined, this.chainNamespace)
  }

  private async syncConnectedWalletInfo(connector: GetAccountReturnType['connector']) {
    if (!connector) {
      throw Error('syncConnectedWalletInfo - connector is undefined')
    }

    if (connector.id === ConstantsUtil.WALLET_CONNECT_CONNECTOR_ID && connector.getProvider) {
      const walletConnectProvider = (await connector.getProvider()) as Awaited<
        ReturnType<(typeof UniversalProvider)['init']>
      >
      if (walletConnectProvider.session) {
        this.appKit?.setConnectedWalletInfo(
          {
            ...walletConnectProvider.session.peer.metadata,
            name: walletConnectProvider.session.peer.metadata.name,
            icon: walletConnectProvider.session.peer.metadata.icons?.[0]
          },
          this.chainNamespace
        )
      }
    } else {
      const wagmiConnector = this.appKit?.getConnectors().find(c => c.id === connector.id)
      this.appKit?.setConnectedWalletInfo(
        {
          name: connector.name,
          icon: connector.icon || this.appKit.getConnectorImage(wagmiConnector)
        },
        this.chainNamespace
      )
    }
  }

  private syncConnectors(_connectors: AdapterOptions<Config>['wagmiConfig']['connectors']) {
    const connectors = _connectors.map(connector => ({ ...connector, chain: this.chainNamespace }))
    const uniqueIds = new Set()
    const filteredConnectors = connectors.filter(item => {
      const isDuplicate = uniqueIds.has(item.id)
      uniqueIds.add(item.id)

      return !isDuplicate
    })

    const w3mConnectors: Connector[] = []

    filteredConnectors.forEach(({ id, name, type, icon }) => {
      // Auth connector is initialized separately
      const shouldSkip = ConstantsUtil.AUTH_CONNECTOR_ID === id
      if (!shouldSkip) {
        w3mConnectors.push({
          id,
          explorerId: PresetsUtil.ConnectorExplorerIds[id],
          imageUrl: this.options?.connectorImages?.[id] ?? icon,
          name: PresetsUtil.ConnectorNamesMap[id] ?? name,
          imageId: PresetsUtil.ConnectorImageIds[id],
          type: PresetsUtil.ConnectorTypesMap[type] ?? 'EXTERNAL',
          info: {
            rdns: id
          },
          chain: this.chainNamespace
        })
      }
    })

    this.appKit?.setConnectors(w3mConnectors)
  }

  private async syncAuthConnector(
    _authConnector: AdapterOptions<Config>['wagmiConfig']['connectors'][number] | undefined
  ) {
    const connector =
      _authConnector as unknown as AdapterOptions<Config>['wagmiConfig']['connectors'][0]

    if (connector) {
      const provider = await connector.getProvider()
      this.appKit?.addConnector({
        id: ConstantsUtil.AUTH_CONNECTOR_ID,
        type: 'AUTH',
        name: 'w3mAuth',
        provider,
        chain: this.chainNamespace
      })
      this.initAuthConnectorListeners(_authConnector)
    }
  }

  private async initAuthConnectorListeners(
    _authConnector: AdapterOptions<Config>['wagmiConfig']['connectors'][number] | undefined
  ) {
    if (_authConnector) {
      await this.listenAuthConnector(_authConnector)
      await this.listenModal(_authConnector)
    }
  }

  private async listenAuthConnector(
    connector: AdapterOptions<Config>['wagmiConfig']['connectors'][number],
    bypassWindowCheck = false
  ) {
    if (bypassWindowCheck || (typeof window !== 'undefined' && connector)) {
      this.appKit?.setLoading(true)
      const provider = (await connector.getProvider()) as W3mFrameProvider
      const isLoginEmailUsed = provider.getLoginEmailUsed()

      this.appKit?.setLoading(isLoginEmailUsed)

      provider.onRpcRequest((request: W3mFrameTypes.RPCRequest) => {
        if (W3mFrameHelpers.checkIfRequestExists(request)) {
          if (!W3mFrameHelpers.checkIfRequestIsSafe(request)) {
            this.appKit?.handleUnsafeRPCRequest()
          }
        } else {
          this.appKit?.open()
          // eslint-disable-next-line no-console
          console.error(W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_MESSAGE, {
            method: request.method
          })
          setTimeout(() => {
            this.appKit?.showErrorMessage(W3mFrameRpcConstants.RPC_METHOD_NOT_ALLOWED_UI_MESSAGE)
          }, 300)
          provider.rejectRpcRequests()
        }
      })

      provider.onRpcError(() => {
        const isModalOpen = this.appKit?.isOpen()

        if (isModalOpen) {
          if (this.appKit?.isTransactionStackEmpty()) {
            this.appKit?.close()
          } else {
            this.appKit?.popTransactionStack(true)
          }
        }
      })

      provider.onRpcSuccess((_, request) => {
        const isSafeRequest = W3mFrameHelpers.checkIfRequestIsSafe(request)
        if (isSafeRequest) {
          return
        }

        if (this.appKit?.isTransactionStackEmpty()) {
          this.appKit?.close()
        } else {
          this.appKit?.popTransactionStack()
        }
      })

      provider.onNotConnected(() => {
        const isConnected = this.appKit?.getIsConnectedState()
        const connectedConnector = SafeLocalStorage.getItem(
          SafeLocalStorageKeys.CONNECTED_CONNECTOR
        )
        const isConnectedWithAuth = connectedConnector === 'AUTH'

        if (!isConnected && isConnectedWithAuth) {
          this.appKit?.setCaipAddress(undefined, this.chainNamespace)
          this.appKit?.setLoading(false)
        }
      })

      provider.onIsConnected(() => {
        provider.connect()
      })

      provider.onConnect(user => {
        const caipAddress = `eip155:${user.chainId}:${user.address}` as CaipAddress
        this.appKit?.setCaipAddress(caipAddress, this.chainNamespace)
        this.appKit?.setSmartAccountDeployed(
          Boolean(user.smartAccountDeployed),
          this.chainNamespace
        )
        this.appKit?.setPreferredAccountType(
          user.preferredAccountType as W3mFrameTypes.AccountType,
          this.chainNamespace
        )
        this.appKit?.setAllAccounts(
          user.accounts || [
            {
              address: user.address,
              type: (user.preferredAccountType || 'eoa') as W3mFrameTypes.AccountType
            }
          ],
          this.chainNamespace
        )
        StorageUtil.setConnectedConnector('AUTH')
        this.appKit?.setLoading(false)
      })

      provider.onGetSmartAccountEnabledNetworks(networks => {
        this.appKit?.setSmartAccountEnabledNetworks(networks, this.chainNamespace)
      })

      provider.onSetPreferredAccount(({ address, type }) => {
        if (!address) {
          return
        }
        this.appKit?.setPreferredAccountType(type as W3mFrameTypes.AccountType, this.chainNamespace)
        if (this.wagmiConfig) {
          reconnect(this.wagmiConfig, { connectors: [connector] })
        }
      })
    }
  }

  private async listenModal(
    connector: AdapterOptions<Config>['wagmiConfig']['connectors'][number]
  ) {
    const provider = (await connector.getProvider()) as W3mFrameProvider
    this.subscribeState(val => {
      if (!val.open) {
        provider.rejectRpcRequests()
      }
    })
  }
}
