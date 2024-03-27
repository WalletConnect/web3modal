/* eslint no-console: 0 */

import { test as base } from '@playwright/test'
import { ModalPage } from '../pages/ModalPage'
import { ModalValidator } from '../validators/ModalValidator'

// Declare the types of fixtures to use
export interface ModalFixture {
  modalPage: ModalPage
  modalValidator: ModalValidator
  library: string
}

// M -> test Modal
export const testM = base.extend<ModalFixture>({
  library: ['wagmi', { option: true }],
  modalPage: async ({ page, library }, use) => {
    console.time('new ModalPage')
    const modalPage = new ModalPage(page, library, 'default')
    console.timeEnd('new ModalPage')
    console.time('modalPage.load')
    await modalPage.load()
    console.timeEnd('modalPage.load')
    await use(modalPage)
  },
  modalValidator: async ({ modalPage }, use) => {
    console.time('new ModalValidator')
    const modalValidator = new ModalValidator(modalPage.page)
    console.timeEnd('new ModalValidator')
    await use(modalValidator)
  }
})
export const testMSiwe = base.extend<ModalFixture>({
  library: ['wagmi', { option: true }],
  modalPage: async ({ page, library }, use) => {
    const modalPage = new ModalPage(page, library, 'siwe')
    await modalPage.load()
    await use(modalPage)
  },
  modalValidator: async ({ modalPage }, use) => {
    const modalValidator = new ModalValidator(modalPage.page)
    await use(modalValidator)
  }
})

export { expect } from '@playwright/test'
