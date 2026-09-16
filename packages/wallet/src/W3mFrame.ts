import { ConstantsUtil } from '@reown/appkit-common'

import {
  SECURE_SITE_SDK,
  SECURE_SITE_SDK_ORIGIN,
  SECURE_SITE_SDK_VERSION,
  W3mFrameConstants
} from './W3mFrameConstants.js'
import { W3mFrameHelpers } from './W3mFrameHelpers.js'
import { W3mFrameSchema } from './W3mFrameSchema.js'
import { W3mFrameStorage } from './W3mFrameStorage.js'
import type { W3mFrameTypes } from './W3mFrameTypes.js'

type EventKey = typeof W3mFrameConstants.APP_EVENT_KEY | typeof W3mFrameConstants.FRAME_EVENT_KEY

function shouldHandleEvent(eventKey: EventKey, data: MessageEvent['data'] = {}): boolean {
  return typeof data?.type === 'string' && data?.type?.includes(eventKey)
}

interface W3mFrameConfig {
  projectId: string
  isAppClient?: boolean
  chainId?: W3mFrameTypes.Network['chainId']
  enableLogger?: boolean
  enableCloudAuthAccount?: boolean
  rpcUrl?: string
}

function createSecureSiteSdkUrl({
  projectId,
  chainId,
  enableLogger,
  rpcUrl = ConstantsUtil.BLOCKCHAIN_API_RPC_URL,
  enableCloudAuthAccount = false
}: Pick<
  W3mFrameConfig,
  'projectId' | 'chainId' | 'enableLogger' | 'rpcUrl' | 'enableCloudAuthAccount'
>): string {
  const url = new URL(SECURE_SITE_SDK)
  url.searchParams.set('projectId', projectId)
  url.searchParams.set('chainId', String(chainId))
  url.searchParams.set('version', SECURE_SITE_SDK_VERSION)
  url.searchParams.set('enableLogger', String(enableLogger))
  url.searchParams.set('rpcUrl', rpcUrl)
  // Intended for debug usage only
  const smartAccountVersion = W3mFrameStorage.get('dapp_smart_account_version')
  if (smartAccountVersion && (smartAccountVersion === 'v6' || smartAccountVersion === 'v7')) {
    console.warn('>> AppKit - Forcing smart account version', smartAccountVersion)
    url.searchParams.set('smartAccountVersion', smartAccountVersion)
  }
  if (enableCloudAuthAccount) {
    url.searchParams.set('enableCloudAuthAccount', 'true')
  }

  return url.toString()
}

// -- Sdk --------------------------------------------------------------------
export class W3mFrame {
  private iframe: HTMLIFrameElement | null = null

  public iframeIsReady = false

  private projectId: string

  private rpcUrl: string

  public frameLoadPromise: Promise<void>

  public frameLoadPromiseResolver:
    | {
        resolve: (value: undefined) => void
        reject: (reason?: unknown) => void
      }
    | undefined

  public constructor({
    projectId,
    isAppClient = false,
    chainId = 'eip155:1',
    enableLogger = true,
    enableCloudAuthAccount = false,
    rpcUrl = ConstantsUtil.BLOCKCHAIN_API_RPC_URL
  }: W3mFrameConfig) {
    this.projectId = projectId
    this.frameLoadPromise = new Promise((resolve, reject) => {
      this.frameLoadPromiseResolver = { resolve, reject }
    })

    this.rpcUrl = rpcUrl
    // Create iframe only when sdk is initialised from dapp / appkit
    if (isAppClient) {
      this.frameLoadPromise = new Promise((resolve, reject) => {
        this.frameLoadPromiseResolver = { resolve, reject }
      })
      if (W3mFrameHelpers.isClient) {
        const iframe = document.createElement('iframe')
        iframe.id = 'w3m-iframe'
        iframe.src = createSecureSiteSdkUrl({
          projectId,
          chainId,
          enableLogger,
          rpcUrl: this.rpcUrl,
          enableCloudAuthAccount
        })
        iframe.name = 'w3m-secure-iframe'
        iframe.style.position = 'fixed'
        iframe.style.zIndex = '999999'
        iframe.style.display = 'none'
        iframe.style.border = 'none'
        iframe.style.animationDelay = '0s, 50ms'
        iframe.style.borderBottomLeftRadius = `clamp(0px, var(--apkt-borderRadius-8), 44px)`
        iframe.style.borderBottomRightRadius = `clamp(0px, var(--apkt-borderRadius-8), 44px)`
        this.iframe = iframe
        this.iframe.onerror = () => {
          this.frameLoadPromiseResolver?.reject('Unable to load email login dependency')
        }

        this.events.onFrameEvent(event => {
          if (event.type === '@w3m-frame/READY') {
            this.iframeIsReady = true
            this.frameLoadPromiseResolver?.resolve(undefined)
          }
        })
      }
    }
  }

  public initFrame = () => {
    const isFrameInitialized = document.getElementById('w3m-iframe')
    if (this.iframe && !isFrameInitialized) {
      document.body.appendChild(this.iframe)
    }
  }

  // -- Networks --------------------------------------------------------------
  get networks(): Record<string, W3mFrameTypes.Network> {
    const data = [
      'eip155:1',
      'eip155:5',
      'eip155:11155111',
      'eip155:10',
      'eip155:420',
      'eip155:42161',
      'eip155:421613',
      'eip155:137',
      'eip155:80001',
      'eip155:42220',
      'eip155:1313161554',
      'eip155:1313161555',
      'eip155:56',
      'eip155:97',
      'eip155:43114',
      'eip155:43113',
      'eip155:324',
      'eip155:280',
      'eip155:100',
      'eip155:8453',
      'eip155:84531',
      'eip155:84532',
      'eip155:7777777',
      'eip155:999',
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
      'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
    ].map(id => ({
      [id]: {
        rpcUrl: `${this.rpcUrl}/v1/?chainId=${id}&projectId=${this.projectId}`,
        chainId: id
      }
    }))

    return Object.assign({}, ...data)
  }

  // -- Events ----------------------------------------------------------------
  public events = {
    registerFrameEventHandler: (
      id: string,
      callback: (event: W3mFrameTypes.FrameEvent) => void,
      signal: AbortSignal
    ) => {
      function eventHandler({ data, origin }: MessageEvent) {
        if (origin !== SECURE_SITE_SDK_ORIGIN) {
          return
        }
        if (!shouldHandleEvent(W3mFrameConstants.FRAME_EVENT_KEY, data)) {
          return
        }
        const frameEvent = W3mFrameSchema.frameEvent.safeParse(data)

        if (!frameEvent.success) {
          console.warn('W3mFrame: invalid frame event', frameEvent.error.message)

          return
        }

        if (frameEvent.data?.id === id) {
          callback(frameEvent.data)
          window.removeEventListener('message', eventHandler)
        }
      }
      if (W3mFrameHelpers.isClient) {
        window.addEventListener('message', eventHandler)

        signal.addEventListener('abort', () => {
          window.removeEventListener('message', eventHandler)
        })
      }
    },
    onFrameEvent: (callback: (event: W3mFrameTypes.FrameEvent) => void) => {
      if (W3mFrameHelpers.isClient) {
        window.addEventListener('message', ({ data, origin }) => {
          if (origin !== SECURE_SITE_SDK_ORIGIN) {
            return
          }
          if (!shouldHandleEvent(W3mFrameConstants.FRAME_EVENT_KEY, data)) {
            return
          }

          const frameEvent = W3mFrameSchema.frameEvent.safeParse(data)
          if (frameEvent.success) {
            callback(frameEvent.data)
          } else {
            console.warn('W3mFrame: invalid frame event', frameEvent.error.message)
          }
        })
      }
    },

    onAppEvent: (callback: (event: W3mFrameTypes.AppEvent) => void) => {
      if (W3mFrameHelpers.isClient) {
        window.addEventListener('message', ({ data }) => {
          if (!shouldHandleEvent(W3mFrameConstants.APP_EVENT_KEY, data)) {
            return
          }
          const appEvent = W3mFrameSchema.appEvent.safeParse(data)
          // Frame side, if the event is invalid, we allow it to go through anyways
          if (!appEvent.success) {
            console.warn('W3mFrame: invalid app event', appEvent.error.message)
          }

          callback(data as W3mFrameTypes.AppEvent)
        })
      }
    },

    postAppEvent: (event: W3mFrameTypes.AppEvent) => {
      if (W3mFrameHelpers.isClient) {
        if (!this.iframe?.contentWindow) {
          throw new Error('W3mFrame: iframe is not set')
        }
        this.iframe.contentWindow.postMessage(event, SECURE_SITE_SDK_ORIGIN)
      }
    },

    postFrameEvent: (event: W3mFrameTypes.FrameEvent) => {
      if (W3mFrameHelpers.isClient) {
        if (!parent) {
          throw new Error('W3mFrame: parent is not set')
        }
        parent.postMessage(event, '*')
      }
    }
  }
}
