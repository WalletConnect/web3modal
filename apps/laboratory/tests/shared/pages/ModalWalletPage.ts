/* eslint-disable no-await-in-loop */
import type { Page } from '@playwright/test'
import { ModalPage } from './ModalPage'

export class ModalWalletPage extends ModalPage {
  constructor(
    public override readonly page: Page,
    public override readonly library: string
  ) {
    super(page, library, 'wallet')
  }

  async openSettings() {
    await this.page.getByTestId('account-button').click()
    await this.page.getByTestId('wui-profile-button').click()
  }

  override async switchNetwork(network: string) {
    await this.openSettings()
    await this.page.getByTestId('account-switch-network-button').click()
    await this.page.getByTestId(`w3m-network-switch-${network}`).click()
    await this.page.getByTestId('w3m-header-close').click()
    await this.page.waitForTimeout(2000)
  }

  async togglePreferredAccountType() {
    await this.openSettings()
    await this.page.getByTestId('account-toggle-preferred-account-type').click()
    await this.page.getByTestId('w3m-header-close').click()
    await this.page.waitForTimeout(2000)
  }
}
