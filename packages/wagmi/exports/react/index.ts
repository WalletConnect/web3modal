import { AppKit } from '@web3modal/base'
import type { AppKitOptions } from '@web3modal/base'
import { EVMWagmiClient, type AdapterOptions } from '@web3modal/adapter-wagmi'
import { getWeb3Modal } from '@web3modal/base/library/react'
import { type Config, type CreateConfigParameters } from 'wagmi'

// -- Setup -------------------------------------------------------------------
let appkit: AppKit | undefined = undefined

export type WagmiAppKitOptions = Omit<AppKitOptions, 'adapters' | 'sdkType' | 'sdkVersion'> &
  AdapterOptions<Config> & {
    wagmiConfig?: CreateConfigParameters
  }

export function createWeb3Modal(options: WagmiAppKitOptions) {
  const wagmiAdapter = new EVMWagmiClient(options.wagmiConfig)

  appkit = new AppKit({
    ...options,
    adapters: [wagmiAdapter]
  })
  getWeb3Modal(appkit)

  return appkit
}

// -- Hooks -------------------------------------------------------------------
export {
  useWeb3ModalTheme,
  useWeb3Modal,
  useWeb3ModalState,
  useWeb3ModalEvents,
  useWalletInfo
} from '@web3modal/base/library/react'
