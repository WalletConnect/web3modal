import { AppKit } from '../src/client.js'
import type { AppKitOptions } from '../src/utils/TypesUtil.js'

// -- Views ------------------------------------------------------------
export * from '@rerock/scaffold-ui'

// -- Utils & Other -----------------------------------------------------
export * from '../src/utils/index.js'
export type * from '@rerock/core'
export { CoreHelperUtil, AccountController, NetworkController } from '@rerock/core'

type CreateWeb3Modal = Omit<AppKitOptions, 'sdkType' | 'sdkVersion'>

export function createWeb3Modal(options: CreateWeb3Modal) {
  return new AppKit({
    ...options
  })
}

export { AppKit }
export type { AppKitOptions }
