/* eslint no-console: 0 */

import { testM as base, testMSiwe as siwe, testMultiChainM as multiChain } from './w3m-fixture'
import { WalletPage } from '../pages/WalletPage'
import { WalletValidator } from '../validators/WalletValidator'

import { DEFAULT_SESSION_PARAMS } from '../constants'
import { timeEnd, timeStart } from '../utils/logs'

// Declare the types of fixtures to use
interface ModalWalletFixture {
  walletPage: WalletPage
  walletValidator: WalletValidator
}

// MW -> test Modal + Wallet
export const testConnectedMW = base.extend<ModalWalletFixture>({
  walletPage: async ({ context, modalPage, timingRecords }, use) => {
    // Setup
    let pairingCreatedTime: Date | null = null
    let verificationStartedTime: Date | null = null

    timeStart('new WalletPage')
    const walletPage = new WalletPage(await context.newPage())
    timeEnd('new WalletPage')

    walletPage.page.on('console', msg => {
      if (msg.text().includes('set') && msg.text().includes('core/pairing/pairing')) {
        pairingCreatedTime = new Date()
      }
      if (msg.text().includes('resolving attestation')) {
        verificationStartedTime = new Date()
      }
      if (msg.text().includes('session_proposal') && msg.text().includes('verifyContext')) {
        // For some reason this log is emitted twice; so only recording the time once
        if (verificationStartedTime) {
          const verificationEndedTime = new Date()
          timingRecords.push({
            item: 'sessionProposalVerification',
            timeMs: verificationEndedTime.getTime() - verificationStartedTime.getTime()
          })
          verificationStartedTime = null
        }
      }
    })

    timeStart('walletPage.load')
    await walletPage.load()
    timeEnd('walletPage.load')

    // Initiate connection
    timeStart('modalPage.getConnectUri')
    const uri = await modalPage.getConnectUri(timingRecords)
    timeEnd('modalPage.getConnectUri')

    timeStart('walletPage.connectWithUri')
    await walletPage.connectWithUri(uri)
    timeEnd('walletPage.connectWithUri')

    const connectionInitiated = new Date()

    // Handle session proposal
    timeStart('walletPage.handleSessionProposal')
    await walletPage.handleSessionProposal(DEFAULT_SESSION_PARAMS)
    timeEnd('walletPage.handleSessionProposal')

    const proposalReceived = new Date()

    timingRecords.push({
      item: 'receiveSessionProposal',
      timeMs: proposalReceived.getTime() - connectionInitiated.getTime()
    })

    if (pairingCreatedTime) {
      timingRecords.push({
        item: 'pairingReceiveSessionProposal',
        timeMs: proposalReceived.getTime() - (pairingCreatedTime as Date).getTime()
      })
    }

    const walletValidator = new WalletValidator(walletPage.page)

    timeStart('walletValidator.expectConnected')
    await walletValidator.expectConnected()
    timeEnd('walletValidator.expectConnected')

    await use(walletPage)
  }
})

export const testMWSiwe = siwe.extend<ModalWalletFixture>({
  walletPage: async ({ context }, use) => {
    const walletPage = new WalletPage(await context.newPage())
    await walletPage.load()
    await use(walletPage)
  }
})

export const testMWMultiChain = multiChain.extend<ModalWalletFixture>({
  walletPage: async ({ context, modalPage, modalValidator }, use) => {
    const walletPage = new WalletPage(await context.newPage())
    await walletPage.load()
    const uri = await modalPage.getConnectUri()
    await walletPage.connectWithUri(uri)
    await walletPage.handleSessionProposal(DEFAULT_SESSION_PARAMS)
    await modalValidator.expectConnected()
    await use(walletPage)
  },
  walletValidator: async ({ walletPage }, use) => {
    const walletValidator = new WalletValidator(walletPage.page)
    await use(walletValidator)
  }
})

export { expect } from '@playwright/test'
