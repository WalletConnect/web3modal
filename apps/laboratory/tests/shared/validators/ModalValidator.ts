import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { ConstantsUtil } from '../../../src/utils/ConstantsUtil'
import { getMaximumWaitConnections } from '../utils/timeouts'
import { verifySignature } from '../../../src/utils/SignatureUtil'

const MAX_WAIT = getMaximumWaitConnections()

export class ModalValidator {
  constructor(public readonly page: Page) {}

  async expectConnected() {
    const accountButton = this.page.locator('w3m-account-button')
    await expect(accountButton, 'Account button should be present').toBeAttached({
      timeout: MAX_WAIT
    })
    await expect(
      this.page.getByTestId('connect-button'),
      'Connect button should not be present'
    ).toBeHidden({
      timeout: MAX_WAIT
    })
    await this.page.waitForTimeout(500)
  }

  async expectAuthenticated() {
    await expect(
      this.page.getByTestId('w3m-authentication-status'),
      'Authentication status should be: authenticated'
    ).toContainText('authenticated')
  }

  async expectUnauthenticated() {
    await expect(
      this.page.getByTestId('w3m-authentication-status'),
      'Authentication status should be: unauthenticated'
    ).toContainText('unauthenticated')
  }

  async expectSignatureDeclined() {
    await expect(
      this.page.getByText('Signature declined'),
      'Signature declined should be visible'
    ).toBeVisible()
  }

  async expectDisconnected() {
    await expect(
      this.page.getByTestId('connect-button'),
      'Connect button should be present'
    ).toBeVisible({
      timeout: MAX_WAIT
    })
  }

  async expectConnectScreen() {
    await expect(this.page.getByText('Connect Wallet')).toBeVisible({
      timeout: MAX_WAIT
    })
  }

  async expectAddress(expectedAddress: string) {
    const address = this.page.getByTestId('w3m-address')

    await expect(address, 'Correct address should be present').toHaveText(expectedAddress)
  }

  async expectNetwork(network: string) {
    const networkButton = this.page.getByTestId('w3m-account-select-network')
    await expect(networkButton, `Network button should contain text ${network}`).toHaveText(
      network,
      {
        timeout: 5000
      }
    )
  }

  async expectAcceptedSign() {
    // We use Chakra Toast and it's not quite straightforward to set the `data-testid` attribute on the toast element.
    await expect(this.page.getByText(ConstantsUtil.SigningSucceededToastTitle)).toBeVisible({
      timeout: 30 * 1000
    })
    const closeButton = this.page.locator('#toast-close-button')

    await expect(closeButton).toBeVisible()
    await closeButton.click()
  }

  async expectRejectedSign() {
    // We use Chakra Toast and it's not quite straightforward to set the `data-testid` attribute on the toast element.
    await expect(this.page.getByText(ConstantsUtil.SigningFailedToastTitle)).toBeVisible()
  }

  async expectSwitchedNetwork(network: string) {
    const switchNetworkButton = this.page.getByTestId('w3m-account-select-network')
    await expect(switchNetworkButton).toBeVisible()
    await expect(switchNetworkButton).toHaveAttribute('active-network', network)
  }

  async expectValidSignature(signature: `0x${string}`, address: `0x${string}`, chainId: number) {
    const isVerified = await verifySignature({
      address,
      message: 'Hello Web3Modal!',
      signature,
      chainId
    })

    expect(isVerified).toBe(true)
  }

  async expectExternalVisible() {
    const externalConnector = this.page.getByTestId(/^wallet-selector-external/u)
    await expect(externalConnector).toBeVisible()
  }

  async expectMultipleAccounts() {
    await expect(this.page.getByText('Switch Address')).toBeVisible({
      timeout: MAX_WAIT
    })
    const accounts = await this.page.getByTestId('switch-address-item').all()

    expect(accounts.length).toBeGreaterThan(1)
  }

  async expectNetworkNotSupportedVisible() {
    const networkNotSupportedMessage = this.page.getByText(
      'This app doesn’t support your current network. Switch to an available option to continue.'
    )
    await expect(
      networkNotSupportedMessage,
      'Network not supported message should be visible'
    ).toBeVisible()
  }

  async expectAccountPageVisible() {
    const switchNetworkButton = this.page.getByTestId('w3m-account-select-network')
    await expect(switchNetworkButton).toBeVisible()
  }

  async expectOnrampButton(library: string) {
    const onrampButton = this.page.getByTestId('w3m-account-default-onramp-button')
    if (library === 'solana') {
      await expect(onrampButton).toBeHidden()
    } else {
      await expect(onrampButton).toBeVisible()
    }
  }
}
