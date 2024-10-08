import { AppKit } from '@reown/appkit'
import type { AppKitOptions } from '@reown/appkit'
import { EthersAdapter, type AdapterOptions } from '@reown/appkit-adapter-ethers'
import packageJson from '../package.json' with { type: 'json' }

// -- Types -------------------------------------------------------------
export type { AdapterOptions } from '@reown/appkit-adapter-ethers'

// -- Setup -------------------------------------------------------------
export type EthersAppKitOptions = Omit<AppKitOptions, 'adapters' | 'sdkType' | 'sdkVersion'> &
  AdapterOptions

export function createAppKit(options: EthersAppKitOptions) {
  const ethersAdapter = new EthersAdapter()

  return new AppKit({
    ...options,
    sdkVersion: `html-ethers-${packageJson.version}`,
    adapters: [ethersAdapter]
  })
}
