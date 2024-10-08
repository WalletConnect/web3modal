import { AppKit } from '../src/client.js'
import type { AppKitOptions } from '../src/utils/TypesUtil.js'
import packageJson from '../package.json' with { type: 'json' }
import { CoreHelperUtil } from '@reown/appkit-core'

// -- Views ------------------------------------------------------------
export * from '@reown/appkit-scaffold-ui'

// -- Utils & Other -----------------------------------------------------
export * from '../src/utils/index.js'
export type * from '@reown/appkit-core'
export type { CaipNetwork, CaipAddress, CaipNetworkId } from '@reown/appkit-common'
export { CoreHelperUtil, AccountController } from '@reown/appkit-core'

type CreateAppKit = Omit<AppKitOptions, 'sdkType' | 'sdkVersion'>

export function createAppKit(options: CreateAppKit) {
  return new AppKit({
    ...options,
    sdkVersion: CoreHelperUtil.generateSdkVersion(
      options.adapters ?? [],
      'html',
      packageJson.version
    )
  })
}

export { AppKit }
export type { AppKitOptions }
