import type { ModalFixture } from './w3m-fixture'
import { ModalPage } from '../pages/ModalPage'
import { timingFixture } from './timing-fixture'

export const testMEthersVerifyEvil = timingFixture.extend<ModalFixture>({
  library: ['ethers', { option: true }],
  modalPage: async ({ page, library }, use) => {
    const modalPage = new ModalPage(page, library, 'ethers-verify-evil')
    await modalPage.load()
    await use(modalPage)
  }
})
