import { SECURE_SITE_SDK, W3mFrameConstants } from './W3mFrameConstants.js'
import { W3mFrameSchema } from './W3mFrameSchema.js'
import { W3mFrameHelpers } from './W3mFrameHelpers.js'
import type { W3mFrameTypes } from './W3mFrameTypes.js'
import { ConstantsUtil } from '@reown/appkit-common'

// -- Sdk --------------------------------------------------------------------
export class W3mFrame {
  private iframe: HTMLIFrameElement | null = null

  private projectId: string

  private rpcUrl = ConstantsUtil.BLOCKCHAIN_API_RPC_URL

  public frameLoadPromise: Promise<void>

  public frameLoadPromiseResolver:
    | {
        resolve: (value: undefined) => void
        reject: (reason?: unknown) => void
      }
    | undefined

  public constructor(
    projectId: string,
    isAppClient = false,
    chainId: W3mFrameTypes.Network['chainId'] = 'eip155:1'
  ) {
    this.projectId = projectId
    this.frameLoadPromise = new Promise((resolve, reject) => {
      this.frameLoadPromiseResolver = { resolve, reject }
    })

    // Create iframe only when sdk is initialised from dapp / appkit
    if (isAppClient) {
      this.frameLoadPromise = new Promise((resolve, reject) => {
        this.frameLoadPromiseResolver = { resolve, reject }
      })
      if (W3mFrameHelpers.isClient) {
        const iframe = document.createElement('iframe')
        iframe.id = 'w3m-iframe'
        iframe.src = `${SECURE_SITE_SDK}?projectId=${projectId}&chainId=${chainId}`
        iframe.name = 'w3m-secure-iframe'
        iframe.referrerPolicy = 'strict-origin-when-cross-origin'
        iframe.style.position = 'fixed'
        iframe.style.zIndex = '999999'
        iframe.style.display = 'none'
        iframe.style.animationDelay = '0s, 50ms'
        iframe.style.borderBottomLeftRadius = `clamp(0px, var(--wui-border-radius-l), 44px)`
        iframe.style.borderBottomRightRadius = `clamp(0px, var(--wui-border-radius-l), 44px)`
        document.body.appendChild(iframe)
        this.iframe = iframe
        this.iframe.onload = () => {
          this.frameLoadPromiseResolver?.resolve(undefined)
        }
        this.iframe.onerror = () => {
          this.frameLoadPromiseResolver?.reject('Unable to load email login dependency')
        }
      }
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
      function eventHandler({ data }: MessageEvent) {
        if (!data.type?.includes(W3mFrameConstants.FRAME_EVENT_KEY)) {
          return
        }
        const frameEvent = W3mFrameSchema.frameEvent.parse(data)
        if (frameEvent.id === id) {
          callback(frameEvent)
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
        window.addEventListener('message', ({ data }) => {
          if (!data.type?.includes(W3mFrameConstants.FRAME_EVENT_KEY)) {
            return
          }
          const frameEvent = W3mFrameSchema.frameEvent.parse(data)
          callback(frameEvent)
        })
      }
    },

    onAppEvent: (callback: (event: W3mFrameTypes.AppEvent) => void) => {
      if (W3mFrameHelpers.isClient) {
        window.addEventListener('message', ({ data }) => {
          if (!data.type?.includes(W3mFrameConstants.APP_EVENT_KEY)) {
            return
          }
          const appEvent = W3mFrameSchema.appEvent.parse(data)
          callback(appEvent)
        })
      }
    },

    postAppEvent: (event: W3mFrameTypes.AppEvent) => {
      if (W3mFrameHelpers.isClient) {
        if (!this.iframe?.contentWindow) {
          throw new Error('W3mFrame: iframe is not set')
        }
        W3mFrameSchema.appEvent.parse(event)
        this.iframe.contentWindow.postMessage(event, '*')
      }
    },

    postFrameEvent: (event: W3mFrameTypes.FrameEvent) => {
      if (W3mFrameHelpers.isClient) {
        if (!parent) {
          throw new Error('W3mFrame: parent is not set')
        }
        W3mFrameSchema.frameEvent.parse(event)
        parent.postMessage(event, '*')
      }
    }
  }
}
