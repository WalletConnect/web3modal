import { AppKit } from '@web3modal/base'
import type { AppKitOptions } from '@web3modal/base'
import { SolanaWeb3JsClient } from '@web3modal/base/adapters/solana/web3js'
import type { Chain, ProviderType, BaseWalletAdapter } from '@web3modal/base/adapters/solana/web3js'
import { ConstantsUtil } from '@web3modal/scaffold-utils'

// -- Configs -----------------------------------------------------------
export { defaultSolanaConfig } from '@web3modal/base/adapters/solana/web3js'

// -- Setup -------------------------------------------------------------
type SolanaAppKitOptions = Omit<AppKitOptions, 'adapters' | 'sdkType' | 'sdkVersion'> & {
  solanaConfig: ProviderType
  chains: Chain[]
  wallets: BaseWalletAdapter[]
}

export function createWeb3Modal(options: SolanaAppKitOptions) {
  const wagmiAdapter = new SolanaWeb3JsClient({
    solanaConfig: options.solanaConfig,
    chains: options.chains,
    wallets: options.wallets,
    projectId: options.projectId
  })

  return new AppKit({
    ...options,
    adapters: [wagmiAdapter],
    sdkType: 'w3m',
    sdkVersion: `html-solana-${ConstantsUtil.VERSION}`
  })
}
