import { AppKit } from '@reown/appkit'
import type { AppKitOptions } from '@reown/appkit'
import { WagmiAdapter, type AdapterOptions } from '@reown/appkit-adapter-wagmi'
import type { Config } from 'wagmi'
import packageJson from '../package.json' with { type: 'json' }

// -- Types -------------------------------------------------------------
export type { AdapterOptions } from '@reown/appkit-adapter-wagmi'

// -- Connectors --------------------------------------------------------
export { authConnector } from '@reown/appkit-adapter-wagmi'

// -- Setup -------------------------------------------------------------
export type WagmiAppKitOptions = Omit<AppKitOptions, 'adapters' | 'sdkType' | 'sdkVersion'> &
  AdapterOptions<Config>

export function createAppKit(options: WagmiAppKitOptions) {
  const wagmiAdapter = new WagmiAdapter({
    networks: options.networks,
    projectId: options.projectId
  })

  return new AppKit({
    ...options,
    sdkVersion: `html-wagmi-${packageJson.version}`,
    adapters: [wagmiAdapter]
  })
}
