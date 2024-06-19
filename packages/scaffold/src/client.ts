import type {
  ConnectionControllerClient,
  EventsControllerState,
  NetworkControllerClient,
  NetworkControllerState,
  OptionsControllerState,
  PublicStateControllerState,
  ThemeControllerState,
  ThemeMode,
  ThemeVariables,
  ModalControllerState,
  ConnectedWalletInfo,
  RouterControllerState
} from '@web3modal/core'
import {
  AccountController,
  BlockchainApiController,
  ConnectionController,
  ConnectorController,
  CoreHelperUtil,
  EventsController,
  ModalController,
  NetworkController,
  OptionsController,
  PublicStateController,
  ThemeController,
  SnackController,
  RouterController,
  EnsController
} from '@web3modal/core'
import { setColorTheme, setThemeVariables } from '@web3modal/ui'
import type { SIWEControllerClient } from '@web3modal/siwe'
import { ConstantsUtil } from '@web3modal/common'

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
  enableAnalytics?: OptionsControllerState['enableAnalytics']
  metadata?: OptionsControllerState['metadata']
  enableOnramp?: OptionsControllerState['enableOnramp']
  enableUniversalLinks?: OptionsControllerState['enableUniversalLinks']
  disableAppend?: OptionsControllerState['disableAppend']
  allowUnsupportedChain?: NetworkControllerState['allowUnsupportedChain']
  _sdkVersion: OptionsControllerState['sdkVersion']
}

export interface ScaffoldOptions extends LibraryOptions {
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

  protected setIsConnected: (typeof AccountController)['setIsConnected'] = isConnected => {
    AccountController.setIsConnected(isConnected)
  }

  protected getIsConnectedState = () => AccountController.state.isConnected

  protected setCaipAddress: (typeof AccountController)['setCaipAddress'] = caipAddress => {
    AccountController.setCaipAddress(caipAddress)
  }

  protected setBalance: (typeof AccountController)['setBalance'] = (balance, balanceSymbol) => {
    AccountController.setBalance(balance, balanceSymbol)
  }

  protected setProfileName: (typeof AccountController)['setProfileName'] = profileName => {
    AccountController.setProfileName(profileName)
  }

  protected setProfileImage: (typeof AccountController)['setProfileImage'] = profileImage => {
    AccountController.setProfileImage(profileImage)
  }

  protected resetAccount: (typeof AccountController)['resetAccount'] = () => {
    AccountController.resetAccount()
  }

  protected setCaipNetwork: (typeof NetworkController)['setCaipNetwork'] = caipNetwork => {
    NetworkController.setCaipNetwork(caipNetwork)
  }

  protected getCaipNetwork = () => NetworkController.state.caipNetwork

  protected setRequestedCaipNetworks: (typeof NetworkController)['setRequestedCaipNetworks'] =
    requestedCaipNetworks => {
      NetworkController.setRequestedCaipNetworks(requestedCaipNetworks)
    }

  protected getApprovedCaipNetworksData: (typeof NetworkController)['getApprovedCaipNetworksData'] =
    () => NetworkController.getApprovedCaipNetworksData()

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

  protected setAddressExplorerUrl: (typeof AccountController)['setAddressExplorerUrl'] =
    addressExplorerUrl => {
      AccountController.setAddressExplorerUrl(addressExplorerUrl)
    }

  protected setSmartAccountDeployed: (typeof AccountController)['setSmartAccountDeployed'] =
    isDeployed => {
      AccountController.setSmartAccountDeployed(isDeployed)
    }

  protected setConnectedWalletInfo: (typeof AccountController)['setConnectedWalletInfo'] =
    connectedWalletInfo => {
      AccountController.setConnectedWalletInfo(connectedWalletInfo)
    }

  protected setSmartAccountEnabledNetworks: (typeof NetworkController)['setSmartAccountEnabledNetworks'] =
    smartAccountEnabledNetworks => {
      NetworkController.setSmartAccountEnabledNetworks(smartAccountEnabledNetworks)
    }

  protected setPreferredAccountType: (typeof AccountController)['setPreferredAccountType'] =
    preferredAccountType => {
      AccountController.setPreferredAccountType(preferredAccountType)
    }

  protected getWalletConnectName: (typeof EnsController)['getNamesForAddress'] = address =>
    EnsController.getNamesForAddress(address)

  protected resolveWalletConnectName = async (name: string) => {
    const trimmedName = name.replace(ConstantsUtil.WC_NAME_SUFFIX, '')
    const wcNameAddress = await EnsController.resolveName(trimmedName)
    const networkNameAddresses = Object.values(wcNameAddress?.addresses) || []

    return networkNameAddresses[0]?.address || false
  }

  // -- Private ------------------------------------------------------------------
  private async initControllers(options: ScaffoldOptions) {
    NetworkController.setClient(options.networkControllerClient)
    NetworkController.setDefaultCaipNetwork(options.defaultChain)

    OptionsController.setProjectId(options.projectId)
    OptionsController.setAllWallets(options.allWallets)
    OptionsController.setIncludeWalletIds(options.includeWalletIds)
    OptionsController.setExcludeWalletIds(options.excludeWalletIds)
    OptionsController.setFeaturedWalletIds(options.featuredWalletIds)
    OptionsController.setTokens(options.tokens)
    OptionsController.setTermsConditionsUrl(options.termsConditionsUrl)
    OptionsController.setPrivacyPolicyUrl(options.privacyPolicyUrl)
    OptionsController.setCustomWallets(options.customWallets)
    OptionsController.setEnableAnalytics(options.enableAnalytics)
    OptionsController.setSdkVersion(options._sdkVersion)
    // Enabled by default
    OptionsController.setOnrampEnabled(options.enableOnramp !== false)

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

    if (options.enableUniversalLinks) {
      OptionsController.setUniversalLinksEnabled(Boolean(options.enableUniversalLinks))
    }

    if (options.allowUnsupportedChain) {
      NetworkController.setAllowUnsupportedChain(options.allowUnsupportedChain)
    }

    if (options.siweControllerClient) {
      const { SIWEController } = await import('@web3modal/siwe')

      SIWEController.setSIWEClient(options.siweControllerClient)
    }

    ConnectionController.setClient(options.connectionControllerClient)
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
