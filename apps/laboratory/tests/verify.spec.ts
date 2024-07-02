import { DEFAULT_CHAIN_NAME, DEFAULT_SESSION_PARAMS } from './shared/constants'
import { testM } from './shared/fixtures/w3m-fixture'
import { testMVerifyDomainMismatch } from './shared/fixtures/w3m-verify-domain-mismatch-fixture'
import { testMVerifyEvil } from './shared/fixtures/w3m-verify-evil-fixture'
import { testMVerifyValid } from './shared/fixtures/w3m-verify-valid-fixture'
import { WalletPage } from './shared/pages/WalletPage'
import { WalletValidator } from './shared/validators/WalletValidator'
import { expect } from '@playwright/test'

testM(
  'connection and signature requests from non-verified project should show as cannot verify',
  async ({ modalPage, modalValidator, context }) => {
    const walletPage = new WalletPage(await context.newPage())
    await walletPage.load()
    const walletValidator = new WalletValidator(walletPage.page)

    const uri = await modalPage.getConnectUri()
    await walletPage.connectWithUri(uri)
    await expect(walletPage.page.getByText('Cannot Verify')).toBeVisible()
    await walletPage.handleSessionProposal(DEFAULT_SESSION_PARAMS)
    await modalValidator.expectConnected()
    await walletValidator.expectConnected()

    await modalPage.sign()
    const chainName = modalPage.library === 'solana' ? 'Solana' : DEFAULT_CHAIN_NAME
    await walletValidator.expectReceivedSign({ chainName })
    await expect(walletPage.page.getByText('Cannot Verify')).toBeVisible()
    await walletPage.handleRequest({ accept: true })
    await modalValidator.expectAcceptedSign()

    await modalPage.disconnect()
    await modalValidator.expectDisconnected()
    await walletValidator.expectDisconnected()
  }
)

testMVerifyValid(
  'connection and signature requests from non-scam verified domain should show as domain match',
  async ({ modalPage, modalValidator, context }) => {
    const walletPage = new WalletPage(await context.newPage())
    await walletPage.load()
    const walletValidator = new WalletValidator(walletPage.page)

    const uri = await modalPage.getConnectUri()
    await walletPage.connectWithUri(uri)
    await expect(walletPage.page.getByTestId('session-info-verified')).toBeVisible()
    await walletPage.handleSessionProposal(DEFAULT_SESSION_PARAMS)
    await modalValidator.expectConnected()
    await walletValidator.expectConnected()

    await modalPage.sign()
    const chainName = modalPage.library === 'solana' ? 'Solana' : DEFAULT_CHAIN_NAME
    await walletValidator.expectReceivedSign({ chainName })
    await expect(walletPage.page.getByTestId('session-info-verified')).toBeVisible()
    await walletPage.handleRequest({ accept: true })
    await modalValidator.expectAcceptedSign()

    await modalPage.disconnect()
    await modalValidator.expectDisconnected()
    await walletValidator.expectDisconnected()
  }
)

testMVerifyDomainMismatch(
  'connection and signature requests from non-scam verified domain but on localhost should show as invalid domain',
  async ({ modalPage, modalValidator, context }) => {
    const walletPage = new WalletPage(await context.newPage())
    await walletPage.load()
    const walletValidator = new WalletValidator(walletPage.page)

    const uri = await modalPage.getConnectUri()
    await walletPage.connectWithUri(uri)
    await expect(walletPage.page.getByText('Invalid Domain')).toBeVisible()
    await walletPage.handleSessionProposal(DEFAULT_SESSION_PARAMS)
    await modalValidator.expectConnected()
    await walletValidator.expectConnected()

    await modalPage.sign()
    const chainName = modalPage.library === 'solana' ? 'Solana' : DEFAULT_CHAIN_NAME
    await walletValidator.expectReceivedSign({ chainName })
    await expect(walletPage.page.getByText('Invalid Domain')).toBeVisible()
    await walletPage.handleRequest({ accept: true })
    await modalValidator.expectAcceptedSign()

    await modalPage.disconnect()
    await modalValidator.expectDisconnected()
    await walletValidator.expectDisconnected()
  }
)

testMVerifyEvil(
  'connection and signature requests from scam verified domain should show as scam domain',
  async ({ modalPage, modalValidator, context }) => {
    const walletPage = new WalletPage(await context.newPage())
    await walletPage.load()
    const walletValidator = new WalletValidator(walletPage.page)

    const uri = await modalPage.getConnectUri()
    await walletPage.connectWithUri(uri)
    await expect(walletPage.page.getByText('Website flagged')).toBeVisible()
    await walletPage.page.getByText('Proceed anyway').click()
    await expect(walletPage.page.getByText('Potential threat')).toBeVisible()
    await walletPage.handleSessionProposal(DEFAULT_SESSION_PARAMS)
    await modalValidator.expectConnected()
    await walletValidator.expectConnected()

    await modalPage.sign()
    const chainName = modalPage.library === 'solana' ? 'Solana' : DEFAULT_CHAIN_NAME
    await expect(walletPage.page.getByText('Website flagged')).toBeVisible()
    await walletPage.page.getByText('Proceed anyway').click()
    await walletValidator.expectReceivedSign({ chainName })
    await expect(walletPage.page.getByText('Potential threat')).toBeVisible()
    await walletPage.handleRequest({ accept: true })
    await modalValidator.expectAcceptedSign()

    await modalPage.disconnect()
    await modalValidator.expectDisconnected()
    await walletValidator.expectDisconnected()
  }
)
