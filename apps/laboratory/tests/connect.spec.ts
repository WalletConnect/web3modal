import { DEFAULT_SESSION_PARAMS } from './shared/constants'
import { testMW } from './shared/fixtures/w3m-wallet-fixture'

testMW.beforeEach(async ({ modalPage, walletPage, modalValidator, walletValidator }) => {
  await modalPage.copyConnectUriToClipboard()
  await walletPage.connect()
  await walletPage.handleSessionProposal(DEFAULT_SESSION_PARAMS)
  await modalValidator.expectConnected()
  await walletValidator.expectConnected()
})

testMW.afterEach(async ({ modalPage, modalValidator, walletValidator }) => {
  await modalPage.disconnect()
  await modalValidator.expectDisconnected()
  await walletValidator.expectDisconnected()
})

testMW('it should sign', async ({ modalPage, walletPage, modalValidator, walletValidator }) => {
  await modalPage.sign()
  await walletValidator.expectReceivedSign({})
  await walletPage.handleRequest({ accept: true })
  await modalValidator.expectAcceptedSign()
})

testMW(
  'it should reject sign',
  async ({ modalPage, walletPage, modalValidator, walletValidator }) => {
    await modalPage.sign()
    await walletValidator.expectReceivedSign({})
    await walletPage.handleRequest({ accept: false })
    await modalValidator.expectRejectedSign()
  }
)
