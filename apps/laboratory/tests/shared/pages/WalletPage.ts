/* eslint-disable no-await-in-loop */
import { expect, type Locator, type Page } from '@playwright/test'
import { WALLET_URL } from '../constants'
import type { SessionParams } from '../types'

export class WalletPage {
  private readonly baseURL = WALLET_URL

  private readonly gotoHome: Locator
  private readonly vercelPreview: Locator

  constructor(public readonly page: Page) {
    this.gotoHome = this.page.getByTestId('wc-connect')
    this.vercelPreview = this.page.locator('css=vercel-live-feedback')
  }

  async load() {
    await this.page.goto(this.baseURL)
  }

  /**
   * Connect by inserting provided URI into the input element
   */
  async connectWithUri(uri: string) {
    const isVercelPreview = (await this.vercelPreview.count()) > 0
    if (isVercelPreview) {
      await this.vercelPreview.evaluate((iframe: HTMLIFrameElement) => iframe.remove())
    }
    await this.gotoHome.click()
    await this.page.getByTestId('uri-input').fill(uri)
    await this.page.getByTestId('uri-connect-button').click()
  }

  /**
   * Handle a session proposal event in the wallet
   * @param reqAccounts - required account numbers to select ex/ ['1', '2']
   * @param optAccounts - optional account numbers to select ex/ ['1', '2']
   * @param accept - accept or reject the session
   */
  async handleSessionProposal(opts: SessionParams) {
    const variant = opts.accept ? `approve` : `reject`
    // `.click` doesn't work here, so we use `.focus` and `Space`
    const btn = this.page.getByTestId(`session-${variant}-button`)
    await btn.waitFor({
      state: 'visible'
    })
    await expect(btn).toBeEnabled()
    await btn.focus()
    await this.page.keyboard.press('Space')
  }

  async handleRequest({ accept }: { accept: boolean }) {
    const variant = accept ? `approve` : `reject`
    // `.click` doesn't work here, so we use `.focus` and `Space`
    const btn = this.page.getByTestId(`session-${variant}-button`)
    await btn.waitFor({
      state: 'visible'
    })
    await expect(btn).toBeEnabled()
    await btn.focus()
    await this.page.keyboard.press('Space')
  }
}
