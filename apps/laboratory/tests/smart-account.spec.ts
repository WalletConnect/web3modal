import { testModalSmartAccount } from './shared/fixtures/w3m-smart-account-fixture'
import type { ModalWalletPage } from './shared/pages/ModalWalletPage'
import type { ModalWalletValidator } from './shared/validators/ModalWalletValidator'

testModalSmartAccount.beforeEach(async ({ modalValidator }) => {
  await modalValidator.expectConnected()
})

testModalSmartAccount('it should sign with eoa', async ({ modalPage, modalValidator }) => {
  await modalPage.sign()
  await modalPage.approveSign()
  await modalValidator.expectAcceptedSign()
})

testModalSmartAccount(
  'switch to its smart account',
  async ({ modalPage, modalValidator }, testInfo) => {
    const walletModalPage = modalPage as ModalWalletPage
    const walletModalValidator = modalValidator as ModalWalletValidator

    await walletModalPage.togglePreferredAccountType()
    await walletModalPage.openSettings()
    await walletModalValidator.expectSmartAccountAddress(testInfo.parallelIndex)
  }
)

testModalSmartAccount(
  'it should sign with its smart account',
  async ({ modalPage, modalValidator }) => {
    const walletModalPage = modalPage as ModalWalletPage
    const walletModalValidator = modalValidator as ModalWalletValidator

    await walletModalPage.togglePreferredAccountType()

    await walletModalPage.sign()
    await walletModalPage.approveSign()
    await walletModalValidator.expectAcceptedSign()
  }
)

testModalSmartAccount(
  'it should return to an eoa when switching to a non supported network',
  async ({ modalPage, modalValidator }, testInfo) => {
    const walletModalPage = modalPage as ModalWalletPage
    const walletModalValidator = modalValidator as ModalWalletValidator

    await walletModalPage.togglePreferredAccountType()
    await walletModalPage.switchNetwork('Polygon')
    await walletModalPage.openSettings()
    await walletModalValidator.expectEoaAddress(testInfo.parallelIndex)
  }
)
