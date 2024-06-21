/* eslint-disable no-await-in-loop */
import type { BrowserContext, Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BASE_URL } from '../constants'
import { doActionAndWaitForNewPage } from '../utils/actions'
import { Email } from '../utils/email'
import { DeviceRegistrationPage } from './DeviceRegistrationPage'
import type { TimingRecords } from '../fixtures/timing-fixture'

export type ModalFlavor = 'default' | 'siwe' | 'email' | 'wallet' | 'external' | 'all'

function getUrlByFlavor(baseUrl: string, library: string, flavor: ModalFlavor) {
  const urlsByFlavor: Partial<Record<ModalFlavor, string>> = {
    default: `${baseUrl}library/${library}/`,
    external: `${baseUrl}library/external/`
  }

  return urlsByFlavor[flavor] || `${baseUrl}library/${library}-${flavor}/`
}

export class ModalPage {
  private readonly baseURL = BASE_URL

  private readonly connectButton: Locator
  private readonly url: string
  private emailAddress = ''

  constructor(
    public readonly page: Page,
    public readonly library: string,
    public readonly flavor: ModalFlavor
  ) {
    this.connectButton = this.page.getByTestId('connect-button')
    this.url = getUrlByFlavor(this.baseURL, library, flavor)
  }

  async load() {
    await this.page.goto(this.url)
  }

  assertDefined<T>(value: T | undefined | null): T {
    expect(value).toBeDefined()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return value!
  }

  async getConnectUri(timingRecords?: TimingRecords): Promise<string> {
    await this.page.goto(this.url)
    await this.connectButton.click()
    const connect = this.page.getByTestId('wallet-selector-walletconnect')
    await connect.waitFor({
      state: 'visible',
      timeout: 5000
    })
    await connect.click()
    const qrLoadInitiatedTime = new Date()

    // Using getByTestId() doesn't work on my machine, I'm guessing because this element is inside of a <slot>
    const qrCode = this.page.locator('wui-qr-code')
    await expect(qrCode).toBeVisible()

    const uri = this.assertDefined(await qrCode.getAttribute('uri'))
    const qrLoadedTime = new Date()
    if (timingRecords) {
      timingRecords.push({
        item: 'qrLoad',
        timeMs: qrLoadedTime.getTime() - qrLoadInitiatedTime.getTime()
      })
    }

    return uri
  }

  async connectMetamask() {
    await this.page.goto(this.url)
    await this.connectButton.click()
    await expect(this.page.getByText('MetaMask')).toBeVisible()
    const mmButton = this.page.getByTestId('wallet-selector-io.metamask')
    await expect(mmButton).toBeVisible()
    await mmButton.click()
    await expect(this.page.getByText('Continue in MetaMask')).toBeVisible()
  }

  async emailFlow(
    emailAddress: string,
    context: BrowserContext,
    mailsacApiKey: string
  ): Promise<void> {
    this.emailAddress = emailAddress

    const email = new Email(mailsacApiKey)

    await email.deleteAllMessages(emailAddress)
    await this.loginWithEmail(emailAddress)

    let messageId = await email.getLatestMessageId(emailAddress)

    if (!messageId) {
      throw new Error('No messageId found')
    }
    let emailBody = await email.getEmailBody(emailAddress, messageId)
    let otp = ''
    if (email.isApproveEmail(emailBody)) {
      const url = email.getApproveUrlFromBody(emailBody)

      await email.deleteAllMessages(emailAddress)

      const drp = new DeviceRegistrationPage(await context.newPage(), url)
      drp.load()
      await drp.approveDevice()
      await drp.close()

      messageId = await email.getLatestMessageId(emailAddress)

      emailBody = await email.getEmailBody(emailAddress, messageId)
      if (!email.isApproveEmail(emailBody)) {
        otp = email.getOtpCodeFromBody(emailBody)
      }
    }

    if (otp === '') {
      otp = email.getOtpCodeFromBody(emailBody)
    }

    await this.enterOTP(otp)
  }

  async loginWithEmail(email: string) {
    // Connect Button doesn't have a proper `disabled` attribute so we need to wait for the button to change the text
    await this.page
      .getByTestId('connect-button')
      .getByRole('button', { name: 'Connect Wallet' })
      .click()
    await this.page.getByTestId('wui-email-input').locator('input').focus()
    await this.page.getByTestId('wui-email-input').locator('input').fill(email)
    await this.page.getByTestId('wui-email-input').locator('input').press('Enter')
    await expect(
      this.page.getByText(email),
      `Expected current email: ${email} to be visible on the notification screen`
    ).toBeVisible({
      timeout: 20_000
    })
  }

  async loginWithSocial(socialMail: string, socialPass: string) {
    const authFile = 'playwright/.auth/user.json'
    await this.page
      .getByTestId('connect-button')
      .getByRole('button', { name: 'Connect Wallet' })
      .click()
    const discordPopupPromise = this.page.waitForEvent('popup')
    await this.page.getByTestId('social-selector-discord').click()
    const discordPopup = await discordPopupPromise
    await discordPopup.fill('#uid_8', socialMail)
    await discordPopup.fill('#uid_10', socialPass)
    await discordPopup.locator('[type=submit]').click()
    await discordPopup.locator('.footer_b96583 button:nth-child(2)').click()
    await discordPopup.context().storageState({ path: authFile })
    await discordPopup.waitForEvent('close')
  }

  async enterOTP(otp: string, headerTitle = 'Confirm Email') {
    await expect(this.page.getByText(headerTitle)).toBeVisible({
      timeout: 10_000
    })
    await expect(this.page.getByText('Enter the code we sent')).toBeVisible({
      timeout: 10_000
    })

    const splitted = otp.split('')

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < splitted.length; i++) {
      const digit = splitted[i]
      if (!digit) {
        throw new Error('Invalid OTP')
      }
      const otpInput = this.page.getByTestId('wui-otp-input')
      const wrapper = otpInput.locator('wui-input-numeric').nth(i)
      await expect(wrapper, `Wrapper element for input ${i} should be visible`).toBeVisible({
        timeout: 5000
      })
      const input = wrapper.locator('input')
      await expect(input, `Input ${i} should be enabled`).toBeEnabled({
        timeout: 5000
      })
      await input.fill(digit)
    }

    await expect(this.page.getByText(headerTitle)).not.toBeVisible()
  }

  async disconnect() {
    const accountBtn = this.page.getByTestId('account-button')
    await expect(accountBtn, 'Account button should be visible').toBeVisible()
    await expect(accountBtn, 'Account button should be enabled').toBeEnabled()
    await accountBtn.click()
    const disconnectBtn = this.page.getByTestId('disconnect-button')
    await expect(disconnectBtn, 'Disconnect button should be visible').toBeVisible()
    await expect(disconnectBtn, 'Disconnect button should be enabled').toBeEnabled()
    await disconnectBtn.click()
  }

  async sign() {
    const signButton = this.page.getByTestId('sign-message-button')
    await signButton.scrollIntoViewIfNeeded()
    await signButton.click()
  }

  async signatureRequestFrameShouldVisible() {
    await expect(
      this.page.frameLocator('#w3m-iframe').getByText('requests a signature'),
      'Web3Modal iframe should be visible'
    ).toBeVisible({
      timeout: 10000
    })
    await this.page.waitForTimeout(2000)
  }

  async clickSignatureRequestButton(name: string) {
    await this.page.frameLocator('#w3m-iframe').getByRole('button', { name, exact: true }).click()
  }

  async approveSign() {
    await this.signatureRequestFrameShouldVisible()
    await this.clickSignatureRequestButton('Sign')
  }

  async rejectSign() {
    await this.signatureRequestFrameShouldVisible()
    await this.clickSignatureRequestButton('Cancel')
  }

  async clickWalletUpgradeCard(context: BrowserContext) {
    await this.page.getByTestId('account-button').click()

    await this.page.getByTestId('w3m-profile-button').click()
    await this.page.getByTestId('w3m-wallet-upgrade-card').click()

    const page = await doActionAndWaitForNewPage(
      this.page.getByTestId('w3m-secure-website-button').click(),
      context
    )

    return page
  }

  async promptSiwe() {
    const siweSign = this.page.getByTestId('w3m-connecting-siwe-sign')
    await expect(siweSign, 'Siwe prompt sign button should be visible').toBeVisible({
      timeout: 10_000
    })
    await expect(siweSign, 'Siwe prompt sign button should be enabled').toBeEnabled()
    await siweSign.click()
  }

  async cancelSiwe() {
    await this.page.getByTestId('w3m-connecting-siwe-cancel').click()
  }

  async switchNetwork(network: string) {
    await this.page.getByTestId('account-button').click()
    await this.page.getByTestId('w3m-account-select-network').click()
    await this.page.getByTestId(`w3m-network-switch-${network}`).click()
  }

  async clickWalletDeeplink() {
    await this.connectButton.click()
    await this.page.getByTestId('wallet-selector-react-wallet-v2').click()
    await this.page.getByTestId('tab-desktop').click()
  }

  async openAccount() {
    await this.page.getByTestId('account-button').click()
  }

  async closeModal() {
    await this.page.getByTestId('w3m-header-close')?.click?.()
    // Wait for the modal fade out animation
    await this.page.waitForTimeout(300)
  }

  async updateEmail(mailsacApiKey: string, index: number) {
    const email = new Email(mailsacApiKey)
    const newEmailAddress = email.getEmailAddressToUse(index)

    await this.page.getByTestId('account-button').click()
    await this.page.getByTestId('w3m-account-email-update').click()
    await this.page.getByTestId('wui-email-input').locator('input').focus()
    await this.page.getByTestId('wui-email-input').locator('input').fill(newEmailAddress)

    // Clear messages before putting new email
    await email.deleteAllMessages(this.emailAddress)
    await this.page.getByTestId('wui-email-input').locator('input').press('Enter')

    // Wait until the next screen appears
    await expect(this.page.getByText('Enter the code we sent')).toBeVisible({
      timeout: 20_000
    })
    const confirmCurrentEmail = await this.page.getByText('Confirm Current Email').isVisible()
    if (confirmCurrentEmail) {
      await this.updateOtpFlow(this.emailAddress, mailsacApiKey, 'Confirm Current Email')
    }

    await this.updateOtpFlow(newEmailAddress, mailsacApiKey, 'Confirm New Email')

    expect(
      this.page.getByTestId('w3m-account-email-update'),
      `Expected to go to the account screen after the update`
    ).toBeVisible()

    await expect(this.page.getByText(newEmailAddress)).toBeVisible()
  }

  async updateOtpFlow(emailAddress: string, mailsacApiKey: string, headerTitle: string) {
    const email = new Email(mailsacApiKey)

    const messageId = await email.getLatestMessageId(emailAddress)

    if (!messageId) {
      throw new Error('No messageId found')
    }
    const emailBody = await email.getEmailBody(emailAddress, messageId)
    const otp = email.getOtpCodeFromBody(emailBody)

    await this.enterOTP(otp, headerTitle)
  }
}
