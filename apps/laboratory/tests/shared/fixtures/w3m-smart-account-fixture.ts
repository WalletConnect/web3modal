import { test as base } from '@playwright/test'
import type { ModalFixture } from './w3m-fixture'
import { DeviceRegistrationPage } from '../pages/DeviceRegistrationPage'
import { Email } from '../utils/email'
import { ModalWalletPage } from '../pages/ModalWalletPage'
import { ModalWalletValidator } from '../validators/ModalWalletValidator'

const mailsacApiKey = process.env['MAILSAC_API_KEY']
if (!mailsacApiKey) {
  throw new Error('MAILSAC_API_KEY is not set')
}

// Test Modal + Smart Account
export const testModalSmartAccount = base.extend<ModalFixture>({
  library: ['wagmi', { option: true }],
  modalPage: async ({ page, library, context }, use, testInfo) => {
    const modalPage = new ModalWalletPage(page, library)
    await modalPage.load()

    const email = new Email(mailsacApiKey)

    const tempEmail = email.getEmailAddressToUse(testInfo.parallelIndex)

    await email.deleteAllMessages(tempEmail)
    await modalPage.loginWithEmail(tempEmail)

    let messageId = await email.getLatestMessageId(tempEmail)

    if (!messageId) {
      throw new Error('No messageId found')
    }
    let emailBody = await email.getEmailBody(tempEmail, messageId)
    let otp = ''
    if (email.isApproveEmail(emailBody)) {
      const url = email.getApproveUrlFromBody(emailBody)

      await email.deleteAllMessages(tempEmail)

      const drp = new DeviceRegistrationPage(await context.newPage(), url)
      drp.load()
      await drp.approveDevice()
      await drp.close()

      messageId = await email.getLatestMessageId(tempEmail)

      emailBody = await email.getEmailBody(tempEmail, messageId)
      if (!email.isApproveEmail(emailBody)) {
        otp = email.getOtpCodeFromBody(emailBody)
      }
    }
    if (otp.length !== 6) {
      otp = email.getOtpCodeFromBody(emailBody)
    }
    await modalPage.enterOTP(otp)
    await modalPage.switchNetwork('Sepolia')
    await modalPage.page.waitForTimeout(1500)
    await use(modalPage)
  },
  modalValidator: async ({ modalPage }, use) => {
    const modalValidator = new ModalWalletValidator(modalPage.page)
    await use(modalValidator)
  }
})
