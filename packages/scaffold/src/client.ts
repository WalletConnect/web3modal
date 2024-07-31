import { ConstantsUtil, type Chain } from '@web3modal/common'
import type {
  CaipNetwork,
  ConnectedWalletInfo,
  ConnectionControllerClient,
  EventsControllerState,
  ModalControllerState,
  NetworkControllerClient,
  NetworkControllerState,
  OptionsControllerState,
  PublicStateControllerState,
  RouterControllerState,
  ThemeControllerState,
  ThemeMode,
  ThemeVariables
} from '@web3modal/core'
import {
  AccountController,
  ApiController,
  BlockchainApiController,
  ChainController,
  ConnectionController,
  ConnectorController,
  CoreHelperUtil,
  EnsController,
  EventsController,
  ModalController,
  NetworkController,
  OptionsController,
  PublicStateController,
  RouterController,
  SnackController,
  ThemeController
} from '@web3modal/core'
import type { SIWEControllerClient } from '@web3modal/siwe'
import { setColorTheme, setThemeVariables } from '@web3modal/ui'

// -- Helpers -------------------------------------------------------------------
let isInitialized = false

// -- Types ---------------------------------------------------------------------
export interface LibraryOptions {
  projectId: OptionsControllerState['projectId']
  themeMode?: ThemeMode
  themeVariables?: ThemeVariables
  allWallets?: OptionsControllerState['allWallets']
  includeWalletIds?: OptionsControllerState['includeWalletIds']
  excludeWalletIds?: OptionsControllerState['excludeWalletIds']
  featuredWalletIds?: OptionsControllerState['featuredWalletIds']
  defaultChain?: NetworkControllerState['caipNetwork']
  tokens?: OptionsControllerState['tokens']
  termsConditionsUrl?: OptionsControllerState['termsConditionsUrl']
  privacyPolicyUrl?: OptionsControllerState['privacyPolicyUrl']
  customWallets?: OptionsControllerState['customWallets']
  isUniversalProvider?: OptionsControllerState['isUniversalProvider']
  enableAnalytics?: OptionsControllerState['enableAnalytics']
  enableAuth?: OptionsControllerState['enableAuth']
  metadata?: OptionsControllerState['metadata']
  enableOnramp?: OptionsControllerState['enableOnramp']
  disableAppend?: OptionsControllerState['disableAppend']
  allowUnsupportedChain?: NetworkControllerState['allowUnsupportedChain']
  _sdkVersion: OptionsControllerState['sdkVersion']
  enableEIP6963?: OptionsControllerState['enableEIP6963']
  enableSwaps?: OptionsControllerState['enableEIP6963']
}

export interface ScaffoldOptions extends LibraryOptions {
  chain: Chain
  networkControllerClient: NetworkControllerClient
  connectionControllerClient: ConnectionControllerClient
  siweControllerClient?: SIWEControllerClient
}

export interface OpenOptions {
  view: 'Account' | 'Connect' | 'Networks' | 'ApproveTransaction' | 'OnRampProviders'
}

// -- Client --------------------------------------------------------------------
export class Web3ModalScaffold {
  private initPromise?: Promise<void> = undefined

  public constructor(options: ScaffoldOptions) {
    this.initControllers(options)
    this.initOrContinue()
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
    NetworkController.subscribeKey('caipNetwork', callback)
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

  // -- Protected ----------------------------------------------------------------
  protected replace(route: RouterControllerState['view']) {
    RouterController.replace(route)
  }

  protected redirect(route: RouterControllerState['view']) {
    RouterController.push(route)
  }

  protected popTransactionStack(cancel?: boolean) {
    RouterController.popTransactionStack(cancel)
  }

  protected isOpen() {
    return ModalController.state.open
  }

  protected isTransactionStackEmpty() {
    return RouterController.state.transactionStack.length === 0
  }

  protected isTransactionShouldReplaceView() {
    return RouterController.state.transactionStack[
      RouterController.state.transactionStack.length - 1
    ]?.replace
  }

  protected setIsConnected: (typeof AccountController)['setIsConnected'] = (isConnected, chain) => {
    AccountController.setIsConnected(isConnected, chain)
  }

  protected getIsConnectedState = () => AccountController.state.isConnected

  protected setAllAccounts: (typeof AccountController)['setAllAccounts'] = (addresses = []) => {
    AccountController.setAllAccounts(addresses)
    OptionsController.setHasMultipleAddresses(addresses?.length > 1)
  }

  protected addAddressLabel: (typeof AccountController)['addAddressLabel'] = (address, label) => {
    AccountController.addAddressLabel(address, label)
  }

  protected removeAddressLabel: (typeof AccountController)['removeAddressLabel'] = address => {
    AccountController.removeAddressLabel(address)
  }

  protected getCaipAddress = () => AccountController.state.caipAddress

  protected setCaipAddress: (typeof AccountController)['setCaipAddress'] = (caipAddress, chain) => {
    AccountController.setCaipAddress(caipAddress, chain)
  }

  protected setBalance: (typeof AccountController)['setBalance'] = (
    balance,
    balanceSymbol,
    chain
  ) => {
    AccountController.setBalance(balance, balanceSymbol, chain)
  }

  protected setProfileName: (typeof AccountController)['setProfileName'] = (profileName, chain) => {
    AccountController.setProfileName(profileName, chain)
  }

  protected setProfileImage: (typeof AccountController)['setProfileImage'] = (
    profileImage,
    chain
  ) => {
    AccountController.setProfileImage(profileImage, chain)
  }

  protected resetAccount: (typeof AccountController)['resetAccount'] = chain => {
    AccountController.resetAccount(chain)
  }

  protected setCaipNetwork: (typeof NetworkController)['setCaipNetwork'] = caipNetwork => {
    NetworkController.setCaipNetwork(caipNetwork)
  }

  protected getCaipNetwork = () => NetworkController.state.caipNetwork

  protected getIsSiweEnabled = () => OptionsController.state.isSiweEnabled

  protected setRequestedCaipNetworks: (typeof NetworkController)['setRequestedCaipNetworks'] = (
    requestedCaipNetworks,
    chain
  ) => {
    NetworkController.setRequestedCaipNetworks(requestedCaipNetworks, chain)
  }

  protected getApprovedCaipNetworkIds: (typeof NetworkController)['getApprovedCaipNetworkIds'] =
    () => NetworkController.getApprovedCaipNetworkIds()

  protected setApprovedCaipNetworksData: (typeof NetworkController)['setApprovedCaipNetworksData'] =
    () => NetworkController.setApprovedCaipNetworksData()

  protected resetNetwork: (typeof NetworkController)['resetNetwork'] = () => {
    NetworkController.resetNetwork()
  }

  protected setConnectors: (typeof ConnectorController)['setConnectors'] = connectors => {
    ConnectorController.setConnectors(connectors)
  }

  protected addConnector: (typeof ConnectorController)['addConnector'] = connector => {
    ConnectorController.addConnector(connector)
  }

  protected getConnectors: (typeof ConnectorController)['getConnectors'] = () =>
    ConnectorController.getConnectors()

  protected resetWcConnection: (typeof ConnectionController)['resetWcConnection'] = () => {
    ConnectionController.resetWcConnection()
  }

  protected fetchIdentity: (typeof BlockchainApiController)['fetchIdentity'] = request =>
    BlockchainApiController.fetchIdentity(request)

  protected setAddressExplorerUrl: (typeof AccountController)['setAddressExplorerUrl'] = (
    addressExplorerUrl,
    chain
  ) => {
    AccountController.setAddressExplorerUrl(addressExplorerUrl, chain)
  }

  protected setSmartAccountDeployed: (typeof AccountController)['setSmartAccountDeployed'] = (
    isDeployed,
    chain
  ) => {
    AccountController.setSmartAccountDeployed(isDeployed, chain)
  }

  protected setConnectedWalletInfo: (typeof AccountController)['setConnectedWalletInfo'] = (
    connectedWalletInfo,
    chain
  ) => {
    AccountController.setConnectedWalletInfo(connectedWalletInfo, chain)
  }

  protected setSmartAccountEnabledNetworks: (typeof NetworkController)['setSmartAccountEnabledNetworks'] =
    (smartAccountEnabledNetworks, chain) => {
      NetworkController.setSmartAccountEnabledNetworks(smartAccountEnabledNetworks, chain)
    }

  protected setPreferredAccountType: (typeof AccountController)['setPreferredAccountType'] = (
    preferredAccountType,
    chain
  ) => {
    AccountController.setPreferredAccountType(preferredAccountType, chain)
  }

  protected getWalletConnectName: (typeof EnsController)['getNamesForAddress'] = address =>
    EnsController.getNamesForAddress(address)

  protected resolveWalletConnectName = async (name: string) => {
    const trimmedName = name.replace(ConstantsUtil.WC_NAME_SUFFIX, '')
    const wcNameAddress = await EnsController.resolveName(trimmedName)
    const networkNameAddresses = Object.values(wcNameAddress?.addresses) || []

    return networkNameAddresses[0]?.address || false
  }

  protected setEIP6963Enabled: (typeof OptionsController)['setEIP6963Enabled'] = enabled => {
    OptionsController.setEIP6963Enabled(enabled)
  }

  protected setClientId: (typeof BlockchainApiController)['setClientId'] = clientId => {
    BlockchainApiController.setClientId(clientId)
    ConnectionController.setClientId(clientId)
  }

  // -- Private ------------------------------------------------------------------
  private async initControllers(options: ScaffoldOptions) {
    ChainController.initialize([
      {
        networkControllerClient: options.networkControllerClient,
        connectionControllerClient: options.connectionControllerClient,
        chain: options.chain
      }
    ])
    NetworkController.setDefaultCaipNetwork(options.defaultChain, options.chain)

    OptionsController.setProjectId(options.projectId)
    OptionsController.setAllWallets(options.allWallets)
    OptionsController.setIncludeWalletIds(options.includeWalletIds)
    OptionsController.setExcludeWalletIds(options.excludeWalletIds)
    OptionsController.setFeaturedWalletIds(options.featuredWalletIds)
    OptionsController.setTokens(options.tokens)
    OptionsController.setTermsConditionsUrl(options.termsConditionsUrl)
    OptionsController.setPrivacyPolicyUrl(options.privacyPolicyUrl)
    OptionsController.setEnableAnalytics(options.enableAnalytics)
    OptionsController.setEnableAuth(options.enableAuth)
    OptionsController.setCustomWallets(options.customWallets)
    OptionsController.setIsUniversalProvider(options.isUniversalProvider)
    OptionsController.setSdkVersion(options._sdkVersion)
    // Enabled by default
    OptionsController.setOnrampEnabled(options.enableOnramp !== false)
    OptionsController.setEnableSwaps(
      options.chain === ConstantsUtil.CHAIN.EVM && options.enableSwaps !== false
    )

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

    if (options.allowUnsupportedChain) {
      NetworkController.setAllowUnsupportedChain(options.allowUnsupportedChain)
    }
    const { isAnalyticsEnabled, isAppKitAuthEnabled } = await ApiController.fetchProjectConfig()

    // Only set the analytics state if it's not already set through the SDK config
    if (options.enableAnalytics === undefined) {
      OptionsController.setEnableAnalytics(isAnalyticsEnabled)
    }

    // Only set the AppKit Auth state if it's not already set through the SDK config
    if (options.enableAuth === undefined) {
      OptionsController.setEnableAuth(isAppKitAuthEnabled)
    }

    if (options.siweControllerClient || OptionsController.state.enableAuth) {
      const { SIWEController, appKitAuthConfig } = await import('@web3modal/siwe')

      const siweClient = options.siweControllerClient ?? appKitAuthConfig
      SIWEController.setSIWEClient(siweClient)
      const session = await siweClient.getSession()
      OptionsController.setIsSiweEnabled(true)
      if (session?.address && session?.chainId) {
        SIWEController.setStatus('success')
        SIWEController.setSession(session)
      }
    }
  }

  private async initOrContinue() {
    if (!this.initPromise && !isInitialized && CoreHelperUtil.isClient()) {
      isInitialized = true
      this.initPromise = new Promise<void>(async resolve => {
        await Promise.all([import('@web3modal/ui'), import('@web3modal/scaffold-ui/w3m-modal')])
        const modal = document.createElement('w3m-modal')
        if (!OptionsController.state.disableAppend) {
          document.body.insertAdjacentElement('beforeend', modal)
        }
        resolve()
      })
    }

    return this.initPromise
  }
}
