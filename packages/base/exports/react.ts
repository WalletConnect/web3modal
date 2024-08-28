import { AppKit } from '../src/client.js'
import type { AppKitOptions } from '../utils/TypesUtil.js'
import { getWeb3Modal } from '../utils/library/react/index.js'

// -- Views ------------------------------------------------------------
export * from '@web3modal/scaffold-ui'

// -- Hooks ------------------------------------------------------------
export * from '../utils/library/react/index.js'

// -- Utils & Other -----------------------------------------------------
export type * from '@web3modal/core'
export { CoreHelperUtil, AccountController, NetworkController } from '@web3modal/core'

export let modal: AppKit | undefined = undefined

type CreateWeb3Modal = Omit<AppKitOptions, 'sdkType' | 'sdkVersion'>

export function createWeb3Modal(options: CreateWeb3Modal) {
  if (!modal) {
    modal = new AppKit(options)
    getWeb3Modal(modal)
  }

  return modal
}

export { AppKit }
export type { AppKitOptions }

// -- Hooks ------------------------------------------------------------
export * from '../utils/library/react/index.js'
export { useWeb3ModalAccount, useWeb3ModalNetwork } from '@web3modal/core/react'
