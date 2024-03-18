import { test as base } from '@playwright/test'
import type { ModalFixture } from './w3m-fixture'
import { ModalPage } from '../pages/ModalPage'
import { ModalValidator } from '../validators/ModalValidator'
import { DeviceRegistrationPage } from '../pages/DeviceRegistrationPage'
import { Email } from '../utils/email'

export const testMEmail = base.extend<ModalFixture>({
  library: ['wagmi', { option: true }],
  modalPage: async ({ page, library, context }, use, testInfo) => {
    const modalPage = new ModalPage(page, library, 'email')
    await modalPage.load()

    const mailsacApiKey = process.env['MAILSAC_API_KEY']
    if (!mailsacApiKey) {
      throw new Error('MAILSAC_API_KEY is not set')
    }
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

    await use(modalPage)
  },
  modalValidator: async ({ modalPage }, use) => {
    const modalValidator = new ModalValidator(modalPage.page)
    await use(modalValidator)
  }
})
