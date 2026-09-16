import { useCallback, useEffect, useState } from 'react'

import { useSnapshot } from 'valtio'

import {
  type CaipNetwork,
  type ChainNamespace,
  type Connection,
  ConstantsUtil
} from '@reown/appkit-common'

import { AlertController } from '../src/controllers/AlertController.js'
import { ApiController } from '../src/controllers/ApiController.js'
import { AssetController } from '../src/controllers/AssetController.js'
import { BlockchainApiController } from '../src/controllers/BlockchainApiController.js'
import { ChainController } from '../src/controllers/ChainController.js'
import { ConnectionController } from '../src/controllers/ConnectionController.js'
import { ConnectorController } from '../src/controllers/ConnectorController.js'
import { OptionsController } from '../src/controllers/OptionsController.js'
import { ProviderController } from '../src/controllers/ProviderController.js'
import { PublicStateController } from '../src/controllers/PublicStateController.js'
import { ConnectUtil, type WalletItem } from '../src/utils/ConnectUtil.js'
import { ConnectionControllerUtil } from '../src/utils/ConnectionControllerUtil.js'
import { ConnectorControllerUtil } from '../src/utils/ConnectorControllerUtil.js'
import { CoreHelperUtil } from '../src/utils/CoreHelperUtil.js'
import { type ConnectOptions, type FetchWalletsOptions } from '../src/utils/HeadlessWalletUtil.js'
import { MobileWalletUtil } from '../src/utils/MobileWallet.js'
import type {
  UseAppKitAccountReturn,
  UseAppKitNetworkReturn,
  WcWallet
} from '../src/utils/TypeUtil.js'
import { AssetUtil, StorageUtil } from './utils.js'

// -- Types ------------------------------------------------------------
export type { Connection } from '@reown/appkit-common'

interface DisconnectParams {
  id?: string
  namespace?: ChainNamespace
}

interface UseAppKitConnectionProps {
  namespace?: ChainNamespace
  onSuccess?: (params: {
    address: string
    namespace: ChainNamespace
    hasSwitchedAccount: boolean
    hasSwitchedWallet: boolean
    hasDeletedWallet: boolean
  }) => void
  onError?: (error: Error) => void
}

interface SwitchConnectionParams {
  connection: Connection
  address?: string
}

interface DeleteRecentConnectionProps {
  address: string
  connectorId: string
}

/*
 * `ConnectOptions` / `FetchWalletsOptions` are defined once in `HeadlessWalletUtil`
 * (the framework-neutral home) and re-exported here for the hook's public surface.
 */
export type { ConnectOptions, FetchWalletsOptions } from '../src/utils/HeadlessWalletUtil.js'

// -- Hooks ------------------------------------------------------------
export function useAppKitProvider<T>(chainNamespace: ChainNamespace) {
  const { providers, providerIds } = useSnapshot(ProviderController.state)

  const walletProvider = providers[chainNamespace] as T
  const walletProviderType = providerIds[chainNamespace]

  return {
    walletProvider,
    walletProviderType
  }
}

export function useAppKitNetworkCore(): Pick<
  UseAppKitNetworkReturn,
  'caipNetwork' | 'chainId' | 'caipNetworkId' | 'approvedCaipNetworkIds' | 'supportsAllNetworks'
> {
  const { activeCaipNetwork, activeChain, chains } = useSnapshot(ChainController.state)

  const networkState = activeChain ? chains.get(activeChain)?.networkState : undefined

  return {
    caipNetwork: activeCaipNetwork as CaipNetwork,
    chainId: activeCaipNetwork?.id,
    caipNetworkId: activeCaipNetwork?.caipNetworkId,
    approvedCaipNetworkIds: networkState?.approvedCaipNetworkIds,
    supportsAllNetworks: networkState?.supportsAllNetworks ?? true
  }
}

export function useAppKitAccount(options?: { namespace?: ChainNamespace }): UseAppKitAccountReturn {
  const state = useSnapshot(ChainController.state)
  const { activeConnectorIds } = useSnapshot(ConnectorController.state)
  const { connections: connectionsByNamespace } = useSnapshot(ConnectionController.state)
  const chainNamespace = options?.namespace || state.activeChain

  if (!chainNamespace) {
    return {
      allAccounts: [],
      address: undefined,
      caipAddress: undefined,
      status: undefined,
      isConnected: false,
      embeddedWalletInfo: undefined
    }
  }

  const chainAccountState = state.chains.get(chainNamespace)?.accountState
  const authConnector = ConnectorController.getAuthConnector(chainNamespace)
  const activeConnectorId = activeConnectorIds[chainNamespace]
  const connections = connectionsByNamespace.get(chainNamespace) ?? []
  const allAccounts = connections.flatMap(connection => {
    const { caipNetwork } = connection

    return caipNetwork
      ? connection.accounts.map(({ address, type, publicKey }) =>
          CoreHelperUtil.createAccount({
            caipAddress: `${caipNetwork.caipNetworkId}:${address}`,
            type: type || 'eoa',
            publicKey
          })
        )
      : []
  })

  return {
    allAccounts,
    caipAddress: chainAccountState?.caipAddress,
    address: CoreHelperUtil.getPlainAddress(chainAccountState?.caipAddress),
    isConnected: Boolean(chainAccountState?.caipAddress),
    status: chainAccountState?.status,
    embeddedWalletInfo:
      authConnector && activeConnectorId === ConstantsUtil.CONNECTOR_ID.AUTH
        ? {
            user: chainAccountState?.user
              ? {
                  ...chainAccountState.user,
                  /*
                   * Getting the username from the chain controller works well for social logins,
                   * but Farcaster uses a different connection flow and doesn’t emit the username via events.
                   * Since the username is stored in local storage before the chain controller updates,
                   * it’s safe to use the local storage value here.
                   */
                  username: StorageUtil.getConnectedSocialUsername()
                }
              : undefined,
            authProvider: chainAccountState?.socialProvider || 'email',
            accountType: chainAccountState?.preferredAccountType,
            isSmartAccountDeployed: Boolean(chainAccountState?.smartAccountDeployed)
          }
        : undefined
  }
}

export function useDisconnect() {
  async function disconnect(props?: DisconnectParams) {
    await ConnectionController.disconnect(props)
  }

  return { disconnect }
}

export function useAppKitConnections(namespace?: ChainNamespace) {
  // Snapshots to trigger re-renders on state changes
  useSnapshot(ConnectionController.state)
  useSnapshot(ConnectorController.state)
  useSnapshot(AssetController.state)

  const { activeChain } = useSnapshot(ChainController.state)
  const { remoteFeatures } = useSnapshot(OptionsController.state)

  const chainNamespace = namespace ?? activeChain

  const isMultiWalletEnabled = Boolean(remoteFeatures?.multiWallet)

  if (!chainNamespace) {
    throw new Error('No namespace found')
  }

  const formatConnection = useCallback((connection: Connection) => {
    const connector = ConnectorController.getConnectorById(connection.connectorId)

    const name = ConnectorController.getConnectorName(connector?.name)
    const icon = AssetUtil.getConnectorImage(connector)
    const networkImage = AssetUtil.getNetworkImage(connection.caipNetwork)

    return {
      name,
      icon,
      networkIcon: networkImage,
      ...connection
    }
  }, [])

  const { connections, recentConnections } =
    ConnectionControllerUtil.getConnectionsData(chainNamespace)

  if (!isMultiWalletEnabled) {
    AlertController.open(
      ConstantsUtil.REMOTE_FEATURES_ALERTS.MULTI_WALLET_NOT_ENABLED.CONNECTIONS_HOOK,
      'info'
    )

    return {
      connections: [],
      recentConnections: []
    }
  }

  return {
    connections: connections.map(formatConnection),
    recentConnections: recentConnections.map(formatConnection)
  }
}

export function useAppKitConnection({ namespace, onSuccess, onError }: UseAppKitConnectionProps) {
  const { connections, isSwitchingConnection } = useSnapshot(ConnectionController.state)
  const { activeConnectorIds } = useSnapshot(ConnectorController.state)
  const { activeChain } = useSnapshot(ChainController.state)
  const { remoteFeatures } = useSnapshot(OptionsController.state)

  const chainNamespace = namespace ?? activeChain

  if (!chainNamespace) {
    throw new Error('No namespace found')
  }

  const isMultiWalletEnabled = Boolean(remoteFeatures?.multiWallet)

  const switchConnection = useCallback(
    async ({ connection: _connection, address }: SwitchConnectionParams) => {
      try {
        ConnectionController.setIsSwitchingConnection(true)

        await ConnectionController.switchConnection({
          connection: _connection,
          address,
          namespace: chainNamespace,
          onChange({
            address: newAddress,
            namespace: newNamespace,
            hasSwitchedAccount,
            hasSwitchedWallet
          }) {
            onSuccess?.({
              address: newAddress,
              namespace: newNamespace,
              hasSwitchedAccount,
              hasSwitchedWallet,
              hasDeletedWallet: false
            })
          }
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Something went wrong')
        onError?.(error)
      } finally {
        ConnectionController.setIsSwitchingConnection(false)
      }
    },
    [chainNamespace, onSuccess, onError]
  )

  const deleteConnection = useCallback(
    ({ address, connectorId }: DeleteRecentConnectionProps) => {
      StorageUtil.deleteAddressFromConnection({ connectorId, address, namespace: chainNamespace })
      ConnectionController.syncStorageConnections()
      onSuccess?.({
        address,
        namespace: chainNamespace,
        hasSwitchedAccount: false,
        hasSwitchedWallet: false,
        hasDeletedWallet: true
      })
    },
    [chainNamespace]
  )

  if (!isMultiWalletEnabled) {
    AlertController.open(
      ConstantsUtil.REMOTE_FEATURES_ALERTS.MULTI_WALLET_NOT_ENABLED.CONNECTION_HOOK,
      'info'
    )

    return {
      connection: undefined,
      isPending: false,
      switchConnection: () => Promise.resolve(undefined),
      deleteConnection: () => ({})
    }
  }

  const connectorId = activeConnectorIds[chainNamespace]
  const connList = connections.get(chainNamespace)
  const connection = connList?.find(c => c.connectorId.toLowerCase() === connectorId?.toLowerCase())

  return {
    connection,
    isPending: isSwitchingConnection,
    switchConnection,
    deleteConnection
  }
}

export interface UseAppKitWalletsReturn {
  /**
   * List of wallets for the initial connect view including WalletConnect wallet and injected wallets together. If user doesn't have any injected wallets, it'll fill the list with most ranked WalletConnect wallets.
   */
  wallets: WalletItem[]

  /**
   * List of WalletConnect wallets from Wallet Guide API. Useful to display all available WalletConnect wallets in a separate Search Wallets view.
   * @see https://walletguide.walletconnect.com/.
   */
  wcWallets: WalletItem[]

  /**
   * Boolean that indicates if WalletConnect wallets are being fetched.
   */
  isFetchingWallets: boolean

  /**
   * Boolean that indicates if a WalletConnect URI is being fetched.
   */
  isFetchingWcUri: boolean

  /**
   * Boolean that indicates if the AppKit is initialized. It's useful to render a fallback UI when the AppKit initializes and detects all injected wallets.
   */
  isInitialized: boolean

  /**
   * The current WalletConnect URI for QR code display. This is set when connecting to a WalletConnect wallet. Reset with resetWcUri().
   */
  wcUri?: string

  /**
   * The wallet currently being connected to. This is set when a connection is initiated and cleared when it completes or fails. For WalletConnect wallets, resetWcUri() should be called to clear the state.
   */
  connectingWallet?: WalletItem

  /**
   * The current page number of WalletConnect wallets.
   */
  page: number

  /**
   * The total number of available WalletConnect wallets based on the AppKit configurations and given parameters.
   */
  count: number

  /**
   * Function to fetch WalletConnect wallets from the explorer API. Allows to list, search and paginate through the wallets.
   * @param options - Options for fetching wallets
   */
  fetchWallets: (options?: FetchWalletsOptions) => Promise<void>

  /**
   * Function to connect to a wallet.
   * - For WalletConnect wallets: initiates WC connection and returns the URI with the `wcUri` state.
   * - For injected connectors: triggers the extension/wallet directly.
   *
   * @param wallet - The wallet item to connect to
   * @param namespace - Optional chain namespace
   * @param options - Optional connect options (e.g., wcPayUrl for WalletConnect Pay)
   * @returns Promise that resolves when connection completes or rejects on error
   */
  connect: (
    wallet: WalletItem,
    namespace?: ChainNamespace,
    options?: ConnectOptions
  ) => Promise<void>

  /**
   * Function to reset the WC URI. Useful to keep `connectingWallet` state sync with the WC URI. Can be called when the QR code is closed.
   */
  resetWcUri: () => void

  /**
   * Clears the connectingWallet state in PublicStateController.
   */
  resetConnectingWallet: () => void

  /**
   * Pre-fetches the WalletConnect URI. Call this when user selects a wallet on mobile
   * to ensure the URI is ready when they click "Open". This enables synchronous deeplink
   * triggering which is required for iOS Safari.
   *
   * **Mobile two-step flow:**
   * 1. User selects wallet → call `getWcUri()` → button shows loading via `isFetchingWcUri`
   * 2. User clicks "Open" → `connect()` triggers deeplink synchronously (URI is ready)
   *
   * @see PR #5456 for context on iOS deeplink requirements
   */
  getWcUri: () => Promise<void>

  /**
   * Boolean that indicates if there was an error fetching the WalletConnect URI.
   */
  wcError: boolean

  /**
   * The WalletConnect relay client ID. Set after a WalletConnect connection is established.
   */
  wcClientId: string | null
}

/**
 * Headless hook for wallet connection.
 * Provides all the data and functions needed to build a custom connect UI.
 */
export function useAppKitWallets(): UseAppKitWalletsReturn {
  const { features, remoteFeatures } = useSnapshot(OptionsController.state)
  const isHeadlessEnabled = Boolean(features?.headless && remoteFeatures?.headless)

  const [isFetchingWallets, setIsFetchingWallets] = useState(false)
  const [currentWcPayUrl, setCurrentWcPayUrl] = useState<string | undefined>(undefined)
  const { wcUri, wcFetchingUri, wcError } = useSnapshot(ConnectionController.state)
  const {
    wallets: wcAllWallets,
    search: wcSearchWallets,
    page,
    count
  } = useSnapshot(ApiController.state)
  const { initialized, connectingWallet } = useSnapshot(PublicStateController.state)
  const { clientId: wcClientId } = useSnapshot(BlockchainApiController.state)

  // Alert if headless is not enabled
  useEffect(() => {
    if (
      initialized &&
      remoteFeatures?.headless !== undefined &&
      (!isHeadlessEnabled || !remoteFeatures?.headless)
    ) {
      AlertController.open(
        ConstantsUtil.REMOTE_FEATURES_ALERTS.HEADLESS_NOT_ENABLED.DEFAULT,
        'info'
      )
    }
  }, [initialized, isHeadlessEnabled, remoteFeatures?.headless])

  /**
   * Pre-fetches the WalletConnect URI. Call this when user selects a wallet on mobile.
   * Uses 'auto' cache to reuse existing valid URI or fetch new one if expired.
   */
  async function getWcUri(options?: { wcPayUrl?: string }) {
    resetWcUri()
    setCurrentWcPayUrl(options?.wcPayUrl)
    await ConnectionController.connectWalletConnect({ cache: 'auto' })
  }

  async function fetchWallets(fetchOptions?: FetchWalletsOptions) {
    setIsFetchingWallets(true)
    try {
      const { query, ...options } = fetchOptions ?? {}
      const search = options.search ?? query

      if (search) {
        await ApiController.searchWallet({ ...options, search })
      } else {
        ApiController.state.search = []
        await ApiController.fetchWalletsByPage({ page: 1, ...options })
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch WalletConnect wallets:', error)
    } finally {
      setIsFetchingWallets(false)
    }
  }

  /**
   * Connects to the selected wallet.
   *
   * Handles injected wallets, API wallets (from "All Wallets" list), and mobile deeplinks.
   * For API wallets without pre-populated connectors, performs a fallback lookup using
   * the wallet's ID via `explorerId` matching.
   *
   * Note: Coinbase from "All Wallets" has empty connectors array. The fallback finds the
   * Base Account connector (which has explorerId set to Coinbase's API ID) to open the
   * Coinbase web wallet instead of falling through to WalletConnect.
   *
   * @param _wallet - The wallet item to connect to
   * @param namespace - Optional chain namespace (falls back to active chain)
   * @param options - Optional connection options (e.g., wcPayUrl)
   */
  async function connect(
    _wallet: WalletItem,
    namespace?: ChainNamespace,
    options?: ConnectOptions
  ) {
    setCurrentWcPayUrl(options?.wcPayUrl)
    PublicStateController.set({ connectingWallet: _wallet })
    const isMobileDevice = CoreHelperUtil.isMobile()

    // Fall back to active chain if namespace is not provided (matches headful behavior)
    const activeNamespace = namespace || ChainController.state.activeChain

    try {
      const walletConnector = _wallet?.connectors.find(c => c.chain === activeNamespace)

      const connector =
        walletConnector && activeNamespace
          ? ConnectorController.getConnector({
              id: walletConnector?.id,
              namespace: activeNamespace
            })
          : undefined

      /*
       * Fallback connector lookup for API wallets (e.g., from "All Wallets" list).
       *
       * API wallets have an empty `connectors` array, so we try to find a connector
       * using the wallet's API ID directly. This is crucial for Coinbase/Base wallet:
       * - The Base Account connector has `explorerId` set to Coinbase's API wallet ID
       * - `ConnectorController.getConnector` checks both `c.id === id` and `c.explorerId === id`
       * - This allows us to find and use the Base Account connector to open the web wallet
       *
       * This matches the headful AppKit behavior in `ConnectorController.selectWalletConnector`.
       */
      const fallbackConnector =
        !connector && activeNamespace
          ? ConnectorController.getConnector({ id: _wallet?.id, namespace: activeNamespace })
          : undefined

      if (_wallet?.isInjected && connector) {
        await ConnectorControllerUtil.connectExternal(connector)
      } else if (fallbackConnector) {
        // Use connector found by wallet ID (e.g., Base Account connector for Coinbase web wallet)
        await ConnectorControllerUtil.connectExternal(fallbackConnector)
      } else if (isMobileDevice) {
        const wcWallet = ConnectUtil.mapWalletItemToWcWallet(_wallet)

        if (wcWallet.mobile_link) {
          ConnectionControllerUtil.assertWcUriForDeeplink()
          ConnectionControllerUtil.onConnectMobile(wcWallet, options?.wcPayUrl)
        } else {
          MobileWalletUtil.handleMobileDeeplinkRedirect(_wallet.id, activeNamespace, {
            isCoinbaseDisabled: OptionsController.state.enableCoinbase === false
          })
        }
      } else {
        await ConnectionController.connectWalletConnect({ cache: 'never' })
      }
    } catch (error) {
      PublicStateController.set({ connectingWallet: undefined })
      throw error
    }
  }

  function resetWcUri() {
    ConnectionController.resetUri()
    ConnectionController.setWcLinking(undefined)
    setCurrentWcPayUrl(undefined)
  }

  function resetConnectingWallet() {
    PublicStateController.set({ connectingWallet: undefined })
  }

  // Enhance wcUri with pay param if wcPayUrl was provided
  const enhancedWcUri =
    currentWcPayUrl && wcUri ? CoreHelperUtil.appendPayToUri(wcUri, currentWcPayUrl) : wcUri

  if (!isHeadlessEnabled || !remoteFeatures?.headless) {
    return {
      wallets: [],
      wcWallets: [],
      isFetchingWallets: false,
      isFetchingWcUri: false,
      isInitialized: false,
      wcUri: undefined,
      wcError: false,
      connectingWallet: undefined,
      page: 0,
      count: 0,
      connect: () => Promise.resolve(),
      fetchWallets: () => Promise.resolve(),
      resetWcUri,
      resetConnectingWallet,
      getWcUri: () => Promise.resolve(),
      wcClientId: null
    }
  }

  return {
    wallets: ConnectUtil.getInitialWallets(),
    wcWallets: ConnectUtil.getWalletConnectWallets(
      wcAllWallets as WcWallet[],
      wcSearchWallets as WcWallet[]
    ),
    isFetchingWallets,
    isFetchingWcUri: wcFetchingUri,
    isInitialized: initialized,
    wcUri: enhancedWcUri,
    wcError: wcError ?? false,
    connectingWallet: connectingWallet as WalletItem | undefined,
    page,
    count,
    connect,
    fetchWallets,
    resetWcUri,
    resetConnectingWallet,
    getWcUri,
    wcClientId
  }
}
