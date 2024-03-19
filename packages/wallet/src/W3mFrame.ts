import { W3mFrameConstants } from './W3mFrameConstants.js'
import { W3mFrameSchema } from './W3mFrameSchema.js'
import { W3mFrameHelpers } from './W3mFrameHelpers.js'
import type { W3mFrameTypes } from './W3mFrameTypes.js'

// -- Sdk --------------------------------------------------------------------
export class W3mFrame {
  private iframe: HTMLIFrameElement | null = null

  private projectId: string

  private rpcUrl = W3mFrameHelpers.getBlockchainApiUrl()

  public frameLoadPromise: Promise<void>

  private origin = new URL(W3mFrameConstants.SECURE_SITE_SDK).origin

  public frameLoadPromiseResolver:
    | {
        resolve: (value: undefined) => void
        reject: (reason?: unknown) => void
      }
    | undefined

  public constructor(projectId: string, isAppClient = false) {
    this.projectId = projectId
    this.frameLoadPromise = new Promise((resolve, reject) => {
      this.frameLoadPromiseResolver = { resolve, reject }
    })

    // Create iframe only when sdk is initialised from dapp / web3modal
    if (isAppClient) {
      this.frameLoadPromise = new Promise((resolve, reject) => {
        this.frameLoadPromiseResolver = { resolve, reject }
      })
      if (W3mFrameHelpers.isClient) {
        const iframe = document.createElement('iframe')
        iframe.id = 'w3m-iframe'
        iframe.src = `${W3mFrameConstants.SECURE_SITE_SDK}?projectId=${projectId}`
        iframe.style.position = 'fixed'
        iframe.style.zIndex = '999999'
        iframe.style.display = 'none'
        iframe.style.opacity = '0'
        iframe.style.borderRadius = `clamp(0px, var(--wui-border-radius-l), 44px)`
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
  get networks(): Record<number, W3mFrameTypes.Network> {
    const data = [
      1, 5, 11155111, 10, 420, 42161, 421613, 137, 80001, 42220, 1313161554, 1313161555, 56, 97,
      43114, 43113, 324, 280, 100, 8453, 84531, 7777777, 999
    ].map(id => ({
      [id]: {
        rpcUrl: `${this.rpcUrl}/v1/?chainId=eip155:${id}&projectId=${this.projectId}`,
        chainId: id
      }
    }))

    return Object.assign({}, ...data)
  }

  // -- Events ----------------------------------------------------------------
  public events = {
    onFrameEvent: (callback: (event: W3mFrameTypes.FrameEvent) => void) => {
      if (W3mFrameHelpers.isClient) {
        window.addEventListener('message', ({ data, origin }) => {
          if (origin !== window.location.origin && origin !== this.origin) {
            return
          }

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
        window.addEventListener(
          'message',
          ({ data, origin }) => {
            if (origin !== window.location.origin && origin !== this.origin) {
              return
            }

            if (!data.type?.includes(W3mFrameConstants.APP_EVENT_KEY)) {
              return
            }
            const appEvent = W3mFrameSchema.appEvent.parse(data)
            callback(appEvent)
          },
          {}
        )
      }
    },

    postAppEvent: (event: W3mFrameTypes.AppEvent) => {
      if (W3mFrameHelpers.isClient) {
        if (!this.iframe?.contentWindow) {
          throw new Error('W3mFrame: iframe is not set')
        }
        W3mFrameSchema.appEvent.parse(event)
        window.postMessage(event)
        this.iframe.contentWindow.postMessage(event, this.origin)
      }
    },

    postFrameEvent: (event: W3mFrameTypes.FrameEvent) => {
      if (W3mFrameHelpers.isClient) {
        if (!parent) {
          throw new Error('W3mFrame: parent is not set')
        }
        W3mFrameSchema.frameEvent.parse(event)
        parent.postMessage(event, this.origin)
      }
    }
  }
}
