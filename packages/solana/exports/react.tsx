'use client'

import { AppKit } from '@reown/appkit'
import {
  SolanaWeb3JsClient,
  type Provider,
  useAppKitConnection
} from '@reown/appkit-adapter-solana/react'
import { getAppKit } from '@reown/appkit/library/react'
import type { SolanaAppKitOptions } from './options.js'
import packageJson from '../package.json' assert { type: 'json' }

// -- Types -------------------------------------------------------------------
export type { SolanaAppKitOptions, Provider }

// -- Setup -------------------------------------------------------------
let appkit: AppKit | undefined = undefined
let solanaAdapter: SolanaWeb3JsClient | undefined = undefined

export function createAppKit(options: SolanaAppKitOptions) {
  solanaAdapter = new SolanaWeb3JsClient({
    wallets: options.wallets
  })
  appkit = new AppKit({
    ...options,
    sdkVersion: `react-solana-${packageJson.version}`,
    adapters: [solanaAdapter]
  })
  getAppKit(appkit)

  return appkit
}

// -- Hooks -------------------------------------------------------------------
export function useDisconnect() {
  async function disconnect() {
    await solanaAdapter?.connectionControllerClient?.disconnect()
  }

  return {
    disconnect
  }
}

export {
  useAppKitTheme,
  useAppKit,
  useAppKitState,
  useAppKitEvents
} from '@reown/appkit/library/react'
export { useAppKitConnection }
