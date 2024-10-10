import type { AppKitSdkVersion, Balance, ChainNamespace } from '@reown/appkit-common'
import {
  ConstantsUtil as CommonConstants,
  SafeLocalStorage,
  SafeLocalStorageKeys
} from '@reown/appkit-common'
import { ConstantsUtil } from './ConstantsUtil.js'
import type { CaipAddress, CaipNetwork } from '@reown/appkit-common'
import type { ChainAdapter, LinkingRecord } from './TypeUtil.js'

type SDKFramework = 'html' | 'react' | 'vue'

export const CoreHelperUtil = {
  isMobile() {
    if (typeof window !== 'undefined') {
      return Boolean(
        window.matchMedia('(pointer:coarse)').matches ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|Opera Mini/u.test(navigator.userAgent)
      )
    }

    return false
  },

  checkCaipNetwork(network: CaipNetwork | undefined, networkName = '') {
    return network?.caipNetworkId.toLocaleLowerCase().includes(networkName.toLowerCase())
  },

  isAndroid() {
    const ua = window.navigator.userAgent.toLowerCase()

    return CoreHelperUtil.isMobile() && ua.includes('android')
  },

  isIos() {
    const ua = window.navigator.userAgent.toLowerCase()

    return CoreHelperUtil.isMobile() && (ua.includes('iphone') || ua.includes('ipad'))
  },

  isClient() {
    return typeof window !== 'undefined'
  },

  isPairingExpired(expiry?: number) {
    return expiry ? expiry - Date.now() <= ConstantsUtil.TEN_SEC_MS : true
  },

  isAllowedRetry(lastRetry: number) {
    return Date.now() - lastRetry >= ConstantsUtil.ONE_SEC_MS
  },

  copyToClopboard(text: string) {
    navigator.clipboard.writeText(text)
  },

  getPairingExpiry() {
    return Date.now() + ConstantsUtil.FOUR_MINUTES_MS
  },

  getNetworkId(caipAddress: CaipAddress | undefined) {
    return caipAddress?.split(':')[1]
  },

  getPlainAddress(caipAddress: CaipAddress | undefined) {
    return caipAddress?.split(':')[2]
  },

  async wait(milliseconds: number) {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds)
    })
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debounce(func: (...args: any[]) => unknown, timeout = 500) {
    let timer: ReturnType<typeof setTimeout> | undefined = undefined

    return (...args: unknown[]) => {
      function next() {
        func(...args)
      }

      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(next, timeout)
    }
  },

  isHttpUrl(url: string) {
    return url.startsWith('http://') || url.startsWith('https://')
  },

  formatNativeUrl(appUrl: string, wcUri: string): LinkingRecord {
    if (CoreHelperUtil.isHttpUrl(appUrl)) {
      return this.formatUniversalUrl(appUrl, wcUri)
    }
    let safeAppUrl = appUrl
    if (!safeAppUrl.includes('://')) {
      safeAppUrl = appUrl.replaceAll('/', '').replaceAll(':', '')
      safeAppUrl = `${safeAppUrl}://`
    }
    if (!safeAppUrl.endsWith('/')) {
      safeAppUrl = `${safeAppUrl}/`
    }
    // Android deeplinks in tg context require the uri to be encoded twice
    if (this.isTelegram() && this.isAndroid()) {
      // eslint-disable-next-line no-param-reassign
      wcUri = encodeURIComponent(wcUri)
    }
    const encodedWcUrl = encodeURIComponent(wcUri)

    return {
      redirect: `${safeAppUrl}wc?uri=${encodedWcUrl}`,
      href: safeAppUrl
    }
  },

  formatUniversalUrl(appUrl: string, wcUri: string): LinkingRecord {
    if (!CoreHelperUtil.isHttpUrl(appUrl)) {
      return this.formatNativeUrl(appUrl, wcUri)
    }
    let safeAppUrl = appUrl
    if (!safeAppUrl.endsWith('/')) {
      safeAppUrl = `${safeAppUrl}/`
    }
    const encodedWcUrl = encodeURIComponent(wcUri)

    return {
      redirect: `${safeAppUrl}wc?uri=${encodedWcUrl}`,
      href: safeAppUrl
    }
  },
  getOpenTargetForPlatform(target: string) {
    // Only '_blank' deeplinks work in Telegram context
    if (this.isTelegram()) {
      // But for social login, we need to load the page in the same context
      if (SafeLocalStorage.getItem(SafeLocalStorageKeys.SOCIAL_PROVIDER)) {
        return '_top'
      }

      return '_blank'
    }

    return target
  },
  openHref(
    href: string,
    target: '_top' | '_blank' | '_self' | 'popupWindow',
    features = 'noreferrer noopener'
  ) {
    window.open(href, this.getOpenTargetForPlatform(target), features)
  },
  returnOpenHref(
    href: string,
    target: '_top' | '_blank' | '_self' | 'popupWindow',
    features = 'noreferrer noopener'
  ) {
    return window.open(href, this.getOpenTargetForPlatform(target), features)
  },
  isTelegram() {
    return (
      typeof window !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Boolean((window as any).TelegramWebviewProxy) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Boolean((window as any).Telegram) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Boolean((window as any).TelegramWebviewProxyProto))
    )
  },
  formatTelegramSocialLoginUrl(url: string) {
    const valueToInject = `--${encodeURIComponent(window.location.href)}`
    const paramToInject = 'state='
    const parsedUrl = new URL(url)
    if (parsedUrl.host === 'auth.magic.link') {
      const providerParam = 'provider_authorization_url='
      const providerUrl = url.substring(url.indexOf(providerParam) + providerParam.length)
      const resultUrl = this.injectIntoUrl(
        decodeURIComponent(providerUrl),
        paramToInject,
        valueToInject
      )

      return url.replace(providerUrl, encodeURIComponent(resultUrl))
    }

    return this.injectIntoUrl(url, paramToInject, valueToInject)
  },
  injectIntoUrl(url: string, key: string, appendString: string) {
    // Find the position of "key" e.g. "state=" in the URL
    const keyIndex = url.indexOf(key)

    if (keyIndex === -1) {
      throw new Error(`${key} parameter not found in the URL: ${url}`)
    }

    // Find the position of the next "&" after "key"
    const keyEndIndex = url.indexOf('&', keyIndex)
    const keyLength = key.length
    // If there is no "&" after key, it means "key" is the last parameter
    // eslint-disable-next-line no-negated-condition
    const keyParamEnd = keyEndIndex !== -1 ? keyEndIndex : url.length
    // Extract the part of the URL before the key value
    const beforeKeyValue = url.substring(0, keyIndex + keyLength)
    // Extract the current key value
    const currentKeyValue = url.substring(keyIndex + keyLength, keyParamEnd)
    // Extract the part of the URL after the key value
    const afterKeyValue = url.substring(keyEndIndex)
    // Append the new string to the key value
    const newKeyValue = currentKeyValue + appendString
    // Reconstruct the URL with the appended key value
    const newUrl = beforeKeyValue + newKeyValue + afterKeyValue

    return newUrl
  },

  async preloadImage(src: string) {
    const imagePromise = new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = resolve
      image.onerror = reject
      image.crossOrigin = 'anonymous'
      image.src = src
    })

    return Promise.race([imagePromise, CoreHelperUtil.wait(2000)])
  },

  formatBalance(balance: string | undefined, symbol: string | undefined) {
    let formattedBalance = '0.000'

    if (typeof balance === 'string') {
      const number = Number(balance)
      if (number) {
        const formattedValue = Math.floor(number * 1000) / 1000
        if (formattedValue) {
          formattedBalance = formattedValue.toString()
        }
      }
    }

    return `${formattedBalance}${symbol ? ` ${symbol}` : ''}`
  },

  formatBalance2(balance: string | undefined, symbol: string | undefined) {
    let formattedBalance = undefined

    if (balance === '0') {
      formattedBalance = '0'
    } else if (typeof balance === 'string') {
      const number = Number(balance)
      if (number) {
        formattedBalance = number.toString().match(/^-?\d+(?:\.\d{0,3})?/u)?.[0]
      }
    }

    return {
      value: formattedBalance ?? '0',
      rest: formattedBalance === '0' ? '000' : '',
      symbol
    }
  },

  getApiUrl() {
    return CommonConstants.W3M_API_URL
  },

  getBlockchainApiUrl() {
    return CommonConstants.BLOCKCHAIN_API_RPC_URL
  },

  getAnalyticsUrl() {
    return CommonConstants.PULSE_API_URL
  },

  getUUID() {
    if (crypto?.randomUUID) {
      return crypto.randomUUID()
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/gu, c => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8

      return v.toString(16)
    })
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parseError(error: any): string {
    if (typeof error === 'string') {
      return error
    } else if (typeof error?.issues?.[0]?.message === 'string') {
      return error.issues[0].message
    } else if (error instanceof Error) {
      return error.message
    }

    return 'Unknown error'
  },

  sortRequestedNetworks(
    approvedIds: `${string}:${string}`[] | undefined,
    requestedNetworks: CaipNetwork[] = []
  ): CaipNetwork[] {
    const approvedIndexMap: Record<string, number> = {}

    if (requestedNetworks && approvedIds) {
      approvedIds.forEach((id, index) => {
        approvedIndexMap[id] = index
      })

      requestedNetworks.sort((a, b) => {
        const indexA = approvedIndexMap[a.id]
        const indexB = approvedIndexMap[b.id]

        if (indexA !== undefined && indexB !== undefined) {
          return indexA - indexB
        } else if (indexA !== undefined) {
          return -1
        } else if (indexB !== undefined) {
          return 1
        }

        return 0
      })
    }

    return requestedNetworks
  },

  calculateBalance(array: Balance[]) {
    let sum = 0
    for (const item of array) {
      sum += item.value ?? 0
    }

    return sum
  },

  formatTokenBalance(number: number) {
    const roundedNumber = number.toFixed(2)
    const [dollars, pennies] = roundedNumber.split('.')

    return { dollars, pennies }
  },

  isAddress(address: string, chain: ChainNamespace = 'eip155'): boolean {
    switch (chain) {
      case 'eip155':
        if (!/^(?:0x)?[0-9a-f]{40}$/iu.test(address)) {
          return false
        } else if (
          /^(?:0x)?[0-9a-f]{40}$/iu.test(address) ||
          /^(?:0x)?[0-9A-F]{40}$/iu.test(address)
        ) {
          return true
        }

        return false
      case 'solana':
        return /[1-9A-HJ-NP-Za-km-z]{32,44}$/iu.test(address)

      default:
        return false
    }
  },

  uniqueBy<T>(arr: T[], key: keyof T) {
    const set = new Set()

    return arr.filter(item => {
      const keyValue = item[key]
      if (set.has(keyValue)) {
        return false
      }
      set.add(keyValue)

      return true
    })
  },

  generateSdkVersion(
    adapters: ChainAdapter[],
    platform: SDKFramework,
    version: string
  ): AppKitSdkVersion {
    const noAdapters = adapters.length === 0
    const adapterNames = noAdapters
      ? 'universal'
      : adapters.map(adapter => adapter.adapterType).join(',')

    return `${platform}-${adapterNames}-${version}`
  }
}
