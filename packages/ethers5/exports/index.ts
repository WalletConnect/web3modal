import { AppKit } from '@reown/appkit'
import type { AppKitOptions } from '@reown/appkit'
import { Ethers5Adapter, type AdapterOptions } from '@reown/appkit-adapter-ethers5'
import packageJson from '../package.json' with { type: 'json' }

// -- Types -------------------------------------------------------------
export type { AdapterOptions } from '@reown/appkit-adapter-ethers5'

// -- Setup -------------------------------------------------------------
type EthersAppKitOptions = Omit<AppKitOptions, 'adapters' | 'sdkType' | 'sdkVersion'> &
  AdapterOptions

export function createAppKit(options: EthersAppKitOptions) {
  const ethers5Adapter = new Ethers5Adapter()

  return new AppKit({
    ...options,
    sdkVersion: `html-ethers5-${packageJson.version}`,
    adapters: [ethers5Adapter]
  })
}
