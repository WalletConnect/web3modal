import { AppKit } from '@reown/appkit'
import type { AppKitOptions } from '@reown/appkit'
import { EthersAdapter, type AdapterOptions } from '@reown/appkit-adapter-ethers'
import { getAppKit } from '@reown/appkit/library/vue'
import packageJson from '../package.json' with { type: 'json' }

// -- Types -------------------------------------------------------------
export type { AdapterOptions } from '@reown/appkit-adapter-ethers'

// -- Setup -------------------------------------------------------------------
let appkit: AppKit | undefined = undefined
let ethersAdapter: EthersAdapter | undefined = undefined

type EthersAppKitOptions = Omit<AppKitOptions, 'adapters' | 'sdkType' | 'sdkVersion'> &
  AdapterOptions

export function createAppKit(options: EthersAppKitOptions) {
  ethersAdapter = new EthersAdapter()
  appkit = new AppKit({
    ...options,
    sdkVersion: `vue-ethers-${packageJson.version}`,
    adapters: [ethersAdapter]
  })
  getAppKit(appkit)

  return appkit
}

// -- Composites --------------------------------------------------------------
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
  // Reimplement this
}

export function useAppKitError() {
  // Reimplement this
}

export {
  useAppKitTheme,
  useAppKit,
  useAppKitState,
  useAppKitEvents,
  useWalletInfo
} from '@reown/appkit/library/vue'
