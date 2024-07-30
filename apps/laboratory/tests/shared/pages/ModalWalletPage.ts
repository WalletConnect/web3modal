/* eslint-disable no-await-in-loop */
import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { ModalPage } from './ModalPage'

export class ModalWalletPage extends ModalPage {
  constructor(
    public override readonly page: Page,
    public override readonly library: string,
    public override readonly flavor: 'email' | 'all' = 'email'
  ) {
    super(page, library, flavor)
  }

  async openSettings() {
    await this.page.getByTestId('account-settings-button').click()
  }

  override async switchNetwork(network: string) {
    await this.page.getByTestId('account-switch-network-button').click()
    await this.page.getByTestId(`w3m-network-switch-${network}`).click()
  }

  async togglePreferredAccountType() {
    const toggleButton = this.page.getByTestId('account-toggle-preferred-account-type')
    await expect(toggleButton, 'Toggle button should be visible').toBeVisible()
    await expect(toggleButton, 'Toggle button should be enabled').toBeEnabled()
    await toggleButton.click()
  }

  override async disconnect(): Promise<void> {
    const disconnectBtn = this.page.getByTestId('disconnect-button')
    await expect(disconnectBtn, 'Disconnect button should be visible').toBeVisible()
    await expect(disconnectBtn, 'Disconnect button should be enabled').toBeEnabled()
    await disconnectBtn.click()
    await this.page.getByTestId('connect-button').waitFor({ state: 'visible', timeout: 5000 })
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
