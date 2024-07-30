import { test, type BrowserContext } from '@playwright/test'
import { DEFAULT_CHAIN_NAME } from './shared/constants'
import { ModalPage } from './shared/pages/ModalPage'
import { WalletPage } from './shared/pages/WalletPage'
import { ModalValidator } from './shared/validators/ModalValidator'
import { WalletValidator } from './shared/validators/WalletValidator'

/* eslint-disable init-declarations */
let modalPage: ModalPage
let modalValidator: ModalValidator
let walletPage: WalletPage
let walletValidator: WalletValidator
let context: BrowserContext
/* eslint-enable init-declarations */

// -- Setup --------------------------------------------------------------------
const sampleWalletTest = test.extend<{ library: string }>({
  library: ['wagmi', { option: true }]
})

sampleWalletTest.describe.configure({ mode: 'serial' })

sampleWalletTest.beforeAll(async ({ browser, library }) => {
  context = await browser.newContext()
  const browserPage = await context.newPage()

  modalPage = new ModalPage(browserPage, library, 'default')
  walletPage = new WalletPage(await context.newPage())
  modalValidator = new ModalValidator(browserPage)
  walletValidator = new WalletValidator(walletPage.page)

  await modalPage.load()
  await modalPage.qrCodeFlow(modalPage, walletPage)
  await modalValidator.expectConnected()
})

sampleWalletTest.afterAll(async () => {
  await modalPage.page.close()
})

// -- Tests --------------------------------------------------------------------
sampleWalletTest('it should switch networks and sign', async ({ library }) => {
  const chains = library === 'solana' ? ['Solana Testnet', 'Solana'] : ['Polygon', 'Ethereum']

  async function processChain(index: number) {
    if (index >= chains.length) {
      return
    }

    const chainName = chains[index] ?? DEFAULT_CHAIN_NAME
    // -- Switch network --------------------------------------------------------
    /* For Solana, even though we switch to Solana Devnet, the chain name on the wallet page is still Solana */
    const chainNameOnWalletPage = library === 'solana' ? 'Solana' : chainName
    await modalPage.switchNetwork(chainName)
    await modalValidator.expectSwitchedNetwork(chainName)
    await modalPage.closeModal()

    // -- Sign ------------------------------------------------------------------
    await modalPage.sign()
    await walletValidator.expectReceivedSign({ chainName: chainNameOnWalletPage })
    await walletPage.handleRequest({ accept: true })
    await modalValidator.expectAcceptedSign()

    await processChain(index + 1)
  }

  // Start processing from the first chain
  await processChain(0)
})
