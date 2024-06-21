import { testMetamask } from './shared/fixtures/w3m-metamask-fixture'

testMetamask.beforeEach(({ browserName }) => {
  if (browserName !== 'chromium') {
    testMetamask.skip()
  }
})

testMetamask.afterEach(async ({ modalPage, modalValidator }) => {
  await modalPage.disconnect()
  await modalValidator.expectDisconnected()
})
testMetamask(
  'it should be able to connect with metamask',
  async ({ modalPage, wallet, modalValidator }) => {
    await modalPage.connectMetamask()
    await wallet.approve()
    await modalValidator.expectConnected()
  }
)
