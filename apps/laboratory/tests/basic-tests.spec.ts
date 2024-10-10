import { test, type BrowserContext, type Page } from '@playwright/test'
import { BASE_URL } from './shared/constants'
import { expect } from './shared/fixtures/w3m-fixture'
import { ModalPage } from './shared/pages/ModalPage'
import { ModalValidator } from './shared/validators/ModalValidator'

/* eslint-disable init-declarations */
let modalPage: ModalPage
let modalValidator: ModalValidator
let context: BrowserContext
let browserPage: Page
/* eslint-enable init-declarations */

// -- Setup --------------------------------------------------------------------
const basicTest = test.extend<{ library: string }>({
  library: ['wagmi', { option: true }]
})

basicTest.describe.configure({ mode: 'serial' })

basicTest.beforeAll(async ({ browser, library }) => {
  context = await browser.newContext()
  browserPage = await context.newPage()

  modalPage = new ModalPage(browserPage, library, 'default')
  modalValidator = new ModalValidator(modalPage.page)

  await modalPage.load()
})

basicTest.afterAll(async () => {
  await modalPage.page.close()
})

// -- Tests --------------------------------------------------------------------
basicTest('Should be able to open modal', async () => {
  await modalPage.page.getByTestId('connect-button').click()
  await expect(modalPage.page.getByTestId('all-wallets')).toBeVisible()
  await modalPage.closeModal()
})

basicTest('Should be able to open modal with the open hook', async () => {
  const openHookButton = modalPage.page.getByTestId('w3m-open-hook-button')
  await openHookButton.click()
  await expect(modalPage.page.getByTestId('all-wallets')).toBeVisible()
  await modalPage.closeModal()
})

basicTest('Should show socials enabled by default', async () => {
  await modalPage.page.getByTestId('connect-button').click()
  await modalValidator.expectSocialsVisible()
  await modalPage.closeModal()
})

basicTest('Should show external connectors', async ({ library }) => {
  if (library !== 'wagmi') {
    return
  }

  await modalPage.page.goto(`${BASE_URL}/library/external/`)
  await modalPage.page.getByTestId('connect-button').click()
  await modalValidator.expectExternalVisible()
})
