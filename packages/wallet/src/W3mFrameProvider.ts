import { W3mFrame } from './W3mFrame.js'
import type { W3mFrameTypes } from './W3mFrameTypes.js'
import { W3mFrameConstants, W3mFrameRpcConstants } from './W3mFrameConstants.js'
import { W3mFrameStorage } from './W3mFrameStorage.js'
import { W3mFrameHelpers } from './W3mFrameHelpers.js'

// -- Types -----------------------------------------------------------
type Resolver<T> = { resolve: (value: T) => void; reject: (reason?: unknown) => void } | undefined
type ConnectEmailResolver = Resolver<W3mFrameTypes.Responses['FrameConnectEmailResponse']>
type ConnectDeviceResolver = Resolver<undefined>
type ConnectOtpResolver = Resolver<undefined>
type ConnectResolver = Resolver<W3mFrameTypes.Responses['FrameGetUserResponse']>
type ConnectSocialResolver = Resolver<undefined>
type DisconnectResolver = Resolver<undefined>
type IsConnectedResolver = Resolver<W3mFrameTypes.Responses['FrameIsConnectedResponse']>
type GetChainIdResolver = Resolver<W3mFrameTypes.Responses['FrameGetChainIdResponse']>
type SwitchChainResolver = Resolver<W3mFrameTypes.Responses['FrameSwitchNetworkResponse']>
type RpcRequestResolver = Resolver<W3mFrameTypes.RPCResponse>
type UpdateEmailResolver = Resolver<undefined>
type UpdateEmailPrimaryOtpResolver = Resolver<undefined>
type UpdateEmailSecondaryOtpResolver = Resolver<
  W3mFrameTypes.Responses['FrameUpdateEmailSecondaryOtpResolver']
>
type SyncThemeResolver = Resolver<undefined>
type SyncDappDataResolver = Resolver<undefined>

// -- Provider --------------------------------------------------------
export class W3mFrameProvider {
  private w3mFrame: W3mFrame

  private connectEmailResolver: ConnectEmailResolver = undefined

  private connectDeviceResolver: ConnectDeviceResolver = undefined

  private connectOtpResolver: ConnectOtpResolver | undefined = undefined

  private connectSocialResolver: ConnectSocialResolver | undefined = undefined

  private connectResolver: ConnectResolver = undefined

  private disconnectResolver: DisconnectResolver = undefined

  private isConnectedResolver: IsConnectedResolver = undefined

  private getChainIdResolver: GetChainIdResolver = undefined

  private switchChainResolver: SwitchChainResolver = undefined

  private rpcRequestResolver: RpcRequestResolver = undefined

  private updateEmailResolver: UpdateEmailResolver = undefined

  private updateEmailPrimaryOtpResolver: UpdateEmailPrimaryOtpResolver = undefined

  private updateEmailSecondaryOtpResolver: UpdateEmailSecondaryOtpResolver = undefined

  private syncThemeResolver: SyncThemeResolver = undefined

  private syncDappDataResolver: SyncDappDataResolver = undefined

  public constructor(projectId: string) {
    this.w3mFrame = new W3mFrame(projectId, true)
    this.w3mFrame.events.onFrameEvent(event => {
      // eslint-disable-next-line no-console
      console.log('💻 received', event)

      switch (event.type) {
        case W3mFrameConstants.FRAME_CONNECT_EMAIL_SUCCESS:
          return this.onConnectEmailSuccess(event)
        case W3mFrameConstants.FRAME_CONNECT_EMAIL_ERROR:
          return this.onConnectEmailError(event)
        case W3mFrameConstants.FRAME_CONNECT_DEVICE_SUCCESS:
          return this.onConnectDeviceSuccess()
        case W3mFrameConstants.FRAME_CONNECT_DEVICE_ERROR:
          return this.onConnectDeviceError(event)
        case W3mFrameConstants.FRAME_CONNECT_OTP_SUCCESS:
          return this.onConnectOtpSuccess()
        case W3mFrameConstants.FRAME_CONNECT_OTP_ERROR:
          return this.onConnectOtpError(event)
        case W3mFrameConstants.FRAME_CONNECT_SOCIAL_SUCCESS:
          return this.onConnectSocialSuccess()
        case W3mFrameConstants.FRAME_CONNECT_SOCIAL_ERROR:
          return this.onConnectSocialError(event)
        case W3mFrameConstants.FRAME_GET_USER_SUCCESS:
          return this.onConnectSuccess(event)
        case W3mFrameConstants.FRAME_GET_USER_ERROR:
          return this.onConnectError(event)
        case W3mFrameConstants.FRAME_IS_CONNECTED_SUCCESS:
          return this.onIsConnectedSuccess(event)
        case W3mFrameConstants.FRAME_IS_CONNECTED_ERROR:
          return this.onIsConnectedError(event)
        case W3mFrameConstants.FRAME_GET_CHAIN_ID_SUCCESS:
          return this.onGetChainIdSuccess(event)
        case W3mFrameConstants.FRAME_GET_CHAIN_ID_ERROR:
          return this.onGetChainIdError(event)
        case W3mFrameConstants.FRAME_SIGN_OUT_SUCCESS:
          return this.onSignOutSuccess()
        case W3mFrameConstants.FRAME_SIGN_OUT_ERROR:
          return this.onSignOutError(event)
        case W3mFrameConstants.FRAME_SWITCH_NETWORK_SUCCESS:
          return this.onSwitchChainSuccess(event)
        case W3mFrameConstants.FRAME_SWITCH_NETWORK_ERROR:
          return this.onSwitchChainError(event)
        case W3mFrameConstants.FRAME_RPC_REQUEST_SUCCESS:
          return this.onRpcRequestSuccess(event)
        case W3mFrameConstants.FRAME_RPC_REQUEST_ERROR:
          return this.onRpcRequestError(event)
        case W3mFrameConstants.FRAME_SESSION_UPDATE:
          return this.onSessionUpdate(event)
        case W3mFrameConstants.FRAME_UPDATE_EMAIL_SUCCESS:
          return this.onUpdateEmailSuccess()
        case W3mFrameConstants.FRAME_UPDATE_EMAIL_ERROR:
          return this.onUpdateEmailError(event)
        case W3mFrameConstants.FRAME_UPDATE_EMAIL_PRIMARY_OTP_SUCCESS:
          return this.onUpdateEmailPrimaryOtpSuccess()
        case W3mFrameConstants.FRAME_UPDATE_EMAIL_PRIMARY_OTP_ERROR:
          return this.onUpdateEmailPrimaryOtpError(event)
        case W3mFrameConstants.FRAME_UPDATE_EMAIL_SECONDARY_OTP_SUCCESS:
          return this.onUpdateEmailSecondaryOtpSuccess(event)
        case W3mFrameConstants.FRAME_UPDATE_EMAIL_SECONDARY_OTP_ERROR:
          return this.onUpdateEmailSecondaryOtpError(event)
        case W3mFrameConstants.FRAME_SYNC_THEME_SUCCESS:
          return this.onSyncThemeSuccess()
        case W3mFrameConstants.FRAME_SYNC_THEME_ERROR:
          return this.onSyncThemeError(event)
        case W3mFrameConstants.FRAME_SYNC_DAPP_DATA_SUCCESS:
          return this.onSyncDappDataSuccess()
        case W3mFrameConstants.FRAME_SYNC_DAPP_DATA_ERROR:
          return this.onSyncDappDataError(event)
        default:
          return null
      }
    })
  }

  // -- Extended Methods ------------------------------------------------
  public getLoginEmailUsed() {
    return Boolean(W3mFrameStorage.get(W3mFrameConstants.EMAIL_LOGIN_USED_KEY))
  }

  public getEmail() {
    return W3mFrameStorage.get(W3mFrameConstants.EMAIL)
  }

  public async connectEmail(payload: W3mFrameTypes.Requests['AppConnectEmailRequest']) {
    await this.w3mFrame.frameLoadPromise
    W3mFrameHelpers.checkIfAllowedToTriggerEmail()
    this.w3mFrame.events.postAppEvent({ type: W3mFrameConstants.APP_CONNECT_EMAIL, payload })

    return new Promise<W3mFrameTypes.Responses['FrameConnectEmailResponse']>((resolve, reject) => {
      this.connectEmailResolver = { resolve, reject }
    })
  }

  public async connectDevice() {
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({ type: W3mFrameConstants.APP_CONNECT_DEVICE })

    return new Promise((resolve, reject) => {
      this.connectDeviceResolver = { resolve, reject }
    })
  }

  public async connectOtp(payload: W3mFrameTypes.Requests['AppConnectOtpRequest']) {
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({ type: W3mFrameConstants.APP_CONNECT_OTP, payload })

    return new Promise((resolve, reject) => {
      this.connectOtpResolver = { resolve, reject }
    })
  }

  public async connectSocial(payload: W3mFrameTypes.Requests['AppConnectSocialRequest']) {
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({ type: W3mFrameConstants.APP_CONNECT_SOCIAL, payload })

    return new Promise((resolve, reject) => {
      this.connectSocialResolver = { resolve, reject }
    })
  }

  public async isConnected() {
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({
      type: W3mFrameConstants.APP_IS_CONNECTED,
      payload: undefined
    })

    return new Promise<W3mFrameTypes.Responses['FrameIsConnectedResponse']>((resolve, reject) => {
      this.isConnectedResolver = { resolve, reject }
    })
  }

  public async getChainId() {
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({ type: W3mFrameConstants.APP_GET_CHAIN_ID })

    return new Promise<W3mFrameTypes.Responses['FrameGetChainIdResponse']>((resolve, reject) => {
      this.getChainIdResolver = { resolve, reject }
    })
  }

  public async updateEmail(payload: W3mFrameTypes.Requests['AppUpdateEmailRequest']) {
    await this.w3mFrame.frameLoadPromise
    W3mFrameHelpers.checkIfAllowedToTriggerEmail()
    this.w3mFrame.events.postAppEvent({ type: W3mFrameConstants.APP_UPDATE_EMAIL, payload })

    return new Promise((resolve, reject) => {
      this.updateEmailResolver = { resolve, reject }
    })
  }

  public async updateEmailPrimaryOtp(
    payload: W3mFrameTypes.Requests['AppUpdateEmailPrimaryOtpRequest']
  ) {
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({
      type: W3mFrameConstants.APP_UPDATE_EMAIL_PRIMARY_OTP,
      payload
    })

    return new Promise((resolve, reject) => {
      this.updateEmailPrimaryOtpResolver = { resolve, reject }
    })
  }

  public async updateEmailSecondaryOtp(
    payload: W3mFrameTypes.Requests['AppUpdateEmailSecondaryOtpRequest']
  ) {
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({
      type: W3mFrameConstants.APP_UPDATE_EMAIL_SECONDARY_OTP,
      payload
    })

    return new Promise<W3mFrameTypes.Responses['FrameUpdateEmailSecondaryOtpResolver']>(
      (resolve, reject) => {
        this.updateEmailSecondaryOtpResolver = { resolve, reject }
      }
    )
  }

  public async syncTheme(payload: W3mFrameTypes.Requests['AppSyncThemeRequest']) {
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({ type: W3mFrameConstants.APP_SYNC_THEME, payload })

    return new Promise((resolve, reject) => {
      this.syncThemeResolver = { resolve, reject }
    })
  }

  public async syncDappData(payload: W3mFrameTypes.Requests['AppSyncDappDataRequest']) {
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({ type: W3mFrameConstants.APP_SYNC_DAPP_DATA, payload })

    return new Promise((resolve, reject) => {
      this.syncDappDataResolver = { resolve, reject }
    })
  }

  // -- Provider Methods ------------------------------------------------
  public async connect(payload?: W3mFrameTypes.Requests['AppGetUserRequest']) {
    const chainId = payload?.chainId ?? this.getLastUsedChainId() ?? 1
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({
      type: W3mFrameConstants.APP_GET_USER,
      payload: { chainId }
    })

    return new Promise<W3mFrameTypes.Responses['FrameGetUserResponse']>((resolve, reject) => {
      this.connectResolver = { resolve, reject }
    })
  }

  public async switchNetwork(chainId: number) {
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({
      type: W3mFrameConstants.APP_SWITCH_NETWORK,
      payload: { chainId }
    })

    return new Promise<W3mFrameTypes.Responses['FrameSwitchNetworkResponse']>((resolve, reject) => {
      this.switchChainResolver = { resolve, reject }
    })
  }

  public async disconnect() {
    await this.w3mFrame.frameLoadPromise
    this.w3mFrame.events.postAppEvent({ type: W3mFrameConstants.APP_SIGN_OUT })

    return new Promise((resolve, reject) => {
      this.disconnectResolver = { resolve, reject }
    })
  }

  public async request(req: W3mFrameTypes.RPCRequest) {
    await this.w3mFrame.frameLoadPromise

    if (W3mFrameRpcConstants.GET_CHAIN_ID === req.method) {
      return this.getLastUsedChainId()
    }

    this.w3mFrame.events.postAppEvent({
      type: W3mFrameConstants.APP_RPC_REQUEST,
      payload: req
    })

    return new Promise<W3mFrameTypes.RPCResponse>((resolve, reject) => {
      this.rpcRequestResolver = { resolve, reject }
    })
  }

  public onRpcRequest(callback: (request: unknown) => void) {
    this.w3mFrame.events.onAppEvent(event => {
      if (event.type.includes(W3mFrameConstants.RPC_METHOD_KEY)) {
        callback(event)
      }
    })
  }

  public onRpcResponse(callback: (request: unknown) => void) {
    this.w3mFrame.events.onFrameEvent(event => {
      if (event.type.includes(W3mFrameConstants.RPC_METHOD_KEY)) {
        callback(event)
      }
    })
  }

  public onIsConnected(callback: () => void) {
    this.w3mFrame.events.onFrameEvent(event => {
      if (event.type === W3mFrameConstants.FRAME_GET_USER_SUCCESS) {
        callback()
      }
    })
  }

  // -- Promise Handlers ------------------------------------------------
  private onConnectEmailSuccess(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/CONNECT_EMAIL_SUCCESS' }>
  ) {
    this.connectEmailResolver?.resolve(event.payload)
    this.setNewLastEmailLoginTime()
  }

  private onConnectEmailError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/CONNECT_EMAIL_ERROR' }>
  ) {
    this.connectEmailResolver?.reject(event.payload.message)
  }

  private onConnectDeviceSuccess() {
    this.connectDeviceResolver?.resolve(undefined)
  }

  private onConnectDeviceError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/CONNECT_DEVICE_ERROR' }>
  ) {
    this.connectDeviceResolver?.reject(event.payload.message)
  }

  private onConnectOtpSuccess() {
    this.connectOtpResolver?.resolve(undefined)
  }

  private onConnectOtpError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/CONNECT_OTP_ERROR' }>
  ) {
    this.connectOtpResolver?.reject(event.payload.message)
  }

  private onConnectSocialSuccess() {
    this.connectSocialResolver?.resolve(undefined)
  }

  private onConnectSocialError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/CONNECT_SOCIAL_ERROR' }>
  ) {
    this.connectSocialResolver?.reject(event.payload.message)
  }

  private onConnectSuccess(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/GET_USER_SUCCESS' }>
  ) {
    this.setEmailLoginSuccess(event.payload.email)
    this.setLastUsedChainId(event.payload.chainId)
    this.connectResolver?.resolve(event.payload)
  }

  private onConnectError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/GET_USER_ERROR' }>
  ) {
    this.connectResolver?.reject(event.payload.message)
  }

  private onIsConnectedSuccess(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/IS_CONNECTED_SUCCESS' }>
  ) {
    if (!event.payload.isConnected) {
      this.deleteEmailLoginCache()
    }
    this.isConnectedResolver?.resolve(event.payload)
  }

  private onIsConnectedError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/IS_CONNECTED_ERROR' }>
  ) {
    this.isConnectedResolver?.reject(event.payload.message)
  }

  private onGetChainIdSuccess(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/GET_CHAIN_ID_SUCCESS' }>
  ) {
    this.setLastUsedChainId(event.payload.chainId)
    this.getChainIdResolver?.resolve(event.payload)
  }

  private onGetChainIdError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/GET_CHAIN_ID_ERROR' }>
  ) {
    this.getChainIdResolver?.reject(event.payload.message)
  }

  private onSignOutSuccess() {
    this.disconnectResolver?.resolve(undefined)
    this.deleteEmailLoginCache()
  }

  private onSignOutError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/SIGN_OUT_ERROR' }>
  ) {
    this.disconnectResolver?.reject(event.payload.message)
  }

  private onSwitchChainSuccess(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/SWITCH_NETWORK_SUCCESS' }>
  ) {
    this.setLastUsedChainId(event.payload.chainId)
    this.switchChainResolver?.resolve(event.payload)
  }

  private onSwitchChainError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/SWITCH_NETWORK_ERROR' }>
  ) {
    this.switchChainResolver?.reject(event.payload.message)
  }

  private onRpcRequestSuccess(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/RPC_REQUEST_SUCCESS' }>
  ) {
    this.rpcRequestResolver?.resolve(event.payload)
  }

  private onRpcRequestError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/RPC_REQUEST_ERROR' }>
  ) {
    this.rpcRequestResolver?.reject(event.payload.message)
  }

  private onSessionUpdate(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/SESSION_UPDATE' }>
  ) {
    const { payload } = event
    if (payload) {
      // Ilja TODO: this.setSessionToken(payload.token)
    }
  }

  private onUpdateEmailSuccess() {
    this.updateEmailResolver?.resolve(undefined)
    this.setNewLastEmailLoginTime()
  }

  private onUpdateEmailError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/UPDATE_EMAIL_ERROR' }>
  ) {
    this.updateEmailResolver?.reject(event.payload.message)
  }

  private onUpdateEmailPrimaryOtpSuccess() {
    this.updateEmailPrimaryOtpResolver?.resolve(undefined)
  }

  private onUpdateEmailPrimaryOtpError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/UPDATE_EMAIL_PRIMARY_OTP_ERROR' }>
  ) {
    this.updateEmailPrimaryOtpResolver?.reject(event.payload.message)
  }

  private onUpdateEmailSecondaryOtpSuccess(
    event: Extract<
      W3mFrameTypes.FrameEvent,
      { type: '@w3m-frame/UPDATE_EMAIL_SECONDARY_OTP_SUCCESS' }
    >
  ) {
    const { newEmail } = event.payload
    this.setEmailLoginSuccess(newEmail)
    this.updateEmailSecondaryOtpResolver?.resolve({ newEmail })
  }

  private onUpdateEmailSecondaryOtpError(
    event: Extract<
      W3mFrameTypes.FrameEvent,
      { type: '@w3m-frame/UPDATE_EMAIL_SECONDARY_OTP_ERROR' }
    >
  ) {
    this.updateEmailSecondaryOtpResolver?.reject(event.payload.message)
  }

  private onSyncThemeSuccess() {
    this.syncThemeResolver?.resolve(undefined)
  }

  private onSyncThemeError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/SYNC_THEME_ERROR' }>
  ) {
    this.syncThemeResolver?.reject(event.payload.message)
  }

  private onSyncDappDataSuccess() {
    this.syncDappDataResolver?.resolve(undefined)
  }

  private onSyncDappDataError(
    event: Extract<W3mFrameTypes.FrameEvent, { type: '@w3m-frame/SYNC_DAPP_DATA_ERROR' }>
  ) {
    this.syncDappDataResolver?.reject(event.payload.message)
  }

  // -- Private Methods -------------------------------------------------
  private setNewLastEmailLoginTime() {
    W3mFrameStorage.set(W3mFrameConstants.LAST_EMAIL_LOGIN_TIME, Date.now().toString())
  }

  private setEmailLoginSuccess(email: string) {
    W3mFrameStorage.set(W3mFrameConstants.EMAIL, email)
    W3mFrameStorage.set(W3mFrameConstants.EMAIL_LOGIN_USED_KEY, 'true')
    W3mFrameStorage.delete(W3mFrameConstants.LAST_EMAIL_LOGIN_TIME)
  }

  private deleteEmailLoginCache() {
    W3mFrameStorage.delete(W3mFrameConstants.EMAIL_LOGIN_USED_KEY)
    W3mFrameStorage.delete(W3mFrameConstants.EMAIL)
    W3mFrameStorage.delete(W3mFrameConstants.LAST_USED_CHAIN_KEY)
  }

  private setLastUsedChainId(chainId: number) {
    W3mFrameStorage.set(W3mFrameConstants.LAST_USED_CHAIN_KEY, `${chainId}`)
  }

  private getLastUsedChainId() {
    return Number(W3mFrameStorage.get(W3mFrameConstants.LAST_USED_CHAIN_KEY))
  }
}
