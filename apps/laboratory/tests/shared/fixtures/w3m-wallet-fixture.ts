/* eslint no-console: 0 */

import { testM as base, testMSiwe as siwe } from './w3m-fixture'
import { WalletPage } from '../pages/WalletPage'
import { WalletValidator } from '../validators/WalletValidator'

import { DEFAULT_SESSION_PARAMS } from '../constants'
import { doActionAndWaitForNewPage } from '../utils/actions'

// Declare the types of fixtures to use
interface ModalWalletFixture {
  walletPage: WalletPage
  walletValidator: WalletValidator
}

// MW -> test Modal + Wallet
export const testConnectedMW = base.extend<ModalWalletFixture>({
  walletPage: async ({ context, modalPage }, use) => {
    if (modalPage.library === 'solana') {
      // Because solana doesn't support react-wallet-v2
      console.time('new WalletPage')
      const walletPage = new WalletPage(await context.newPage())
      console.timeEnd('new WalletPage')
      console.time('walletPage.load')
      await walletPage.load()
      console.timeEnd('walletPage.load')
      console.time('walletPage.connectWithUri')
      const walletValidator = new WalletValidator(walletPage.page)
      console.timeEnd('walletPage.connectWithUri')
      console.time('modalPage.getConnectUri')
      const uri = await modalPage.getConnectUri()
      console.timeEnd('modalPage.getConnectUri')
      console.time('walletPage.connectWithUri')
      await walletPage.connectWithUri(uri)
      console.timeEnd('walletPage.connectWithUri')
      console.time('walletPage.handleSessionProposal')
      await walletPage.handleSessionProposal(DEFAULT_SESSION_PARAMS)
      console.timeEnd('walletPage.handleSessionProposal')
      console.time('walletValidator.expectConnected')
      await walletValidator.expectConnected()
      console.timeEnd('walletValidator.expectConnected')
      await use(walletPage)
    } else {
      console.time('doActionAndWaitForNewPage')
      const page = await doActionAndWaitForNewPage(modalPage.clickWalletDeeplink(), context)
      console.timeEnd('doActionAndWaitForNewPage')
      console.time('new WalletPage')
      const walletPage = new WalletPage(page)
      console.timeEnd('new WalletPage')
      console.time('walletPage.handleSessionProposal')
      await walletPage.handleSessionProposal(DEFAULT_SESSION_PARAMS)
      console.timeEnd('walletPage.handleSessionProposal')
      await use(walletPage)
    }
  },
  walletValidator: async ({ walletPage }, use) => {
    console.time('new WalletValidator')
    const walletValidator = new WalletValidator(walletPage.page)
    console.timeEnd('new WalletValidator')
    await use(walletValidator)
  }
})
export const testMWSiwe = siwe.extend<ModalWalletFixture>({
  walletPage: async ({ context }, use) => {
    const walletPage = new WalletPage(await context.newPage())
    await walletPage.load()
    await use(walletPage)
  },
  walletValidator: async ({ walletPage }, use) => {
    const walletValidator = new WalletValidator(walletPage.page)
    await use(walletValidator)
  }
})

export { expect } from '@playwright/test'
