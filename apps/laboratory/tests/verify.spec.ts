import { DEFAULT_CHAIN_NAME, DEFAULT_SESSION_PARAMS } from './shared/constants'
import { testM as testMWagmi } from './shared/fixtures/w3m-fixture'
import { testMWagmiVerifyDomainMismatch } from './shared/fixtures/w3m-wagmi-verify-domain-mismatch-fixture'
import { testMWagmiVerifyEvil } from './shared/fixtures/w3m-wagmi-verify-evil-fixture'
import { testMWagmiVerifyValid } from './shared/fixtures/w3m-wagmi-verify-valid-fixture'
import { testMEthers } from './shared/fixtures/w3m-fixture'
import { testMEthersVerifyDomainMismatch } from './shared/fixtures/w3m-ethers-verify-domain-mismatch-fixture'
import { testMEthersVerifyEvil } from './shared/fixtures/w3m-ethers-verify-evil-fixture'
import { testMEthersVerifyValid } from './shared/fixtures/w3m-ethers-verify-valid-fixture'
import { WalletPage } from './shared/pages/WalletPage'
import { ModalValidator } from './shared/validators/ModalValidator'
import { WalletValidator } from './shared/validators/WalletValidator'
import { expect } from '@playwright/test'

testMWagmi(
  'wagmi: connection and signature requests from non-verified project should show as cannot verify',
  async ({ modalPage, context }) => {
    if (modalPage.library === 'solana') {
      return
    }

    const modalValidator = new ModalValidator(modalPage.page)
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

testMWagmiVerifyValid(
  'wagmi: connection and signature requests from non-scam verified domain should show as domain match',
  async ({ modalPage, context }) => {
    if (modalPage.library === 'solana') {
      return
    }

    const modalValidator = new ModalValidator(modalPage.page)
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

testMWagmiVerifyDomainMismatch(
  'wagmi: connection and signature requests from non-scam verified domain but on localhost should show as invalid domain',
  async ({ modalPage, context }) => {
    if (modalPage.library === 'solana') {
      return
    }

    const modalValidator = new ModalValidator(modalPage.page)
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

testMWagmiVerifyEvil(
  'wagmi: connection and signature requests from scam verified domain should show as scam domain',
  async ({ modalPage, context }) => {
    if (modalPage.library === 'solana') {
      return
    }

    const modalValidator = new ModalValidator(modalPage.page)
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

testMEthers(
  'ethers: connection and signature requests from non-verified project should show as cannot verify',
  async ({ modalPage, context }) => {
    if (modalPage.library === 'solana') {
      return
    }

    const modalValidator = new ModalValidator(modalPage.page)
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

testMEthersVerifyValid(
  'ethers: connection and signature requests from non-scam verified domain should show as domain match',
  async ({ modalPage, context }) => {
    if (modalPage.library === 'solana') {
      return
    }

    const modalValidator = new ModalValidator(modalPage.page)
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

testMEthersVerifyDomainMismatch(
  'ethers: connection and signature requests from non-scam verified domain but on localhost should show as invalid domain',
  async ({ modalPage, context }) => {
    if (modalPage.library === 'solana') {
      return
    }

    const modalValidator = new ModalValidator(modalPage.page)
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

testMEthersVerifyEvil(
  'ethers: connection and signature requests from scam verified domain should show as scam domain',
  async ({ modalPage, context }) => {
    if (modalPage.library === 'solana') {
      return
    }

    const modalValidator = new ModalValidator(modalPage.page)
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
