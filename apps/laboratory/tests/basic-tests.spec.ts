import { testMExternal } from './shared/fixtures/w3m-external-fixture'
import { expect, testM } from './shared/fixtures/w3m-fixture'
import { ModalValidator } from './shared/validators/ModalValidator'

testM.describe('Modal only tests', () => {
  testM('Should be able to open modal', async ({ modalPage }) => {
    await modalPage.page.getByTestId('connect-button').click()
    await expect(modalPage.page.getByTestId('all-wallets')).toBeVisible()
  })
})

testMExternal.describe('External connectors tests', () => {
  testMExternal('Should show external connectors', async ({ modalPage }) => {
    const modalValidator = new ModalValidator(modalPage.page)
    await modalPage.page.getByTestId('connect-button').click()
    await modalValidator.expectExternalVisible()
  })
})
