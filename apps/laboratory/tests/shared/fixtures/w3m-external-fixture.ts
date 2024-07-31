import { ModalPage } from '../pages/ModalPage'
import { timingFixture } from './timing-fixture'
import type { ModalFixture } from './w3m-fixture'

export const testMExternal = timingFixture.extend<ModalFixture>({
  library: ['wagmi', { option: true }],
  modalPage: async ({ page, library }, use) => {
    const modalPage = new ModalPage(page, library, 'external')
    await modalPage.load()
    await use(modalPage)
  }
})
