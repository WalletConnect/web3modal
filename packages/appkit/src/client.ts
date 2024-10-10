import type {
  EventsControllerState,
  PublicStateControllerState,
  ThemeControllerState,
  ModalControllerState,
  ConnectedWalletInfo,
  RouterControllerState,
  ChainAdapter,
  SdkVersion,
  AccountControllerState
} from '@reown/appkit-core'
import {
  AccountController,
  BlockchainApiController,
  ConnectionController,
  ConnectorController,
  CoreHelperUtil,
  EventsController,
  ModalController,
  ChainController,
  PublicStateController,
  ThemeController,
  SnackController,
  RouterController,
  EnsController,
  OptionsController,
  AssetUtil,
  ApiController,
  AlertController
} from '@reown/appkit-core'
import { setColorTheme, setThemeVariables } from '@reown/appkit-ui'
import {
  ConstantsUtil,
  type CaipNetwork,
  type ChainNamespace,
  SafeLocalStorage,
  SafeLocalStorageKeys
} from '@reown/appkit-common'
import type { AppKitOptions } from './utils/TypesUtil.js'
import { UniversalAdapterClient } from './universal-adapter/client.js'
import { CaipNetworksUtil, ErrorUtil } from '@reown/appkit-utils'
import type { W3mFrameTypes } from '@reown/appkit-wallet'
import { ProviderUtil } from './store/ProviderUtil.js'

// -- Export Controllers -------------------------------------------------------
export { AccountController }

// -- Types --------------------------------------------------------------------
export interface OpenOptions {
  view: 'Account' | 'Connect' | 'Networks' | 'ApproveTransaction' | 'OnRampProviders'
}

// -- Helpers -------------------------------------------------------------------
let isInitialized = false

// -- Client --------------------------------------------------------------------
export class AppKit {
  private static instance?: AppKit

  public version: SdkVersion

  public adapter?: ChainAdapter

  public adapters?: ChainAdapter[]

  public universalAdapter?: UniversalAdapterClient

  private initPromise?: Promise<void> = undefined

  private caipNetworks: [CaipNetwork, ...CaipNetwork[]]

  private defaultCaipNetwork?: CaipNetwork

  public constructor(
    options: AppKitOptions & {
      adapters?: ChainAdapter[]
    } & {
      sdkVersion: SdkVersion
    }
  ) {
    // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
    this.adapter = options.adapters?.[0] as ChainAdapter
    this.caipNetworks = this.extendCaipNetworks(options)
    this.defaultCaipNetwork = this.extendDefaultCaipNetwork(options)
    this.initControllers(options)
    this.initOrContinue()
    this.version = options.sdkVersion
    // Check on the next thick because wagmiAdapter authConnector is not immediately available
    setTimeout(() => {
      this.checkExistingConnection()
    }, 0)
  }

  public static getInstance() {
    return this.instance
  }

  // -- Public -------------------------------------------------------------------
  public async open(options?: OpenOptions) {
    await this.initOrContinue()
    ModalController.open(options)
  }

  public async close() {
    await this.initOrContinue()
    ModalController.close()
  }

  public setLoading(loading: ModalControllerState['loading']) {
    ModalController.setLoading(loading)
  }

  // -- Adapter Methods ----------------------------------------------------------
  public getError() {
    return ''
  }

  public getChainId() {
    return ChainController.state.activeCaipNetwork?.id
  }

  public switchNetwork(caipNetwork: CaipNetwork) {
    return ChainController.switchActiveNetwork(caipNetwork)
  }

  public getWalletProvider() {
    return ChainController.state.activeChain
      ? ProviderUtil.state.providers[ChainController.state.activeChain]
      : null
  }

  public getWalletProviderType() {
    return ChainController.state.activeChain
      ? ProviderUtil.state.providerIds[ChainController.state.activeChain]
      : null
  }

  public subscribeProvider() {
    return null
  }

  public getThemeMode() {
    return ThemeController.state.themeMode
  }

  public getThemeVariables() {
    return ThemeController.state.themeVariables
  }

  public setThemeMode(themeMode: ThemeControllerState['themeMode']) {
    ThemeController.setThemeMode(themeMode)
    setColorTheme(ThemeController.state.themeMode)
  }

  public setThemeVariables(themeVariables: ThemeControllerState['themeVariables']) {
    ThemeController.setThemeVariables(themeVariables)
    setThemeVariables(ThemeController.state.themeVariables)
  }

  public subscribeTheme(callback: (newState: ThemeControllerState) => void) {
    return ThemeController.subscribe(callback)
  }

  public getWalletInfo() {
    return AccountController.state.connectedWalletInfo
  }

  public subscribeWalletInfo(callback: (newState: ConnectedWalletInfo) => void) {
    return AccountController.subscribeKey('connectedWalletInfo', callback)
  }

  public subscribeShouldUpdateToAddress(callback: (newState?: string) => void) {
    AccountController.subscribeKey('shouldUpdateToAddress', callback)
  }

  public subscribeCaipNetworkChange(callback: (newState?: CaipNetwork) => void) {
    ChainController.subscribeKey('activeCaipNetwork', callback)
  }

  public getState() {
    return PublicStateController.state
  }

  public subscribeState(callback: (newState: PublicStateControllerState) => void) {
    return PublicStateController.subscribe(callback)
  }

  public showErrorMessage(message: string) {
    SnackController.showError(message)
  }

  public showSuccessMessage(message: string) {
    SnackController.showSuccess(message)
  }

  public getEvent() {
    return { ...EventsController.state }
  }

  public subscribeEvents(callback: (newEvent: EventsControllerState) => void) {
    return EventsController.subscribe(callback)
  }

  public replace(route: RouterControllerState['view']) {
    RouterController.replace(route)
  }

  public redirect(route: RouterControllerState['view']) {
    RouterController.push(route)
  }

  public popTransactionStack(cancel?: boolean) {
    RouterController.popTransactionStack(cancel)
  }

  public isOpen() {
    return ModalController.state.open
  }

  public isTransactionStackEmpty() {
    return RouterController.state.transactionStack.length === 0
  }

  public isTransactionShouldReplaceView() {
    return RouterController.state.transactionStack[
      RouterController.state.transactionStack.length - 1
    ]?.replace
  }

  public setStatus: (typeof AccountController)['setStatus'] = (status, chain) => {
    AccountController.setStatus(status, chain)
  }

  public getIsConnectedState = () => Boolean(ChainController.state.activeCaipAddress)

  public setAllAccounts: (typeof AccountController)['setAllAccounts'] = (addresses, chain) => {
    AccountController.setAllAccounts(addresses, chain)
    OptionsController.setHasMultipleAddresses(addresses?.length > 1)
  }

  public addAddressLabel: (typeof AccountController)['addAddressLabel'] = (
    address,
    label,
    chain
  ) => {
    AccountController.addAddressLabel(address, label, chain)
  }

  public removeAddressLabel: (typeof AccountController)['removeAddressLabel'] = (
    address,
    chain
  ) => {
    AccountController.removeAddressLabel(address, chain)
  }

  public getCaipAddress = (chainNamespace?: ChainNamespace) => {
    if (ChainController.state.activeChain === chainNamespace || !chainNamespace) {
      return ChainController.state.activeCaipAddress
    }

    return ChainController.getAccountProp('caipAddress', chainNamespace)
  }

  public getAddress = (chainNamespace?: ChainNamespace) => {
    if (ChainController.state.activeChain === chainNamespace || !chainNamespace) {
      return AccountController.state.address
    }

    return ChainController.getAccountProp('address', chainNamespace)
  }

  public getProvider = () => AccountController.state.provider

  public getPreferredAccountType = () =>
    AccountController.state.preferredAccountType as W3mFrameTypes.AccountType

  public setCaipAddress: (typeof AccountController)['setCaipAddress'] = (caipAddress, chain) => {
    AccountController.setCaipAddress(caipAddress, chain)
  }

  public setProvider: (typeof AccountController)['setProvider'] = (provider, chain) => {
    AccountController.setProvider(provider, chain)
  }

  public setBalance: (typeof AccountController)['setBalance'] = (balance, balanceSymbol, chain) => {
    AccountController.setBalance(balance, balanceSymbol, chain)
  }

  public setProfileName: (typeof AccountController)['setProfileName'] = (profileName, chain) => {
    AccountController.setProfileName(profileName, chain)
  }

  public setProfileImage: (typeof AccountController)['setProfileImage'] = (profileImage, chain) => {
    AccountController.setProfileImage(profileImage, chain)
  }

  public resetAccount: (typeof AccountController)['resetAccount'] = (chain: ChainNamespace) => {
    AccountController.resetAccount(chain)
  }

  public setCaipNetwork: (typeof ChainController)['setActiveCaipNetwork'] = caipNetwork => {
    ChainController.setActiveCaipNetwork(caipNetwork)
  }

  public getCaipNetwork = (chainNamespace?: ChainNamespace) => {
    if (chainNamespace) {
      return ChainController.getRequestedCaipNetworks(chainNamespace).filter(
        c => c.chainNamespace === chainNamespace
      )?.[0]
    }

    return ChainController.state.activeCaipNetwork
  }

  public getCaipNetworkId = <T extends number | string>(): T | undefined => {
    const network = this.getCaipNetwork()

    if (network) {
      return network.id as T
    }

    return undefined
  }

  public getCaipNetworks = (namespace: ChainNamespace) =>
    ChainController.getRequestedCaipNetworks(namespace)

  public getActiveChainNamespace = () => ChainController.state.activeChain

  public setRequestedCaipNetworks: (typeof ChainController)['setRequestedCaipNetworks'] = (
    requestedCaipNetworks,
    chain: ChainNamespace
  ) => {
    ChainController.setRequestedCaipNetworks(requestedCaipNetworks, chain)
  }

  public getApprovedCaipNetworkIds: (typeof ChainController)['getAllApprovedCaipNetworkIds'] = () =>
    ChainController.getAllApprovedCaipNetworkIds()

  public setApprovedCaipNetworksData: (typeof ChainController)['setApprovedCaipNetworksData'] =
    namespace => ChainController.setApprovedCaipNetworksData(namespace)

  public resetNetwork: (typeof ChainController)['resetNetwork'] = (namespace: ChainNamespace) => {
    ChainController.resetNetwork(namespace)
  }

  public setConnectors: (typeof ConnectorController)['setConnectors'] = connectors => {
    const allConnectors = [...ConnectorController.getConnectors(), ...connectors]
    ConnectorController.setConnectors(allConnectors)
  }

  public addConnector: (typeof ConnectorController)['addConnector'] = connector => {
    ConnectorController.addConnector(connector)
  }

  public getConnectors: (typeof ConnectorController)['getConnectors'] = () =>
    ConnectorController.getConnectors()

  public resetWcConnection: (typeof ConnectionController)['resetWcConnection'] = () => {
    ConnectionController.resetWcConnection()
  }

  public fetchIdentity: (typeof BlockchainApiController)['fetchIdentity'] = request =>
    BlockchainApiController.fetchIdentity(request)

  public setAddressExplorerUrl: (typeof AccountController)['setAddressExplorerUrl'] = (
    addressExplorerUrl,
    chain
  ) => {
    AccountController.setAddressExplorerUrl(addressExplorerUrl, chain)
  }

  public setSmartAccountDeployed: (typeof AccountController)['setSmartAccountDeployed'] = (
    isDeployed,
    chain
  ) => {
    AccountController.setSmartAccountDeployed(isDeployed, chain)
  }

  public setConnectedWalletInfo: (typeof AccountController)['setConnectedWalletInfo'] = (
    connectedWalletInfo,
    chain
  ) => {
    AccountController.setConnectedWalletInfo(connectedWalletInfo, chain)
  }

  public setSmartAccountEnabledNetworks: (typeof ChainController)['setSmartAccountEnabledNetworks'] =
    (smartAccountEnabledNetworks, chain) => {
      ChainController.setSmartAccountEnabledNetworks(smartAccountEnabledNetworks, chain)
    }

  public setPreferredAccountType: (typeof AccountController)['setPreferredAccountType'] = (
    preferredAccountType,
    chain
  ) => {
    AccountController.setPreferredAccountType(preferredAccountType, chain)
  }

  public getReownName: (typeof EnsController)['getNamesForAddress'] = address =>
    EnsController.getNamesForAddress(address)

  public resolveReownName = async (name: string) => {
    const wcNameAddress = await EnsController.resolveName(name)
    const networkNameAddresses = Object.values(wcNameAddress?.addresses) || []

    return networkNameAddresses[0]?.address || false
  }

  public setEIP6963Enabled: (typeof OptionsController)['setEIP6963Enabled'] = enabled => {
    OptionsController.setEIP6963Enabled(enabled)
  }

  public setClientId: (typeof BlockchainApiController)['setClientId'] = clientId => {
    BlockchainApiController.setClientId(clientId)
  }

  public getConnectorImage: (typeof AssetUtil)['getConnectorImage'] = connector =>
    AssetUtil.getConnectorImage(connector)

  public handleUnsafeRPCRequest = () => {
    if (this.isOpen()) {
      // If we are on the modal but there is no transaction stack, close the modal
      if (this.isTransactionStackEmpty()) {
        return
      }

      // Check if we need to replace or redirect
      this.redirect('ApproveTransaction')
    } else {
      // If called from outside the modal, open ApproveTransaction
      this.open({ view: 'ApproveTransaction' })
    }
  }

  // -- Private ------------------------------------------------------------------
  private async initControllers(
    options: AppKitOptions & {
      adapters?: ChainAdapter[]
    } & {
      sdkVersion: SdkVersion
    }
  ) {
    OptionsController.setDebug(options.debug)
    OptionsController.setProjectId(options.projectId)
    OptionsController.setSdkVersion(options.sdkVersion)

    if (!options.projectId) {
      AlertController.open(ErrorUtil.ALERT_ERRORS.PROJECT_ID_NOT_CONFIGURED, 'error')

      return
    }

    this.adapters = options.adapters

    this.setMetadata(options)
    this.initializeUniversalAdapter(options)
    this.initializeAdapters(options)
    this.setDefaultNetwork()

    OptionsController.setAllWallets(options.allWallets)
    OptionsController.setIncludeWalletIds(options.includeWalletIds)
    OptionsController.setExcludeWalletIds(options.excludeWalletIds)
    if (options.excludeWalletIds) {
      ApiController.searchWalletByIds({ ids: options.excludeWalletIds })
    }
    OptionsController.setFeaturedWalletIds(options.featuredWalletIds)
    OptionsController.setTokens(options.tokens)
    OptionsController.setTermsConditionsUrl(options.termsConditionsUrl)
    OptionsController.setPrivacyPolicyUrl(options.privacyPolicyUrl)
    OptionsController.setCustomWallets(options.customWallets)
    OptionsController.setFeatures(options.features)
    OptionsController.setEnableWalletConnect(options.enableWalletConnect !== false)
    OptionsController.setEnableWallets(options.enableWallets !== false)

    if (options.metadata) {
      OptionsController.setMetadata(options.metadata)
    }

    if (options.themeMode) {
      ThemeController.setThemeMode(options.themeMode)
    }

    if (options.themeVariables) {
      ThemeController.setThemeVariables(options.themeVariables)
    }

    if (options.disableAppend) {
      OptionsController.setDisableAppend(Boolean(options.disableAppend))
    }

    const evmAdapter = options.adapters?.find(
      adapter => adapter.chainNamespace === ConstantsUtil.CHAIN.EVM
    )

    // Set the SIWE client for EVM chains
    if (evmAdapter) {
      if (options.siweConfig) {
        const { SIWEController } = await import('@reown/appkit-siwe')
        SIWEController.setSIWEClient(options.siweConfig)
      }
    }
  }

  private setMetadata(options: AppKitOptions) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    options.metadata = {
      name: document.getElementsByTagName('title')[0]?.textContent || '',
      description:
        document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.content || '',
      url: window.location.origin,
      icons: [document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href || '']
    }
  }

  private extendCaipNetworks(options: AppKitOptions) {
    const extendedNetworks = CaipNetworksUtil.extendCaipNetworks(options.networks, {
      customNetworkImageUrls: options.chainImages,
      projectId: options.projectId
    })

    return extendedNetworks
  }

  private extendDefaultCaipNetwork(options: AppKitOptions) {
    const defaultNetwork = options.networks.find(n => n.id === options.defaultNetwork?.id)
    const extendedNetwork = defaultNetwork
      ? CaipNetworksUtil.extendCaipNetwork(defaultNetwork, {
          customNetworkImageUrls: options.chainImages,
          projectId: options.projectId
        })
      : undefined

    return extendedNetwork
  }

  private initializeUniversalAdapter(options: AppKitOptions) {
    const extendedOptions = {
      ...options,
      networks: this.caipNetworks,
      defaultNetwork: this.defaultCaipNetwork
    }

    this.universalAdapter = new UniversalAdapterClient(extendedOptions)
    ChainController.initializeUniversalAdapter(this.universalAdapter, options.adapters || [])
    this.universalAdapter.construct?.(this, extendedOptions)
  }

  private initializeAdapters(options: AppKitOptions) {
    const extendedOptions = {
      ...options,
      networks: this.caipNetworks,
      defaultNetwork: this.defaultCaipNetwork
    }

    ChainController.initialize(options.adapters || [])
    options.adapters?.forEach(adapter => {
      // @ts-expect-error will introduce construct later
      adapter.construct?.(this, extendedOptions)
    })
  }

  private setDefaultNetwork() {
    const previousNetwork = SafeLocalStorage.getItem(SafeLocalStorageKeys.ACTIVE_CAIP_NETWORK_ID)
    const caipNetwork = previousNetwork
      ? this.caipNetworks.find(n => n.caipNetworkId === previousNetwork)
      : undefined

    const network = caipNetwork || this.defaultCaipNetwork || this.caipNetworks[0]
    ChainController.setActiveCaipNetwork(network)
  }

  private async initOrContinue() {
    if (!this.initPromise && !isInitialized && CoreHelperUtil.isClient()) {
      isInitialized = true
      this.initPromise = new Promise<void>(async resolve => {
        await Promise.all([
          import('@reown/appkit-ui'),
          import('@reown/appkit-scaffold-ui/w3m-modal')
        ])
        const modal = document.createElement('w3m-modal')
        if (!OptionsController.state.disableAppend) {
          document.body.insertAdjacentElement('beforeend', modal)
        }
        resolve()
      })
    }

    return this.initPromise
  }

  private async checkExistingConnection() {
    try {
      if (!CoreHelperUtil.isTelegram()) {
        return
      }
      const socialProviderToConnect = SafeLocalStorage.getItem(
        SafeLocalStorageKeys.SOCIAL_PROVIDER
      ) as AccountControllerState['socialProvider']
      if (!socialProviderToConnect) {
        return
      }
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return
      }
      const url = new URL(window.location.href)
      const resultUri = url.searchParams.get('result_uri')
      if (!resultUri) {
        return
      }
      AccountController.setSocialProvider(
        socialProviderToConnect,
        ChainController.state.activeChain
      )
      const authConnector = ConnectorController.getAuthConnector()
      if (socialProviderToConnect && authConnector) {
        this.setLoading(true)
        await authConnector.provider.connectSocial(resultUri)
        await ConnectionController.connectExternal(authConnector, authConnector.chain)
        SafeLocalStorage.removeItem(SafeLocalStorageKeys.SOCIAL_PROVIDER)
        EventsController.sendEvent({
          type: 'track',
          event: 'SOCIAL_LOGIN_SUCCESS',
          properties: { provider: socialProviderToConnect }
        })
      }
    } catch (error) {
      this.setLoading(false)
      // eslint-disable-next-line no-console
      console.error('checkExistingConnection error', error)
    }

    try {
      const url = new URL(window.location.href)
      // Remove the 'result_uri' parameter
      url.searchParams.delete('result_uri')
      // Update the URL without reloading the page
      window.history.replaceState({}, document.title, url.toString())
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
    }
  }
}
