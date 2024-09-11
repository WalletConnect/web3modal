/* eslint no-console: 0 */

import { ModalPage } from '../pages/ModalPage'
import { timeStart, timeEnd } from '../utils/logs'
import { timingFixture } from './timing-fixture'

// Declare the types of fixtures to use
export interface ModalFixture {
  modalPage: ModalPage
  library: string
}

// M -> test Modal
export const testM = timingFixture.extend<ModalFixture>({
  library: ['wagmi', { option: true }],
  modalPage: async ({ page, library }, use) => {
    timeStart('new ModalPage')
    const modalPage = new ModalPage(page, library, 'default')
    timeEnd('new ModalPage')
    timeStart('modalPage.load')
    await modalPage.load()
    timeEnd('modalPage.load')
    await use(modalPage)
  }
})
export const testMEthers = timingFixture.extend<ModalFixture>({
  library: ['ethers', { option: true }],
  modalPage: async ({ page, library }, use) => {
    timeStart('new ModalPage')
    const modalPage = new ModalPage(page, library, 'default')
    timeEnd('new ModalPage')
    timeStart('modalPage.load')
    await modalPage.load()
    timeEnd('modalPage.load')
    await use(modalPage)
  }
})

export const testMSiwe = timingFixture.extend<ModalFixture>({
  library: ['wagmi', { option: true }],
  modalPage: async ({ page, library }, use) => {
    const modalPage = new ModalPage(page, library, 'all')
    await modalPage.load()
    await use(modalPage)
  }
})

export { expect } from '@playwright/test'
