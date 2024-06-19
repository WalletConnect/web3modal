import type { WcWallet } from '@web3modal/core'

export function filterWalletsWithUniversalLink(wallets: WcWallet[]) {
  const walletWithUniversalLink = wallets.filter(w => w.link_mode)

  return walletWithUniversalLink
}
