import { ConstantsUtil } from '@web3modal/scaffold-utils'
import { AppKit } from '../src/client.js'
import type { AppKitOptions } from '../utils/TypesUtil.js'

// -- Views ------------------------------------------------------------
export * from '@web3modal/scaffold-ui'

// -- Utils & Other -----------------------------------------------------
export type * from '@web3modal/core'
export { CoreHelperUtil } from '@web3modal/core'

type CreateWeb3Modal = Omit<AppKitOptions, 'sdkType' | 'sdkVersion'>

export function createWeb3Modal(options: CreateWeb3Modal) {
  return new AppKit({
    ...options,
    sdkType: 'w3m',
    sdkVersion: `html-multichain-${ConstantsUtil.VERSION}`
  })
}

export { AppKit }
export type { AppKitOptions }
