import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

import type { CaipNetworkId } from '@reown/appkit'
import type { ChainNamespace } from '@reown/appkit-common'
import { getMaximumWaitConnections } from '@reown/appkit-testing'

import { ConstantsUtil } from '../../../src/utils/ConstantsUtil'
import { verifySignature } from '../../../src/utils/SignatureUtil'

const MAX_WAIT = getMaximumWaitConnections()

export class ModalValidator {
  public readonly page: Page
  constructor(page: Page) {
    this.page = page
  }

  async expectConnectedMalicious() {
    // Find button with Disconnect text and expect it to be visible
    const disconnectButton = this.page.getByRole('button', { name: 'Disconnect' })
    await expect(disconnectButton, 'Disconnect button should be visible').toBeVisible({
      timeout: MAX_WAIT
    })
  }

  async expectConnected(namespace?: ChainNamespace) {
    const accountButton = namespace
      ? this.page.locator(`appkit-account-button[namespace="${namespace}"]`)
      : this.page.locator('appkit-account-button:not([namespace])')
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

  async expectConnectionNotExist(alt: string) {
    const connection = this.page
      .getByTestId('active-connection')
      .filter({ has: this.page.locator(`[alt="${alt}"]`) })

    await expect(connection, `Connection with alt "${alt}" should not exist`).not.toBeVisible({
      timeout: MAX_WAIT
    })
  }

  async expectLoading(namespace?: ChainNamespace) {
    const accountButton = namespace
      ? this.page.locator(`appkit-connect-button[namespace="${namespace}"]`)
      : this.page.locator('appkit-connect-button:not([namespace])')
    await expect(accountButton, 'Account button should be present').toBeAttached({
      timeout: MAX_WAIT
    })
    await expect(
      this.page.getByTestId('connect-button'),
      'Connect button should show connecting state'
    ).toHaveText('Connecting...', {
      timeout: MAX_WAIT
    })
  }

  async expectBalanceFetched(
    currency: 'SOL' | 'ETH' | 'BTC' | 'POL' | 'TON' | 'TRX' | 'XLM',
    namespace?: string
  ) {
    const accountButton = namespace
      ? this.page.getByTestId(`account-button-${namespace}`)
      : this.page.locator('appkit-account-button').first()
    await expect(accountButton, `Account button should show balance as ${currency}`).toContainText(
      `0.000 ${currency}`
    )
  }

  async expectAuthenticated() {
    await expect(
      this.page.getByTestId('w3m-authentication-status'),
      'Authentication status should be: authenticated'
    ).toContainText('authenticated', { timeout: 10000 })
  }

  async expectOnSignInEventCalled(toBe: boolean) {
    await expect(this.page.getByTestId('siwe-event-onSignIn')).toContainText(`${toBe}`)
  }

  async expectUnauthenticated() {
    await expect(
      this.page.getByTestId('w3m-authentication-status'),
      'Authentication status should be: unauthenticated'
    ).toContainText('unauthenticated', { timeout: 20000 })
  }

  async expectOnSignOutEventCalled(toBe: boolean) {
    await expect(this.page.getByTestId('siwe-event-onSignOut')).toContainText(`${toBe}`)
  }

  async expectSignatureDeclined() {
    await expect(
      this.page.getByText('Signature declined'),
      'Signature declined should be visible'
    ).toBeVisible()
  }

  async expectDisconnectedMalicious() {
    await expect(
      this.page.getByText('Select chains'),
      'Select chains text should be visible'
    ).toBeVisible()
  }

  async expectDisconnected(namespace?: string) {
    const connectButton = this.page.getByTestId(`connect-button${namespace ? `-${namespace}` : ''}`)
    await expect(connectButton, 'Connect button should be present').toBeVisible({
      timeout: MAX_WAIT
    })

    await expect(connectButton, 'Connect button should be enabled').toBeEnabled({
      timeout: MAX_WAIT
    })

    await expect(connectButton, 'Connect button should contain text Connect').toContainText(
      'Connect',
      { timeout: MAX_WAIT }
    )
  }

  async expectStatus(status: 'connecting' | 'connected' | 'disconnected') {
    const connectButton = this.page.getByTestId('apkt-account-status').first()
    await expect(connectButton, `Account status should be ${status}`).toHaveText(status)
  }

  async expectActiveProfileWalletItemToExist() {
    const activeProfileWalletItem = this.page.getByTestId('wui-active-profile-wallet-item')
    await expect(activeProfileWalletItem).toBeVisible({
      timeout: MAX_WAIT
    })
  }

  async expectActiveProfileWalletItemAddress(address: string) {
    const activeProfileWalletItem = this.page.getByTestId('wui-active-profile-wallet-item')
    await expect(activeProfileWalletItem).toBeVisible({
      timeout: MAX_WAIT
    })
    await expect(activeProfileWalletItem).toHaveAttribute('address', address)
  }

  async expectActiveConnectionsFromProfileWalletsCount(count: number) {
    await expect(this.page.getByTestId('active-connection')).toHaveCount(count, { timeout: 10000 })
  }

  async expectActiveConnectionsFromProfileWallets(connections: { address: string }[]) {
    const activeConnectionItems = this.page.getByTestId('active-connection')
    const count = await activeConnectionItems.count()
    expect(count).toBeGreaterThan(0)

    const foundAddresses = await Promise.all(
      Array.from({ length: count }).map(async (_, i) => {
        const item = activeConnectionItems.nth(i)
        const address = await item.getAttribute('address')

        return address?.toLowerCase()
      })
    )

    for (const { address } of connections) {
      expect(foundAddresses).toContain(address.toLowerCase())
    }
  }

  async expectSingleAccount() {
    await expect(
      this.page.getByTestId('single-account-avatar'),
      'Single account widget should be present'
    ).toBeVisible({
      timeout: MAX_WAIT
    })
  }

  async expectConnectScreen() {
    await expect(this.page.getByText('Connect Wallet')).toBeVisible({
      timeout: MAX_WAIT
    })
  }

  async expectCaipAddressHaveCorrectNetworkId(caipNetworkId: CaipNetworkId) {
    const address = this.page.getByTestId('w3m-caip-address')
    await expect(address, 'Correct CAIP address should be present').toContainText(
      caipNetworkId.toString()
    )
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

  async expectWalletButtonHook(id: string, disabled: boolean) {
    const walletButtonHook = this.page.getByTestId(`wallet-button-hook-${id}`)
    await expect(walletButtonHook).toBeVisible({ timeout: 20_000 })

    if (disabled) {
      await expect(walletButtonHook).toBeDisabled({ timeout: 20_000 })
    } else {
      await expect(walletButtonHook).toBeEnabled({ timeout: 20_000 })
    }
  }

  async expectAcceptedSignMalicious() {
    // Wait for the JSON-RPC Request Approved text to appear
    await expect(this.page.getByText('JSON-RPC Request Approved')).toBeVisible({
      timeout: 30 * 1000
    })

    // Refresh the page
    await this.page.reload()
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

  async expectAcceptedSignTypedData() {
    await expect(this.page.getByText('Success')).toBeVisible({
      timeout: MAX_WAIT
    })
    const closeButton = this.page.locator('#toast-close-button')
    await expect(closeButton).toBeVisible({ timeout: MAX_WAIT })
    await closeButton.click()
  }

  async expectRejectedSign() {
    // We use Chakra Toast and it's not quite straightforward to set the `data-testid` attribute on the toast element.
    await expect(this.page.getByText(ConstantsUtil.SigningFailedToastTitle)).toBeVisible()
    const closeButton = this.page.locator('#toast-close-button')

    await expect(closeButton).toBeVisible()
    await closeButton.click()
  }

  async expectSwitchedNetwork(network: string) {
    /* SwitchNetwork() already waits for the animation, so just check final state */
    await this.page.waitForTimeout(300)

    const modal = this.page.getByTestId('w3m-modal-card')
    const isModalVisible = await modal.isVisible().catch(() => false)

    if (isModalVisible) {
      const networksView = this.page.locator('w3m-networks-view')
      const isNetworksView = await networksView.isVisible().catch(() => false)
      if (isNetworksView) {
        const switchNetworkButton = this.page.getByTestId(`w3m-network-switch-${network}`)
        await expect(switchNetworkButton).toBeVisible()
      }
    }
  }

  async expectNetworkButton(network: string) {
    const networkButton = this.page.getByTestId('w3m-network-button')
    await expect(networkButton).toHaveText(network)
  }

  async expectSwitchChainWithNetworkButton(chainName: string) {
    const switchNetworkViewLocator = this.page.locator('wui-network-button')
    await expect(switchNetworkViewLocator).toHaveText(chainName)
  }

  async expectSwitchedNetworkWithNetworkView() {
    /*
     * SwitchNetwork() already waits for the animation to complete.
     * Just verify the switch view is gone (it should be by now).
     */
    const switchNetworkViewLocator = this.page.locator('w3m-network-switch-view')
    await expect(switchNetworkViewLocator).not.toBeVisible({
      timeout: 10_000
    })
  }

  async expectSwitchedNetworkOnNetworksView(name: string) {
    /* SwitchNetwork() already waits for the animation, so just check final state */
    await this.page.waitForTimeout(300)

    const modal = this.page.getByTestId('w3m-modal-card')
    const isModalVisible = await modal.isVisible().catch(() => false)

    if (isModalVisible) {
      const networksView = this.page.locator('w3m-networks-view')
      const isNetworksView = await networksView.isVisible().catch(() => false)
      if (isNetworksView) {
        const networkOptions = this.page.getByTestId(`w3m-network-switch-${name}`)
        await expect(networkOptions.locator('wui-icon')).toBeVisible()
      }
    }
  }

  expectSecureSiteFrameNotInjected() {
    const secureSiteIframe = this.page.frame({ name: 'w3m-secure-iframe' })
    expect(secureSiteIframe).toBeNull()
  }

  expectQueryParameterFromUrl({ url, key, value }: { url: string; key: string; value: string }) {
    const _url = new URL(url)
    const queryParameters = Object.fromEntries(_url.searchParams.entries())
    expect(queryParameters[key]).toBe(value)
  }

  async expectAllWalletsListSearchItem(id: string) {
    const allWalletsListSearchItem = this.page.getByTestId(`wallet-search-item-${id}`)
    await expect(allWalletsListSearchItem).toBeVisible()
  }

  async expectNoSocials() {
    const socialList = this.page.getByTestId('wui-list-social')
    await expect(socialList).toBeHidden()
  }

  async expectAllWallets() {
    const allWallets = this.page.getByTestId('all-wallets')
    await expect(allWallets).toBeVisible()
  }

  async expectOpenButton({ disabled }: { disabled: boolean }) {
    const secondaryButton = this.page.getByTestId('w3m-connecting-widget-secondary-button')

    await expect
      .poll(
        () =>
          secondaryButton.evaluate((el: Element) => {
            const btn = el.shadowRoot?.querySelector('button') as HTMLButtonElement | null
            if (btn) {
              return btn.disabled
            }
            const attr = el.getAttribute('disabled')

            return attr !== null && attr !== 'false'
          }),
        { timeout: 60000 }
      )
      .toBe(disabled)
  }

  async expectTryAgainButton() {
    const secondaryButton = this.page.getByTestId('w3m-connecting-widget-secondary-button')
    await expect(secondaryButton).toBeVisible()
  }

  async expectAlertBarText(text: string) {
    const alertBarText = this.page.getByTestId('wui-alertbar-text')
    await expect(alertBarText).toHaveText(text)
  }

  async expectEmailLogin() {
    const emailInput = this.page.getByTestId('wui-email-input')
    await expect(emailInput).toBeVisible()
  }

  async expectEmailLoginNotVisible() {
    const emailInput = this.page.getByTestId('wui-email-input')
    await expect(emailInput).not.toBeVisible()
  }

  async expectEmailLineSeparator() {
    const emailInput = this.page.getByTestId('w3m-email-login-or-separator')
    await expect(emailInput).toBeVisible()
  }

  async expectValidSignature(signature: `0x${string}`, address: `0x${string}`, chainId: number) {
    const isVerified = await verifySignature({
      address,
      message: 'Hello AppKit!',
      signature,
      chainId
    })

    expect(isVerified).toBe(true)
  }

  async expectExternalVisible() {
    const externalConnector = this.page.getByTestId(/^wallet-selector-externaltestconnector/u)
    await expect(externalConnector).toBeVisible()
  }

  async expectCoinbaseNotVisible() {
    const coinbaseConnector = this.page.getByTestId(/^wallet-selector-coinbasewalletsdk/u)
    await expect(coinbaseConnector).not.toBeVisible()
  }

  async expectCoinbaseVisible() {
    const coinbaseConnector = this.page.getByTestId(
      /^wallet-selector-d0ca99ff52b99abc48743dad0f7fc891e041be73574f7fac4afe5d4bb83845c8/u
    )
    await expect(coinbaseConnector).toBeVisible({ timeout: 10_000 })
  }

  async expectActiveConnection() {
    await this.page.waitForTimeout(500)
    await expect(this.page.getByTestId('wui-active-profile-wallet-item')).toBeVisible({
      timeout: MAX_WAIT
    })
    await expect(this.page.getByTestId('active-connection').first()).toBeVisible({
      timeout: MAX_WAIT
    })
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

  async expectOnrampButton(visible: boolean) {
    const onrampButton = this.page.getByTestId('wallet-features-onramp-button')
    if (visible) {
      await expect(onrampButton).toBeVisible()
    } else {
      await expect(onrampButton).not.toBeVisible()
    }
  }

  async expectActivityButton(visible: boolean) {
    const activityButton = this.page.getByTestId('w3m-account-default-activity-button')
    if (visible) {
      await expect(activityButton).toBeVisible()
    } else {
      await expect(activityButton).not.toBeVisible()
    }
  }

  async expectSwapsButton(visible: boolean) {
    const swapsButton = this.page.getByTestId('w3m-account-default-swaps-button')
    if (visible) {
      await expect(swapsButton).toBeVisible()
    } else {
      await expect(swapsButton).not.toBeVisible()
    }
  }
  async expectOnrampProvider(providers: string[]) {
    const promises = providers.map(provider =>
      expect(this.page.getByTestId(`onramp-provider-${provider}`)).toBeVisible()
    )
    await Promise.all(promises)
  }

  async expectWalletGuide(_library: string, guide: 'get-started' | 'explore') {
    const walletGuide = this.page.getByTestId(
      guide === 'explore' ? 'w3m-wallet-guide-explore' : 'w3m-wallet-guide-get-started'
    )
    await expect(walletGuide).toBeVisible()
  }

  async expectAccountNameIndex(index: number, enabled: boolean) {
    const suggestion = this.page.getByTestId('account-name-suggestion').nth(index)
    if (enabled) {
      const registeredTag = suggestion.locator('wui-tag').getByText('Available')
      expect(registeredTag).toBeVisible()
    } else {
      await expect(suggestion).toHaveAttribute('disabled')
      const registeredTag = suggestion.locator('wui-tag').getByText('Registered')
      await expect(registeredTag).toBeVisible()
    }
  }
  async expectAccountNameFound(name: string) {
    const suggestion = this.page.getByTestId('account-name-suggestion').getByText(name)
    await expect(suggestion).toBeVisible()
  }

  async expectAccountNameDisabled(name: string) {
    const suggestion = this.page.getByTestId('account-name-suggestion').getByText(name)
    await expect(suggestion).toHaveAttribute('disabled')
    const registeredTag = suggestion.locator('wui-tag').getByText('Registered')
    await expect(registeredTag).toBeVisible()
  }

  async expectHeaderText(text: string) {
    const headerText = this.page.getByTestId('w3m-header-text')
    await expect(headerText).toHaveText(text)
  }

  async expectSignatureRequestFrameByText(headerText: string) {
    await expect(
      this.page.frameLocator('#w3m-iframe').getByText(headerText),
      'AppKit iframe should be visible'
    ).toBeVisible({
      timeout: 10000
    })
    await this.page.waitForTimeout(500)
  }

  async expectFrameTextToContain(text: string) {
    await expect(
      this.page.frameLocator('#w3m-iframe').getByText(text),
      'AppKit iframe should be visible'
    ).toBeVisible({
      timeout: 10000
    })
  }

  async expectAccountNameApproveTransaction(name: string) {
    await this.expectSignatureRequestFrameByText('requests a signature')
    const iframe = this.page.frameLocator('#w3m-iframe')
    const textContent = await iframe.locator('.textContent').textContent()
    expect(textContent).toContain(`{"name":"${name}","attributes":{},"timestamp":`)
  }

  async expectCallStatusSuccessOrRetry(sendCallsId: string, allowedRetry: boolean) {
    const callStatusReceipt = this.page.getByText('"status": "CONFIRMED"')
    const isConfirmed = await callStatusReceipt.isVisible({
      timeout: 10 * 1000
    })
    if (isConfirmed) {
      const closeButton = this.page.locator('#toast-close-button')

      await expect(closeButton).toBeVisible()
      await closeButton.click()
    } else if (allowedRetry) {
      const callStatusButton = this.page.getByTestId('get-calls-status-button')
      await expect(callStatusButton).toBeVisible()
      await callStatusButton.click()
      this.expectCallStatusSuccessOrRetry(sendCallsId, false)
    }

    throw new Error('Call status not confirmed')
  }

  async expectNetworkVisible(name: string) {
    const network = this.page.getByTestId(`w3m-network-switch-${name}`)
    await expect(network).toBeVisible()
    await expect(network).toBeDisabled()
  }

  async expectNetworksDisabled(name: string) {
    const disabledNetwork = this.page.getByTestId(`w3m-network-switch-${name}`)
    await expect(disabledNetwork.locator('button')).toBeDisabled()
  }

  async expectToBeConnectedInstantly() {
    // Wait for the page to be loaded
    const initializeBoundary = this.page.getByTestId('w3m-page-loading')
    await expect(initializeBoundary).toBeHidden()
    const accountButton = this.page.locator('appkit-account-button').first()
    await expect(accountButton, 'Account button should be present').toBeAttached({
      timeout: 3_000
    })
  }

  async expectAccountButtonAddress(address: string) {
    const accountButton = this.page.getByTestId('account-button')
    await expect(accountButton).toBeVisible({ timeout: MAX_WAIT })
    await expect(accountButton, `Account button to have address ${address}`).toHaveAttribute(
      'address',
      address
    )
  }

  async expectNoUnsupportedUIOnAccountButton() {
    const accountButton = this.page.getByTestId('wui-account-button-unsupported-chain')
    await expect(accountButton).not.toBeVisible({ timeout: MAX_WAIT })
  }

  async expectConnectButtonLoading() {
    const connectButton = this.page.getByTestId('connect-button')
    await expect(connectButton).toContainText('Connecting...')
  }

  async expectAccountButtonReady(namespace?: string) {
    const accountButton = this.page.getByTestId(`account-button${namespace ? `-${namespace}` : ''}`)
    await expect(accountButton).toBeVisible({ timeout: MAX_WAIT })
  }

  async expectAccountSwitched(oldAddress: string, namespace?: string) {
    const address = this.page.getByTestId(`w3m-address${namespace ? `-${namespace}` : ''}`)
    await expect(address).not.toHaveText(oldAddress, {
      timeout: 10000
    })
  }

  async expectSocialsVisible() {
    const socials = this.page.getByTestId('w3m-social-login-widget')
    await expect(socials).toBeVisible()
  }

  async expectSocialsNotVisible() {
    const socials = this.page.getByTestId('w3m-social-login-widget')
    await expect(socials).not.toBeVisible()
  }

  async expectSpecificSocialsVisible(socials: string[]) {
    const promises = socials.map(social =>
      expect(this.page.getByTestId(`social-selector-${social}`)).toBeVisible()
    )
    await Promise.all(promises)
  }

  async expectModalNotVisible() {
    const modal = this.page.getByTestId('w3m-modal')
    await expect(modal).toBeHidden()
  }

  async expectSnackbar(message: string) {
    await expect(this.page.getByTestId('wui-snackbar-message')).toHaveText(message, {
      timeout: MAX_WAIT
    })
  }

  async expectConnectedWalletType(type: string) {
    return expect(this.page.getByTestId('w3m-wallet-type')).toHaveText(type, {
      timeout: MAX_WAIT
    })
  }

  async expectEmail() {
    const email = this.page.getByTestId('w3m-email')
    await expect(email).toBeVisible({ timeout: MAX_WAIT })
  }

  async expectAccountType() {
    const authAccountType = this.page.getByTestId('w3m-account-type')
    await expect(authAccountType).toBeVisible({ timeout: MAX_WAIT })
  }

  async expectSmartAccountStatus() {
    const smartAccountStatus = this.page.getByTestId('w3m-sa-account-status')
    await expect(smartAccountStatus).toBeVisible({ timeout: MAX_WAIT })
  }

  async checkConnectionStatus(status: 'connected' | 'disconnected' | 'loading', network?: string) {
    if (status === 'connected') {
      await this.expectConnected()
    } else if (status === 'disconnected') {
      await this.expectDisconnected()
    } else if (status === 'loading') {
      await this.expectLoading()
    }

    if (network) {
      await this.expectNetworkButton(network)
    }
  }

  async waitUntilSuccessToastHidden() {
    await expect(this.page.getByText(ConstantsUtil.SigningSucceededToastTitle)).toBeHidden({
      timeout: 5000
    })
  }

  async expectUxBrandingReown(visible: boolean) {
    const uxBrandingReown = this.page.getByTestId('ux-branding-reown')
    if (visible) {
      await expect(uxBrandingReown).toBeVisible()
    } else {
      await expect(uxBrandingReown).not.toBeVisible()
    }
  }

  async reownNameInput(name: string) {
    const input = this.page.getByTestId('wui-ens-input').getByTestId('wui-input-text')
    await expect(input, 'Input should have value').toHaveValue(name)
  }
}
