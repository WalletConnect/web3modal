/* eslint-disable no-await-in-loop */
import type { BrowserContext, Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BASE_URL, DEFAULT_SESSION_PARAMS } from '../constants'
import { doActionAndWaitForNewPage } from '../utils/actions'
import { Email } from '../utils/email'
import { DeviceRegistrationPage } from './DeviceRegistrationPage'
import type { TimingRecords } from '../fixtures/timing-fixture'
import { WalletPage } from './WalletPage'
import { WalletValidator } from '../validators/WalletValidator'
import { routeInterceptUrl } from '../utils/verify'

const maliciousUrl = 'https://malicious-app-verify-simulation.vercel.app'

export type ModalFlavor =
  | 'default'
  | 'external'
  | 'wagmi-verify-valid'
  | 'wagmi-verify-domain-mismatch'
  | 'wagmi-verify-evil'
  | 'ethers-verify-valid'
  | 'ethers-verify-domain-mismatch'
  | 'ethers-verify-evil'
  | 'no-email'
  | 'no-socials'
  | 'all'

function getUrlByFlavor(baseUrl: string, library: string, flavor: ModalFlavor) {
  const urlsByFlavor: Partial<Record<ModalFlavor, string>> = {
    default: `${baseUrl}library/${library}/`,
    external: `${baseUrl}library/external/`,
    'wagmi-verify-valid': `${baseUrl}library/wagmi-verify-valid/`,
    'wagmi-verify-domain-mismatch': `${baseUrl}library/wagmi-verify-domain-mismatch/`,
    'wagmi-verify-evil': maliciousUrl,
    'ethers-verify-valid': `${baseUrl}library/ethers-verify-valid/`,
    'ethers-verify-domain-mismatch': `${baseUrl}library/ethers-verify-domain-mismatch/`,
    'ethers-verify-evil': maliciousUrl
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
    if (this.flavor === 'wagmi-verify-evil') {
      await routeInterceptUrl(this.page, maliciousUrl, this.baseURL, '/library/wagmi-verify-evil/')
    }
    if (this.flavor === 'ethers-verify-evil') {
      await routeInterceptUrl(this.page, maliciousUrl, this.baseURL, '/library/ethers-verify-evil/')
    }

    await this.page.goto(this.url)
  }

  assertDefined<T>(value: T | undefined | null): T {
    expect(value).toBeDefined()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return value!
  }

  async getConnectUri(timingRecords?: TimingRecords): Promise<string> {
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

  async qrCodeFlow(page: ModalPage, walletPage: WalletPage): Promise<void> {
    await walletPage.load()
    const uri = await page.getConnectUri()
    await walletPage.connectWithUri(uri)
    await walletPage.handleSessionProposal(DEFAULT_SESSION_PARAMS)
    const walletValidator = new WalletValidator(walletPage.page)
    await walletValidator.expectConnected()
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

    const firstMessageId = await email.getLatestMessageId(emailAddress)
    if (!firstMessageId) {
      throw new Error('No messageId found')
    }

    const firstEmailBody = await email.getEmailBody(emailAddress, firstMessageId)
    let otp = ''
    if (email.isApproveEmail(firstEmailBody)) {
      const url = email.getApproveUrlFromBody(firstEmailBody)

      await email.deleteAllMessages(emailAddress)

      const drp = new DeviceRegistrationPage(await context.newPage(), url)
      drp.load()
      await drp.approveDevice()
      await drp.close()

      const secondMessageId = await email.getLatestMessageId(emailAddress)
      if (!secondMessageId) {
        throw new Error('No messageId found')
      }

      const secondEmailBody = await email.getEmailBody(emailAddress, secondMessageId)
      if (email.isApproveEmail(secondEmailBody)) {
        throw new Error('Unexpected approve email after already approved')
      }
      otp = email.getOtpCodeFromBody(secondEmailBody)
    } else {
      otp = email.getOtpCodeFromBody(firstEmailBody)
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

  async loginWithSocial(socialOption: 'github', socialMail: string, socialPass: string) {
    await this.page
      .getByTestId('connect-button')
      .getByRole('button', { name: 'Connect Wallet' })
      .click()

    switch (socialOption) {
      case 'github':
        await this.loginWithGitHub(socialMail, socialPass)
        break
      default:
        throw new Error(`Unknown social option: ${socialOption}`)
    }
  }

  async loginWithGitHub(socialMail: string, socialPass: string) {
    const socialPopupPromise = this.page.waitForEvent('popup')
    await this.page.getByTestId(`social-selector-github`).click()
    const socialPopup = await socialPopupPromise
    await socialPopup.waitForLoadState()
    await socialPopup.fill('#login_field.form-control.input-block.js-login-field', socialMail)
    await socialPopup.fill(
      '#password.form-control.form-control.input-block.js-password-field',
      socialPass
    )
    await socialPopup.locator('[type=submit]').click()

    if (await socialPopup.locator('h1').getByText('Reauthorization required').isVisible()) {
      await socialPopup.locator('button').getByText('Authorize WalletConnect').click()
    }

    await socialPopup.waitForEvent('close')
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

  async signatureRequestFrameShouldVisible(headerText: string) {
    await expect(
      this.page.frameLocator('#w3m-iframe').getByText(headerText),
      'AppKit iframe should be visible'
    ).toBeVisible({
      timeout: 10000
    })
    await this.page.waitForTimeout(500)
  }

  async clickSignatureRequestButton(name: string) {
    const signatureHeader = this.page.getByText('Approve Transaction')
    await this.page.frameLocator('#w3m-iframe').getByRole('button', { name, exact: true }).click()
    await expect(signatureHeader, 'Signature request should be closed').not.toBeVisible()
    await this.page.waitForTimeout(300)
  }

  async approveSign() {
    await this.signatureRequestFrameShouldVisible('requests a signature')
    await this.clickSignatureRequestButton('Sign')
  }

  async rejectSign() {
    await this.signatureRequestFrameShouldVisible('requests a signature')
    await this.clickSignatureRequestButton('Cancel')
  }

  async approveMultipleTransactions() {
    await this.signatureRequestFrameShouldVisible('requests multiple transactions')
    await this.clickSignatureRequestButton('Approve')
  }

  async clickWalletUpgradeCard(context: BrowserContext) {
    await this.page.getByTestId('account-button').click()

    await this.page.getByTestId('w3m-profile-button').click()
    await this.page.getByTestId('account-settings-button').click()
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
    expect(this.page.getByTestId('w3m-modal-card')).not.toBeVisible()
    expect(this.page.getByTestId('w3m-modal-overlay')).not.toBeVisible()
    this.page.waitForTimeout(300)
    await this.page.getByTestId('account-button').click()
  }

  async openConnectModal() {
    await this.page.getByTestId('connect-button').click()
  }

  async closeModal() {
    await this.page.getByTestId('w3m-header-close')?.click?.()
    // Wait for the modal fade out animation
    await this.page.waitForTimeout(300)
  }

  async updateEmail(mailsacApiKey: string) {
    const email = new Email(mailsacApiKey)
    const newEmailAddress = await email.getEmailAddressToUse()

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

  async switchNetworkWithNetworkButton(networkName: string) {
    const networkButton = this.page.getByTestId('w3m-network-button')
    await networkButton.click()

    const networkToSwitchButton = this.page.getByTestId(`w3m-network-switch-${networkName}`)
    await networkToSwitchButton.click()
    await networkToSwitchButton.waitFor({ state: 'hidden' })
  }

  async openModal() {
    await this.page.getByTestId('account-button').click()
  }

  async openNetworks() {
    await this.page.getByTestId('w3m-account-select-network').click()
    await expect(this.page.getByText('Choose Network')).toBeVisible()
  }

  async openProfileView() {
    await this.page.getByTestId('wui-profile-button').click()
  }

  async getWalletFeaturesButton(feature: 'onramp' | 'swap' | 'receive' | 'send') {
    const walletFeatureButton = this.page.getByTestId(`wallet-features-${feature}-button`)
    await expect(walletFeatureButton).toBeVisible()

    return walletFeatureButton
  }

  async sendCalls() {
    const sendCallsButton = this.page.getByTestId('send-calls-button')
    await sendCallsButton.isVisible()
    await sendCallsButton.click()
  }
  async getCallsStatus(batchCallId: string) {
    const sendCallsInput = this.page.getByTestId('get-calls-id-input')
    const sendCallsButton = this.page.getByTestId('get-calls-status-button')
    await sendCallsButton.scrollIntoViewIfNeeded()

    await sendCallsInput.fill(batchCallId)
    await sendCallsButton.click()
  }

  async switchAccount() {
    const switchAccountButton1 = this.page.getByTestId('w3m-switch-address-button-1')
    await expect(switchAccountButton1).toBeVisible()
    await switchAccountButton1.click()
  }

  async getAddress(): Promise<`0x${string}`> {
    const address = await this.page.getByTestId('w3m-address').textContent()
    expect(address, 'Address should be present').toBeTruthy()

    return address as `0x${string}`
  }

  async getChainId(): Promise<number> {
    const chainId = await this.page.getByTestId('w3m-chain-id').textContent()
    expect(chainId, 'Chain ID should be present').toBeTruthy()

    return Number(chainId)
  }

  async getSignature(): Promise<`0x${string}`> {
    const signature = await this.page.getByTestId('w3m-signature').textContent()
    expect(signature, 'Signature should be present').toBeTruthy()

    return signature as `0x${string}`
  }
}
