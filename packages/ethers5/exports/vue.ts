import { AppKit } from '@reown/appkit'
import type { AppKitOptions } from '@reown/appkit'
import { Ethers5Adapter, type AdapterOptions } from '@reown/appkit-adapter-ethers5'

import { getAppKit } from '@reown/appkit/library/vue'
import packageJson from '../package.json' with { type: 'json' }

// -- Setup -------------------------------------------------------------------
let appkit: AppKit | undefined = undefined
let ethersAdapter: Ethers5Adapter | undefined = undefined

type EthersAppKitOptions = Omit<AppKitOptions, 'adapters' | 'sdkType' | 'sdkVersion'> &
  AdapterOptions

export function createAppKit(options: EthersAppKitOptions) {
  ethersAdapter = new Ethers5Adapter()
  appkit = new AppKit({
    ...options,
    sdkVersion: `vue-ethers5-${packageJson.version}`,
    adapters: [ethersAdapter]
  })
  getAppKit(appkit)

  return appkit
}

// -- Composites --------------------------------------------------------------
export function useAppKitProvider() {
  // Implement this
}

export function useDisconnect() {
  async function disconnect() {
    await ethersAdapter?.disconnect()
  }

  return {
    disconnect
  }
}

export function useSwitchNetwork() {
  // Implement this
}

export function useAppKitAccount() {
  // Implement this
}

export function useAppKitError() {
  // Implement this
}

export {
  useAppKitTheme,
  useAppKit,
  useAppKitState,
  useAppKitEvents,
  useWalletInfo
} from '@reown/appkit/library/vue'
