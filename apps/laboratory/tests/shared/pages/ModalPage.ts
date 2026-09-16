/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import type { BrowserContext, Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

import type { WalletFeature } from '@reown/appkit'
import type { Address, ChainNamespace, Hex } from '@reown/appkit-common'
import { WalletPage, WalletValidator } from '@reown/appkit-testing'
import {
  BASE_URL,
  DEFAULT_SESSION_PARAMS,
  EXTENSION_NAME,
  EXTENSION_RDNS
} from '@reown/appkit-testing'

import { getNamespaceByLibrary } from '@/tests/shared/utils/namespace'

import type { TimingRecords } from '../fixtures/timing-fixture'
import { doActionAndWaitForNewPage } from '../utils/actions'
import { Email } from '../utils/email'
import type { ModalValidator } from '../validators/ModalValidator'
import { DeviceRegistrationPage } from './DeviceRegistrationPage'

const maliciousUrl = 'https://malicious-app-verify-simulation.vercel.app'

export type ModalFlavor =
  | 'default'
  | 'external'
  | 'debug-mode'
  | 'wagmi-verify-valid'
  | 'wagmi-verify-domain-mismatch'
  | 'wagmi-verify-evil'
  | 'ethers-verify-valid'
  | 'ethers-verify-domain-mismatch'
  | 'ethers-verify-evil'
  | 'no-email'
  | 'no-socials'
  | 'wallet-button'
  | 'siwe'
  | 'siwx'
  | 'core-sign-client'
  | 'core-universal-provider'
  | 'core'
  | 'all'
  | 'flag-enable-reconnect'

function getUrlByFlavor(baseUrl: string, library: string, flavor: ModalFlavor) {
  const urlsByFlavor: Partial<Record<ModalFlavor, string>> = {
    default: `${baseUrl}appkit?name=${library}`,
    external: `${baseUrl}appkit?name=external`,
    siwx: `${baseUrl}appkit?name=siwx-default`,
    'wagmi-verify-valid': `${baseUrl}appkit?name=wagmi-verify-valid`,
    'wagmi-verify-domain-mismatch': `${baseUrl}appkit?name=wagmi-verify-domain-mismatch`,
    'wagmi-verify-evil': maliciousUrl,
    'ethers-verify-valid': `${baseUrl}appkit?name=ethers-verify-valid`,
    'ethers-verify-domain-mismatch': `${baseUrl}appkit?name=ethers-verify-domain-mismatch`,
    'ethers-verify-evil': maliciousUrl,
    'core-sign-client': `${baseUrl}appkit-core/sign-client`
  }

  return urlsByFlavor[flavor] || `${baseUrl}appkit?name=${library}-${flavor}`
}

export class ModalPage {
  private readonly baseURL = BASE_URL

  private readonly connectButton: Locator
  private readonly url: string
  private emailAddress = ''
  public readonly page: Page
  public readonly library: string
  public readonly flavor: ModalFlavor

  constructor(page: Page, library: string, flavor: ModalFlavor) {
    this.page = page
    this.library = library
    this.flavor = flavor
    this.connectButton = this.page.getByTestId('connect-button').first()

    if (library === 'multichain-ethers-solana') {
      this.url = `${this.baseURL}appkit?name=multichain-ethers-solana`
    } else if (library === 'default-account-types-sa' || library === 'default-account-types-eoa') {
      this.url = `${this.baseURL}appkit?name=flag-${library}`
    } else if (flavor === 'flag-enable-reconnect') {
      this.url = `${this.baseURL}appkit?name=${flavor}-${library}`
    } else if (flavor === 'siwe') {
      this.url = `${this.baseURL}appkit?name=${library}-all`
    } else {
      this.url = getUrlByFlavor(this.baseURL, library, flavor)
    }

    this.page.on('console', async msg => {
      const args = msg.args()
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < args.length; i++) {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          try {
            const val = await args[i]?.jsonValue()
            console.log(`[console.${msg.type()}]`, val)
          } catch (err) {
            console.log(`[console.${msg.type()}] Could not serialize arg`, i, msg.text())
          }
        }
      }
    })
  }

  async load() {
    if (this.flavor === 'wagmi-verify-evil' || this.flavor === 'ethers-verify-evil') {
      await this.page.goto(maliciousUrl)
    }

    await this.page.goto(this.url)

    // Wait for w3m-modal to be injected
    await this.page.waitForSelector('w3m-modal', { state: 'visible', timeout: 30_000 })
  }

  assertDefined<T>(value: T | undefined | null): T {
    expect(value).toBeDefined()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return value!
  }

  async getConnectUriMalicious(timingRecords?: TimingRecords): Promise<string> {
    // Find div with p containing "Testnets Only?" text and get the adjacent div at the same level
    const testnetsOnlyP = this.page.locator('p:has-text("Testnets Only?")')
    await expect(testnetsOnlyP).toBeVisible()

    const parentDiv = testnetsOnlyP.locator('..')
    const adjacentDiv = parentDiv.locator('div').nth(1)
    await expect(adjacentDiv).toBeVisible()

    // Click the adjacent div
    await adjacentDiv.click()

    // Find div with Ethereum Goerli text and click it
    await this.page.getByText('Ethereum').click()

    // Find button with Connect text and click it
    await this.page.getByRole('button', { name: 'Connect' }).click()

    const qrLoadInitiatedTime = new Date()

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

  async getConnectUri(timingRecords?: TimingRecords, modalOpen?: boolean): Promise<string> {
    if (!modalOpen) {
      await this.connectButton.click()
    }

    await this.clickWalletConnect()
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

  async getConnectUriFromQRModal(timingRecords?: TimingRecords): Promise<string> {
    const qrLoadInitiatedTime = new Date()

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

  async getImmidiateConnectUri(
    timingRecords?: TimingRecords,
    clickConnectButton = true
  ): Promise<string> {
    if (clickConnectButton) {
      await this.connectButton.click()
    }
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

  // eslint-disable-next-line max-params
  async qrCodeFlow(
    page: ModalPage,
    walletPage: WalletPage,
    qrCodeFlowType?: 'immediate-connect' | 'immediate',
    modalOpen?: boolean
  ): Promise<void> {
    // eslint-disable-next-line init-declarations
    let uri: string
    if (!walletPage.isPageLoaded) {
      await walletPage.load()
    }
    if (qrCodeFlowType === 'immediate-connect' || qrCodeFlowType === 'immediate') {
      uri = await page.getImmidiateConnectUri(undefined, qrCodeFlowType === 'immediate-connect')
    } else {
      uri = await page.getConnectUri(undefined, modalOpen)
    }
    await walletPage.connectWithUri(uri)

    await walletPage.handleSessionProposal(DEFAULT_SESSION_PARAMS)
    const walletValidator = new WalletValidator(walletPage.page)
    await walletValidator.expectConnected()
  }

  async emailFlow({
    emailAddress,
    context,
    mailsacApiKey,
    clickConnectButton = true,
    timingRecords
  }: {
    emailAddress: string
    context: BrowserContext
    mailsacApiKey: string
    clickConnectButton?: boolean
    timingRecords?: TimingRecords
  }): Promise<void> {
    const flowStart = Date.now()
    // eslint-disable-next-line no-console
    console.log(`[emailFlow] ========== Starting email flow for ${emailAddress} ==========`)

    this.emailAddress = emailAddress

    const email = new Email(mailsacApiKey)

    // eslint-disable-next-line no-console
    console.log(`[emailFlow] Deleting all existing messages`)
    await email.deleteAllMessages(emailAddress)

    const loginWithEmail = new Date()
    // eslint-disable-next-line no-console
    console.log(`[emailFlow] Calling loginWithEmail at ${Date.now() - flowStart}ms`)
    await this.loginWithEmail(emailAddress, undefined, clickConnectButton)
    const loginTime = new Date().getTime() - loginWithEmail.getTime()
    // eslint-disable-next-line no-console
    console.log(`[emailFlow] loginWithEmail completed in ${loginTime}ms`)
    if (timingRecords) {
      timingRecords.push({
        item: 'loginWithEmail',
        timeMs: loginTime
      })
    }

    const getLatestMessageId1 = new Date()
    // eslint-disable-next-line no-console
    console.log(`[emailFlow] Waiting for first email at ${Date.now() - flowStart}ms`)
    const firstMessageId = await email.getLatestMessageId(emailAddress)
    const getMessageId1Time = new Date().getTime() - getLatestMessageId1.getTime()
    // eslint-disable-next-line no-console
    console.log(`[emailFlow] Got first messageId in ${getMessageId1Time}ms`)
    if (timingRecords) {
      timingRecords.push({
        item: 'getLatestMessageId1',
        timeMs: getMessageId1Time
      })
    }
    if (!firstMessageId) {
      throw new Error('No messageId found')
    }

    const getEmailBody1 = new Date()
    // eslint-disable-next-line no-console
    console.log(`[emailFlow] Fetching first email body at ${Date.now() - flowStart}ms`)
    const firstEmailBody = await email.getEmailBody(emailAddress, firstMessageId)
    const getEmailBody1Time = new Date().getTime() - getEmailBody1.getTime()
    // eslint-disable-next-line no-console
    console.log(`[emailFlow] Got first email body in ${getEmailBody1Time}ms`)
    if (timingRecords) {
      timingRecords.push({
        item: 'getEmailBody1',
        timeMs: getEmailBody1Time
      })
    }

    let otp = ''
    const isApprove = email.isApproveEmail(firstEmailBody)
    // eslint-disable-next-line no-console
    console.log(`[emailFlow] First email is ${isApprove ? 'APPROVAL' : 'OTP'} email`)

    if (isApprove) {
      const url = email.getApproveUrlFromBody(firstEmailBody)
      // eslint-disable-next-line no-console
      console.log(`[emailFlow] Processing device approval flow at ${Date.now() - flowStart}ms`)

      const deleteAllMessages = new Date()
      // eslint-disable-next-line no-console
      console.log(
        `[emailFlow] Deleting messages before device approval at ${Date.now() - flowStart}ms`
      )
      await email.deleteAllMessages(emailAddress)
      if (timingRecords) {
        timingRecords.push({
          item: 'deleteAllMessages',
          timeMs: new Date().getTime() - deleteAllMessages.getTime()
        })
      }

      const loadDeviceRegistrationPage = new Date()
      // eslint-disable-next-line no-console
      console.log(`[emailFlow] Loading device registration page with URL: ${url}`)
      const drp = new DeviceRegistrationPage(await context.newPage(), url)
      drp.load()
      // eslint-disable-next-line no-console
      console.log(`[emailFlow] Approving device at ${Date.now() - flowStart}ms`)
      await drp.approveDevice()
      await drp.close()
      const approvalTime = new Date().getTime() - loadDeviceRegistrationPage.getTime()
      // eslint-disable-next-line no-console
      console.log(`[emailFlow] Device approval completed in ${approvalTime}ms`)
      if (timingRecords) {
        timingRecords.push({
          item: 'loadDeviceRegistrationPage',
          timeMs: approvalTime
        })
      }

      const getLatestMessageId2 = new Date()
      // eslint-disable-next-line no-console
      console.log(`[emailFlow] Waiting for second email (OTP) at ${Date.now() - flowStart}ms`)
      const secondMessageId = await email.getLatestMessageId(emailAddress)
      if (!secondMessageId) {
        throw new Error('No messageId found')
      }
      const getMessageId2Time = new Date().getTime() - getLatestMessageId2.getTime()
      // eslint-disable-next-line no-console
      console.log(`[emailFlow] Got second messageId in ${getMessageId2Time}ms`)
      if (timingRecords) {
        timingRecords.push({
          item: 'getLatestMessageId2',
          timeMs: getMessageId2Time
        })
      }

      const getEmailBody2 = new Date()
      // eslint-disable-next-line no-console
      console.log(`[emailFlow] Fetching second email body at ${Date.now() - flowStart}ms`)
      const secondEmailBody = await email.getEmailBody(emailAddress, secondMessageId)
      const getEmailBody2Time = new Date().getTime() - getEmailBody2.getTime()
      // eslint-disable-next-line no-console
      console.log(`[emailFlow] Got second email body in ${getEmailBody2Time}ms`)
      if (timingRecords) {
        timingRecords.push({
          item: 'getEmailBody2',
          timeMs: getEmailBody2Time
        })
      }
      if (email.isApproveEmail(secondEmailBody)) {
        throw new Error('Unexpected approve email after already approved')
      }
      otp = email.getOtpCodeFromBody(secondEmailBody)
      // eslint-disable-next-line no-console
      console.log(`[emailFlow] Extracted OTP from second email`)
    } else {
      otp = email.getOtpCodeFromBody(firstEmailBody)
      // eslint-disable-next-line no-console
      console.log(`[emailFlow] Extracted OTP from first email (no approval needed)`)
    }

    const enterOTP = new Date()
    // eslint-disable-next-line no-console
    console.log(`[emailFlow] Entering OTP at ${Date.now() - flowStart}ms`)
    await this.enterOTP(otp)
    const enterOTPTime = new Date().getTime() - enterOTP.getTime()
    // eslint-disable-next-line no-console
    console.log(`[emailFlow] enterOTP completed in ${enterOTPTime}ms`)
    if (timingRecords) {
      timingRecords.push({
        item: 'enterOTP',
        timeMs: enterOTPTime
      })
    }

    const totalFlowTime = Date.now() - flowStart
    // eslint-disable-next-line no-console
    console.log(`[emailFlow] ========== Email flow completed in ${totalFlowTime}ms ==========`)
  }

  async loginWithEmail(email: string, validate = true, clickConnectButton = true) {
    // eslint-disable-next-line no-console
    console.log(`[loginWithEmail] Starting login with email: ${email}`)

    if (clickConnectButton) {
      // eslint-disable-next-line no-console
      console.log(`[loginWithEmail] Clicking connect button`)
      // Connect Button doesn't have a proper `disabled` attribute so we need to wait for the button to change the text
      await this.page
        .getByTestId('connect-button')
        .getByRole('button', { name: 'Connect Wallet' })
        .click()
    }

    // eslint-disable-next-line no-console
    console.log(`[loginWithEmail] Filling email input`)
    await this.page.getByTestId('wui-email-input').locator('input').focus()
    await this.page.getByTestId('wui-email-input').locator('input').fill(email)
    await this.page.getByTestId('wui-email-input').locator('input').press('Enter')

    if (validate) {
      // eslint-disable-next-line no-console
      console.log(
        `[loginWithEmail] Waiting for email to be visible on notification screen (20s timeout)`
      )
      const validationStart = Date.now()

      await expect(
        this.page.getByText(email),
        `Expected current email: ${email} to be visible on the notification screen`
      ).toBeVisible({
        timeout: 20_000
      })

      const validationTime = Date.now() - validationStart
      // eslint-disable-next-line no-console
      console.log(`[loginWithEmail] Email visible on screen after ${validationTime}ms`)
    }

    // eslint-disable-next-line no-console
    console.log(`[loginWithEmail] Completed successfully`)
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
      timeout: 20_000
    })
    await expect(this.page.getByText('Enter the code we sent')).toBeVisible({
      timeout: 20_000
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

    await expect(this.page.getByText(headerTitle)).not.toBeVisible({
      timeout: 30_000
    })
  }

  async disconnectMalicious() {
    // Find button with Disconnect text and click it
    const disconnectButton = this.page.getByRole('button', { name: 'Disconnect' })
    await expect(disconnectButton, 'Disconnect button should be visible').toBeVisible()
    await disconnectButton.click()
  }

  async disconnect(clickAccountButton = true) {
    if (clickAccountButton) {
      const accountBtn = this.page.getByTestId('account-button')
      await expect(accountBtn, 'Account button should be visible').toBeVisible()
      await expect(accountBtn, 'Account button should be enabled').toBeEnabled()
      await accountBtn.click()
    }
    const disconnectBtn = this.page.getByTestId('disconnect-button')
    await expect(disconnectBtn, 'Disconnect button should be visible').toBeVisible()
    await expect(disconnectBtn, 'Disconnect button should be enabled').toBeEnabled()
    await disconnectBtn.click()
  }

  async disconnectWithHook(namespace?: string) {
    const disconnectBtn = this.page.getByTestId(
      namespace ? `${namespace}-disconnect-button` : 'disconnect-hook-button'
    )
    await expect(disconnectBtn, 'Disconnect button should be visible').toBeVisible()
    await expect(disconnectBtn, 'Disconnect button should be enabled').toBeEnabled()
    await disconnectBtn.click()
  }

  async signMalicious(_namespace?: string) {
    // Find the first button with personal_sign text and click it
    const signButton = this.page.getByRole('button', { name: 'personal_sign' }).first()

    await signButton.scrollIntoViewIfNeeded()
    await signButton.click()
  }

  async sign(_namespace?: string) {
    const namespace = _namespace || getNamespaceByLibrary(this.library)
    const signButton = this.page
      .getByTestId(`${namespace}-test-interactions`)
      .getByTestId('sign-message-button')

    await signButton.scrollIntoViewIfNeeded()
    await signButton.click()
  }

  async signTypedData(_namespace?: string) {
    const namespace = _namespace || getNamespaceByLibrary(this.library)
    const signButton = this.page
      .getByTestId(`${namespace}-test-interactions`)
      .getByTestId('sign-typed-data-button')

    await signButton.scrollIntoViewIfNeeded()
    await signButton.click()
  }

  async signMessageAndTypedData(
    modalValidator: ModalValidator,
    network?: string,
    namespace?: string
  ) {
    await this.sign(namespace)
    await modalValidator.expectAcceptedSign()

    if (network !== 'Solana') {
      // Wait for the toast animation to complete
      await modalValidator.page.waitForTimeout(500)
      await this.signTypedData(namespace)
      await modalValidator.expectAcceptedSignTypedData()
    }
  }

  async waitForFrameWithHeader(headerText: string) {
    const signatureHeader = this.page.frameLocator('#w3m-iframe').getByText(headerText)
    await signatureHeader.waitFor({ state: 'visible', timeout: 15_000 })
  }

  async clickSignatureRequestButton(name: string) {
    const signatureHeader = this.page.getByText('Approve Transaction')
    const signatureButton = this.page
      .frameLocator('#w3m-iframe')
      .getByRole('button', { name, exact: true })
    await signatureButton.waitFor({ state: 'visible', timeout: 15_000 })
    await signatureButton.scrollIntoViewIfNeeded()
    await signatureButton.click()

    await signatureHeader.waitFor({ state: 'hidden', timeout: 15_000 })
  }

  async approveSign() {
    await this.waitForFrameWithHeader('requests a signature')
    await this.clickSignatureRequestButton('Sign')
  }

  async rejectSign() {
    await this.waitForFrameWithHeader('requests a signature')
    await this.clickSignatureRequestButton('Cancel')
  }

  async approveMultipleTransactions() {
    await this.waitForFrameWithHeader('requests multiple transactions')
    await this.clickSignatureRequestButton('Approve')
  }

  async clickProfileWalletsMoreButton() {
    await this.page.getByTestId('wui-active-profile-wallet-item-more-button').click()
  }

  async clickProfileWalletsDisconnectButton() {
    await this.page.getByTestId('wui-active-profile-wallet-item-disconnect-button').click()
  }

  async clickWalletUpgradeCard(context: BrowserContext) {
    await this.page.getByTestId('account-button').click()
    await this.page.getByTestId('wui-wallet-switch').click()
    await this.clickProfileWalletsMoreButton()
    await this.page.getByTestId('w3m-wallet-upgrade-card').click()

    const page = await doActionAndWaitForNewPage(
      this.page.getByTestId('w3m-secure-website-button').click(),
      context
    )

    return page
  }

  async clickWalletGuideGetStarted() {
    await this.page.getByTestId('w3m-wallet-guide-get-started').click()
  }

  async promptSiwe({ cancel = false }: { cancel?: boolean } = {}) {
    const testId = cancel ? 'w3m-connecting-siwe-cancel' : 'w3m-connecting-siwe-sign'
    const buttonType = cancel ? 'cancel' : 'sign'
    const siweButton = this.page.getByTestId(testId)

    await expect(siweButton, `Siwe prompt ${buttonType} button should be visible`).toBeVisible({
      timeout: 10_000
    })
    await expect(siweButton, `Siwe prompt ${buttonType} button should be enabled`).toBeEnabled()
    await siweButton.click()
  }

  async cancelSiwe() {
    await this.page.getByTestId('w3m-connecting-siwe-cancel').click()
  }

  async switchNetwork(network: string, clickAccountButton = true) {
    if (clickAccountButton) {
      await this.page.getByTestId('account-button').click()
      await this.page.getByTestId('w3m-account-select-network').click()
    }

    const networkButton = this.page.getByTestId(`w3m-network-switch-${network}`)

    // Ensure the network button is enabled before clicking
    await expect(networkButton, `Network button for ${network} should be enabled`).toBeEnabled({
      timeout: 5000
    })

    await networkButton.click()

    // Wait for network switch animation to complete (success animation is 800ms + modal close/goBack)
    const switchView = this.page.locator('w3m-network-switch-view')
    try {
      await switchView.waitFor({ state: 'visible', timeout: 5000 })
      await switchView.waitFor({ state: 'hidden', timeout: 15_000 })
    } catch {
      // Switch view may have already completed or wasn't shown
    }
    await this.page.waitForTimeout(300)
  }

  async switchActiveChain() {
    await this.page.locator('w3m-switch-active-chain-view').waitFor()
    await this.page.getByTestId('w3m-switch-active-chain-button').click()
  }

  async clickWalletDeeplink() {
    await this.connectButton.click()
    await this.page.getByTestId('wallet-selector-react-wallet-v2').click()
    await this.page.getByTestId('tab-desktop').click()
  }

  async clickWalletConnect() {
    const connect = this.page.getByTestId('wallet-selector-walletconnect')
    await connect.waitFor({
      state: 'visible',
      timeout: 15000
    })
    await connect.click()
  }

  async clickWalletSwitchButton() {
    await this.page.getByTestId('wui-wallet-switch').click()
  }

  async clickAddWalletButton() {
    await this.page.getByTestId('add-connection-button').click()
  }

  async openAccount(namespace?: string) {
    expect(this.page.getByTestId('w3m-modal-card')).not.toBeVisible()
    expect(this.page.getByTestId('w3m-modal-overlay')).not.toBeVisible()
    this.page.waitForTimeout(300)
    await this.page.getByTestId(`account-button${namespace ? `-${namespace}` : ''}`).click()
  }

  async openProfileWalletsView(
    namespace?: ChainNamespace,
    clickButtonType: 'account' | 'connect' = 'account'
  ) {
    if (clickButtonType === 'account') {
      await this.openAccount(namespace)
    } else {
      await this.openConnectModal(namespace)
    }
    await this.clickWalletSwitchButton()
    // Wait until stable after animations
    await this.page.waitForTimeout(500)
  }

  async openConnectModal(namespace?: ChainNamespace) {
    await this.page.getByTestId(`connect-button${namespace ? `-${namespace}` : ''}`).click()
  }

  async openAllSocials() {
    await this.page.getByTestId('social-selector-more').click()
  }

  async openOnramp() {
    await this.page.getByTestId('wallet-features-onramp-button').click()
  }

  async closeModal() {
    // Wait until stable after animations
    await this.page.waitForTimeout(200)

    // Modal may have already been closed (e.g. after network switch success animation)
    const modal = this.page.getByTestId('w3m-modal-card')
    const isModalVisible = await modal.isVisible().catch(() => false)
    if (!isModalVisible) {
      return
    }

    const closeButton = this.page.getByTestId('w3m-header-close')

    try {
      // Click the button and wait for modal to fade out
      await closeButton.click({ timeout: 5000 })
      await closeButton.waitFor({ state: 'hidden', timeout: 15_000 })
    } catch {
      // Modal may have auto-closed during the click attempt (e.g. network switch success animation)
      const isStillVisible = await modal.isVisible().catch(() => false)
      if (isStillVisible) {
        // Modal is still visible but close button failed — wait for it to close on its own
        await modal.waitFor({ state: 'hidden', timeout: 15_000 })
      }
    }

    // Wait until stable after animations
    await this.page.waitForTimeout(200)
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
    const shouldConfirmEmail = await this.page.getByText('Confirm Current Email').isVisible()
    if (shouldConfirmEmail) {
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
    const networkButton = this.page.getByTestId('wui-network-button')
    await networkButton.click()

    const networkToSwitchButton = this.page.getByTestId(`w3m-network-switch-${networkName}`)
    await networkToSwitchButton.click()

    // Wait for network switch animation to complete (success animation is 800ms + modal close)
    const switchView = this.page.locator('w3m-network-switch-view')
    try {
      await switchView.waitFor({ state: 'visible', timeout: 5000 })
      await switchView.waitFor({ state: 'hidden', timeout: 15_000 })
    } catch {
      // Switch view may have already completed or wasn't shown
    }
    // Wait for state to settle
    await this.page.waitForTimeout(300)
  }

  async openAllWallets() {
    const allWallets = this.page.getByTestId('all-wallets')
    await expect(allWallets, 'All wallets should be visible').toBeVisible()
    await allWallets.click()
  }

  async clickAllWalletsListSearchItem(id: string) {
    const allWalletsListSearchItem = this.page.getByTestId(`wallet-search-item-${id}`)
    await expect(allWalletsListSearchItem).toBeVisible()
    await allWalletsListSearchItem.click()
  }

  async clickCertifiedToggle() {
    const certifiedSwitch = this.page.getByTestId('wui-certified-switch')
    await expect(certifiedSwitch).toBeVisible()
    await certifiedSwitch.click()
  }

  async clickTabWebApp() {
    const tabWebApp = this.page.getByTestId('tab-webapp')
    await expect(tabWebApp).toBeVisible()
    await tabWebApp.click()
  }

  async clickTab(name: string) {
    const tab = this.page.getByTestId(`tab-${name}`)
    await expect(tab).toBeVisible()
    await tab.click()
  }

  async getExtensionWallet() {
    // eslint-disable-next-line init-declarations
    let walletSelector: Locator

    const walletSelectorRDNS = this.page.getByTestId(`wallet-selector-${EXTENSION_RDNS}`)
    const walletSelectorName = this.page.getByTestId(
      `wallet-selector-${EXTENSION_NAME.toLowerCase()}`
    )

    try {
      await walletSelectorRDNS.waitFor({ state: 'visible', timeout: 2_000 })
      walletSelector = walletSelectorRDNS
    } catch {
      try {
        await walletSelectorName.waitFor({ state: 'visible', timeout: 2_000 })
        walletSelector = walletSelectorName
      } catch {
        throw new Error('No wallet selector found')
      }
    }

    return walletSelector
  }

  async getActiveProfileWalletItemAddress() {
    const activeProfileWalletItem = this.page.getByTestId('wui-active-profile-wallet-item')
    const address = await activeProfileWalletItem.getAttribute('address')

    return address as string
  }

  async getConnectedWalletType() {
    const walletType = this.page.getByTestId('w3m-wallet-type')
    const text = await walletType.textContent()

    return text?.trim()
  }

  async clickWalletButton(id: string) {
    await this.page.getByTestId(`wallet-button-${id}`).click()
  }

  async clickHookDisconnectButton() {
    const disconnectHookButton = this.page.getByTestId('disconnect-hook-button')
    await expect(disconnectHookButton).toBeVisible()
    await disconnectHookButton.click()
  }

  async clickCopyLink() {
    const copyLink = this.page.getByTestId('wui-link-copy')
    await expect(copyLink).toBeVisible()

    let hasCopied = false

    while (!hasCopied) {
      await copyLink.click()
      await this.page.waitForTimeout(500)

      const snackbarMessage = this.page.getByTestId('wui-snackbar-message')
      const snackbarMessageText = await snackbarMessage.textContent()

      if (snackbarMessageText && snackbarMessageText.startsWith('Link copied')) {
        hasCopied = true
      }
    }

    return this.page.evaluate(() => navigator.clipboard.readText())
  }

  async clickOpenWebApp() {
    const openButton = this.page.getByTestId('w3m-connecting-widget-secondary-button')
    await expect(openButton).toBeVisible()
    await expect(openButton).toHaveText('Open')

    /*
     * Patch window.open to capture the URL synchronously at the moment AppKit
     * calls it. Reading lastTab.url() after the click races against external
     * redirects (e.g. some wallets' webapp_link points to chromewebstore.google.com
     * which immediately redirects to a Google consent page, dropping the ?uri= param).
     */
    await this.page.evaluate(() => {
      const original = window.open
      ;(window as unknown as { __capturedOpenUrl: string }).__capturedOpenUrl = ''
      window.open = function open(...args: Parameters<typeof window.open>) {
        ;(window as unknown as { __capturedOpenUrl: string }).__capturedOpenUrl = String(
          args[0] ?? ''
        )

        return original.apply(this, args)
      }
    })

    await openButton.click()
    await this.page.waitForFunction(
      () => (window as unknown as { __capturedOpenUrl: string }).__capturedOpenUrl !== '',
      undefined,
      { timeout: 10_000 }
    )

    return this.page.evaluate(
      () => (window as unknown as { __capturedOpenUrl: string }).__capturedOpenUrl
    )
  }

  async search(value: string) {
    const searchInput = this.page.getByTestId('wui-input-text')
    await expect(searchInput, 'Search input should be visible').toBeVisible()
    await searchInput.fill(value)
  }

  async openModal() {
    await this.page.getByTestId('account-button').click()
    const modal = this.page.getByTestId('w3m-modal-card')
    await expect(modal).toBeVisible()
  }

  async openNetworks() {
    await this.page.getByTestId('w3m-account-select-network').click()
    await expect(this.page.getByText('Choose Network')).toBeVisible()
  }

  async openProfileView() {
    const profileButton = this.page.getByTestId('wui-profile-button')
    await expect(profileButton).toBeVisible()
    await profileButton.click()
    await profileButton.waitFor({ state: 'hidden', timeout: 15_000 })
  }

  async getWalletFeaturesButton(feature: WalletFeature | 'fund-wallet') {
    const walletFeatureButton = this.page.getByTestId(`wallet-features-${feature}-button`)
    await expect(walletFeatureButton).toBeVisible()

    return walletFeatureButton
  }

  async getDefaultWalletFeaturesButton(feature: WalletFeature | 'fund-wallet') {
    const walletFeatureButton = this.page.getByTestId(`w3m-account-default-${feature}-button`)
    await expect(walletFeatureButton).toBeVisible()

    return walletFeatureButton
  }

  async sendCalls() {
    const fetchCapabilitiesButton = this.page.getByTestId('fetch-capabilities-button')
    await fetchCapabilitiesButton.click()
    const sendCallsButton = this.page.getByTestId('send-calls-button')
    await sendCallsButton.isVisible()
    await sendCallsButton.scrollIntoViewIfNeeded()
    await sendCallsButton.click()
  }
  async getCallsStatus(batchCallId: string) {
    const fetchCapabilitiesButton = this.page.getByTestId('fetch-capabilities-button')
    await fetchCapabilitiesButton.click()
    const sendCallsInput = this.page.getByTestId('get-calls-id-input')
    const sendCallsButton = this.page.getByTestId('get-calls-status-button')
    await sendCallsButton.scrollIntoViewIfNeeded()

    await sendCallsInput.fill(batchCallId)
    await sendCallsButton.click()
  }

  async switchAccount(idx = 0) {
    const firstActiveConnection = this.page.getByTestId('active-connection')
    const firstActiveConnectionButton = firstActiveConnection
      .nth(idx)
      .getByTestId('wui-inactive-profile-wallet-item-button')
    await expect(firstActiveConnectionButton).toBeVisible()
    await firstActiveConnectionButton.click()

    // Wait until the active connection is updated
    await this.page.waitForTimeout(100)
  }

  async disconnectConnection(alt?: string) {
    const connection = this.page
      .getByTestId('active-connection')
      .filter({ has: this.page.locator(`[alt="${alt}"]`) })

    const disconnectButton = connection.locator('wui-icon-link[icon="power"]')

    await expect(disconnectButton).toBeVisible()
    await disconnectButton.click()
  }

  async switchAccountByAddress(address: string) {
    const activeConnections = await this.getActiveConnections()

    let hasSwitched = false

    await Promise.all(
      activeConnections.map(async connection => {
        const connectionAddress = await connection.getAttribute('address')

        if (connectionAddress && connectionAddress.toLowerCase() === address.toLowerCase()) {
          await connection.getByTestId('wui-inactive-profile-wallet-item-button').click()
          hasSwitched = true
        }
      })
    )

    if (!hasSwitched) {
      throw new Error(`Active connection with address "${address}" not found`)
    }
  }

  async getAddress(namespace?: string): Promise<`0x${string}`> {
    const address = await this.page
      .getByTestId(`w3m-address${namespace ? `-${namespace}` : ''}`)
      .textContent()
    expect(address, 'Address should be present').toBeTruthy()

    return address as Address
  }

  async getActiveConnectionsAddresses() {
    const activeConnections = await this.getActiveConnections()

    const activeConnectionsAddresses = await Promise.all(
      activeConnections.map(async connection => connection.getAttribute('address'))
    )

    return activeConnectionsAddresses.filter(Boolean) as string[]
  }

  // Returns all connected addresses excluding the currently active account
  async getActiveConnections() {
    const locator = this.page.getByTestId('active-connection')
    const count = await locator.count()

    return Array.from({ length: count }).map((_, i) => locator.nth(i))
  }

  async getChainId(): Promise<number> {
    const chainId = await this.page.getByTestId('w3m-chain-id').textContent()
    expect(chainId, 'Chain ID should be present').toBeTruthy()

    return Number(chainId)
  }

  async getSignature(): Promise<`0x${string}`> {
    const signature = await this.page.getByTestId('w3m-signature').textContent()
    expect(signature, 'Signature should be present').toBeTruthy()

    return signature as Hex
  }

  async switchNetworkWithHook() {
    await this.page.getByTestId('switch-network-hook-button').click()
  }

  async abortLoginWithFarcaster() {
    await this.page
      .getByTestId('connect-button')
      .getByRole('button', { name: 'Connect Wallet' })
      .click()
    await this.page.getByTestId('social-selector-farcaster').click()
    await this.page.locator('wui-qr-code').waitFor({ state: 'visible' })
    await this.page.getByTestId('header-back').click()
    await this.page.waitForTimeout(1000)
    await this.closeModal()
  }

  async connectToExtension() {
    await this.connectButton.click()
    const walletSelector = await this.getExtensionWallet()
    await walletSelector.click()
  }

  async connectToExtensionMultichain(
    chainNamespace: ChainNamespace,
    modalOpen?: boolean,
    isAnotherNamespaceConnected?: boolean
  ) {
    const isFiltered = modalOpen && isAnotherNamespaceConnected

    if (!modalOpen) {
      await this.connectButton.click()
    }
    const walletSelector = await this.getExtensionWallet()
    await walletSelector.click()
    if (!isFiltered) {
      const chainSelector = this.page.getByTestId(`wui-list-chain-${chainNamespace}`)
      await chainSelector.click()
    }
  }

  async goBack() {
    await this.page.getByTestId('header-back').click()
    await this.page.waitForTimeout(300)
  }

  async setCustomProjectId(projectId: string) {
    await this.page.getByTestId('project-id-button').click()
    await this.page.getByTestId('project-id-input').fill(projectId)
    await this.page.getByTestId('project-id-save-button').click()
    await this.page.reload()
  }
}
