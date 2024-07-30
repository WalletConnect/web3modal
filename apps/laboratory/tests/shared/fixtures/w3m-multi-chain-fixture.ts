/* eslint no-console: 0 */

import { testM as base } from './w3m-fixture'
import { ModalPage } from '../pages/ModalPage'
import { ModalValidator } from '../validators/ModalValidator'

interface ModalWalletFixture {
  modalPage: ModalPage
  modalValidator: ModalValidator
  library: string
}

export const testMultiChainM = base.extend<ModalWalletFixture>({
  library: 'multichain',
  modalPage: async ({ page, library }, use) => {
    const modalPage = new ModalPage(page, library, 'all')
    await modalPage.load()
    await use(modalPage)
  },
  modalValidator: async ({ modalPage }, use) => {
    const modalValidator = new ModalValidator(modalPage.page)
    await use(modalValidator)
  }
})

export { expect } from '@playwright/test'
