import { W3mFrameStorage } from './W3mFrameStorage.js'
import { W3mFrameConstants, W3mFrameRpcConstants } from './W3mFrameConstants.js'
import type { W3mFrameTypes } from './W3mFrameTypes.js'

const RESTRICTED_TIMEZONES = [
  'ASIA/SHANGHAI',
  'ASIA/URUMQI',
  'ASIA/CHONGQING',
  'ASIA/HARBIN',
  'ASIA/KASHGAR',
  'ASIA/MACAU',
  'ASIA/HONG_KONG',
  'ASIA/MACAO',
  'ASIA/BEIJING',
  'ASIA/HARBIN'
]

const EMAIL_MINIMUM_TIMEOUT = 30 * 1000

export const W3mFrameHelpers = {
  getBlockchainApiUrl() {
    try {
      const { timeZone } = new Intl.DateTimeFormat().resolvedOptions()
      const capTimeZone = timeZone.toUpperCase()

      return RESTRICTED_TIMEZONES.includes(capTimeZone)
        ? 'https://rpc.walletconnect.org'
        : 'https://rpc.walletconnect.com'
    } catch {
      return false
    }
  },

  checkIfAllowedToTriggerEmail() {
    const lastEmailLoginTime = W3mFrameStorage.get(W3mFrameConstants.LAST_EMAIL_LOGIN_TIME)
    if (lastEmailLoginTime) {
      const difference = Date.now() - Number(lastEmailLoginTime)
      if (difference < EMAIL_MINIMUM_TIMEOUT) {
        const cooldownSec = Math.ceil((EMAIL_MINIMUM_TIMEOUT - difference) / 1000)
        throw new Error(`Please try again after ${cooldownSec} seconds`)
      }
    }
  },

  getTimeToNextEmailLogin() {
    const lastEmailLoginTime = W3mFrameStorage.get(W3mFrameConstants.LAST_EMAIL_LOGIN_TIME)
    if (lastEmailLoginTime) {
      const difference = Date.now() - Number(lastEmailLoginTime)
      if (difference < EMAIL_MINIMUM_TIMEOUT) {
        return Math.ceil((EMAIL_MINIMUM_TIMEOUT - difference) / 1000)
      }
    }

    return 0
  },

  checkIfRequestExists(request: unknown) {
    const method = this.getRequestMethod(request)

    return (
      W3mFrameRpcConstants.NOT_SAFE_RPC_METHODS.includes(method) ||
      W3mFrameRpcConstants.SAFE_RPC_METHODS.includes(method)
    )
  },

  getRequestMethod(request: unknown) {
    return (request as { payload: W3mFrameTypes.RPCRequest })?.payload?.method
  },

  checkIfRequestIsAllowed(request: unknown) {
    const method = this.getRequestMethod(request)

    return W3mFrameRpcConstants.SAFE_RPC_METHODS.includes(method)
  },

  getPreferredAccountType(): 'eoa' | 'smartAccount' {
    const storedType = W3mFrameStorage.get(W3mFrameConstants.PREFERRED_ACCOUNT_TYPE) as
      | 'eoa'
      | 'smartAccount'

    return storedType || 'eoa'
  },

  isClient: typeof window !== 'undefined'
}
