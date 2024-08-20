import { expect, test, type BrowserContext } from '@playwright/test'
import { ModalWalletPage } from './shared/pages/ModalWalletPage'
import { Email } from './shared/utils/email'
import { ModalWalletValidator } from './shared/validators/ModalWalletValidator'
import { SECURE_WEBSITE_URL } from './shared/constants'

/* eslint-disable init-declarations */
let page: ModalWalletPage
let validator: ModalWalletValidator
let context: BrowserContext
/* eslint-enable init-declarations */

// -- Setup --------------------------------------------------------------------
const smartAccountSiweTest = test.extend<{ library: string }>({
  library: ['wagmi', { option: true }]
})

smartAccountSiweTest.describe.configure({ mode: 'serial' })

smartAccountSiweTest.beforeAll(async ({ browser, library }) => {
  smartAccountSiweTest.setTimeout(180000)
  context = await browser.newContext()
  const browserPage = await context.newPage()

  page = new ModalWalletPage(browserPage, library, 'all')
  validator = new ModalWalletValidator(browserPage)

  await page.load()

  const mailsacApiKey = process.env['MAILSAC_API_KEY']
  if (!mailsacApiKey) {
    throw new Error('MAILSAC_API_KEY is not set')
  }
  const email = new Email(mailsacApiKey)

  // Switch to a SA enabled network
  await validator.expectDisconnected()
  await page.switchNetworkWithNetworkButton('Polygon')
  await page.closeModal()
  const tempEmail = await email.getEmailAddressToUse()
  await page.emailFlow(tempEmail, context, mailsacApiKey)
  await page.promptSiwe()
  await page.approveSign()

  await validator.expectConnected()
  await validator.expectAuthenticated()
})

smartAccountSiweTest.afterAll(async () => {
  await page.page.close()
})

// -- Tests --------------------------------------------------------------------
smartAccountSiweTest('it should sign with siwe + smart account', async () => {
  await page.sign()
  await page.approveSign()
  await validator.expectAcceptedSign()
})

smartAccountSiweTest('it should upgrade wallet', async () => {
  const walletUpgradePage = await page.clickWalletUpgradeCard(context)
  expect(walletUpgradePage.url()).toContain(SECURE_WEBSITE_URL)
  await walletUpgradePage.close()
  await page.closeModal()
})

smartAccountSiweTest(
  'it should switch to a smart account enabled network and sign',
  async ({ library }) => {
    const targetChain = 'Sepolia'
    await page.goToSettings()
    await page.switchNetwork(targetChain)
    await page.promptSiwe()
    await page.approveSign()
    if (library === 'wagmi') {
      await page.goToSettings()
    }
    await validator.expectSwitchedNetwork(targetChain)
    await page.closeModal()
    await page.sign()
    await page.approveSign()
    await validator.expectAcceptedSign()
  }
)

/**
 * After switching to Etherum, the signing the SIWE throws the following Magic error:
 * "Magic RPC Error: [-32603] Internal error: User denied signing."
 */
smartAccountSiweTest.skip(
  'it should switch to a not enabled network and sign with EOA',
  async () => {
    const targetChain = 'Ethereum'
    await page.goToSettings()
    await page.switchNetwork(targetChain)
    /*
     * Flaky as network switch to non-enabled network changes network AND address causing 2 siwe popups
     * Test goes too fast and the second siwe popup is not handled
     */
    await page.page.waitForTimeout(1000)
    await page.promptSiwe()
    await page.approveSign()
    await validator.expectSwitchedNetwork(targetChain)
    // Shouldn't show the toggle on a non enabled network
    await validator.expectTogglePreferredTypeVisible(false)
    await page.closeModal()

    await page.sign()
    await page.approveSign()
    await validator.expectAcceptedSign()
  }
)

smartAccountSiweTest('it should disconnect correctly', async () => {
  await page.goToSettings()
  await page.disconnect()
  await validator.expectDisconnected()
})
