import dappwright, { MetaMaskWallet } from '@tenkeylabs/dappwright'
import { testM as base } from './w3m-fixture'
import type { BrowserContext } from '@playwright/test'

interface ModalMetamaskFixture {
  context: BrowserContext
  wallet: MetaMaskWallet
}

export const testMetamask = base.extend<ModalMetamaskFixture>({
  // eslint-disable-next-line
  context: async ({}, use) => {
    // eslint-disable-next-line
    const [wallet, _, context] = await dappwright.bootstrap('', {
      wallet: 'metamask',
      version: MetaMaskWallet.recommendedVersion,
      seed: 'test test test test test test test test test test test junk',
      headless: false
    })

    await use(context)
  },
  wallet: async ({ context }, use) => {
    const metamask = await dappwright.getWallet('metamask', context)

    await use(metamask)
  }
})
