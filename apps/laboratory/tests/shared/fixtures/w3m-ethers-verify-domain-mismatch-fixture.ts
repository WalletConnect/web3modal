import type { ModalFixture } from './w3m-fixture'
import { ModalPage } from '../pages/ModalPage'
import { timingFixture } from './timing-fixture'

export const testMEthersVerifyDomainMismatch = timingFixture.extend<ModalFixture>({
  library: ['ethers', { option: true }],
  modalPage: async ({ page, library }, use) => {
    const modalPage = new ModalPage(page, library, 'ethers-verify-domain-mismatch')
    await modalPage.load()
    await use(modalPage)
  }
})
