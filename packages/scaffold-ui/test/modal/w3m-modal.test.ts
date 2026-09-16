import { elementUpdated, fixture } from '@open-wc/testing'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { html } from 'lit'

import { type CaipNetwork } from '@reown/appkit-common'
import {
  AlertController,
  ApiController,
  ChainController,
  ModalController,
  OptionsController,
  RouterController,
  SIWXUtil
} from '@reown/appkit-controllers'
import type { AccountState, SIWXConfig } from '@reown/appkit-controllers'
import { ErrorUtil } from '@reown/appkit-utils'

import { W3mModal } from '../../src/modal/w3m-modal'
import { HelpersUtil } from '../utils/HelpersUtil'

// --- Mocks ------------------------------------------------------------
const mainnet = {
  id: 1,
  name: 'Ethereum',
  caipNetworkId: 'eip155:1',
  chainNamespace: 'eip155'
} as unknown as CaipNetwork
const polygon = {
  id: 137,
  name: 'Polygon',
  caipNetworkId: 'eip155:137',
  chainNamespace: 'eip155'
} as unknown as CaipNetwork

beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
})

describe('W3mModal', () => {
  describe('Embedded Mode', () => {
    let element: W3mModal

    beforeEach(async () => {
      Element.prototype.animate = vi.fn().mockReturnValue({ finished: true })
      vi.spyOn(ApiController, 'prefetch').mockImplementation(() => Promise.resolve([]))
      vi.spyOn(ApiController, 'fetchWalletsByPage').mockImplementation(() => Promise.resolve())
      vi.spyOn(ApiController, 'prefetchAnalyticsConfig').mockImplementation(() => Promise.resolve())
      OptionsController.setEnableEmbedded(true)
      ModalController.close()
      element = await fixture(html`<w3m-modal .enableEmbedded=${true}></w3m-modal>`)
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should be visible when embedded is enabled', () => {
      expect(element).toBeTruthy()
      const card = HelpersUtil.getByTestId(element, 'w3m-modal-card')
      expect(card).toBeTruthy()
      expect(HelpersUtil.querySelect(element, 'w3m-header')).toBeTruthy()
      expect(HelpersUtil.querySelect(element, 'w3m-router')).toBeTruthy()
      expect(HelpersUtil.querySelect(element, 'w3m-snackbar')).toBeTruthy()
      expect(HelpersUtil.querySelect(element, 'w3m-alertbar')).toBeTruthy()
      expect(HelpersUtil.querySelect(element, 'w3m-tooltip')).toBeTruthy()
    })

    it('should not render overlay in embedded mode', () => {
      const overlay = HelpersUtil.getByTestId(element, 'w3m-modal-overlay')
      expect(overlay).toBeNull()
    })

    it('should name the card after the current view heading', async () => {
      RouterController.reset('Connect')
      element = await fixture(html`<w3m-modal .enableEmbedded=${true}></w3m-modal>`)
      const card = HelpersUtil.getByTestId(element, 'w3m-modal-card')
      expect(card.getAttribute('aria-label')).toBe('Connect Wallet')

      RouterController.push('Networks')
      await elementUpdated(element)
      expect(card.getAttribute('aria-label')).toBe('Choose Network')

      RouterController.push('Account')
      await elementUpdated(element)
      expect(card.getAttribute('aria-label')).toBe('Account')
    })

    it('should close modal when wallet is connected', async () => {
      ChainController.state.activeCaipAddress = 'eip155:1:0x123...'
      await fixture(html`<w3m-modal .enableEmbedded=${true}></w3m-modal>`)
      ChainController.state.activeCaipAddress = undefined

      expect(ModalController.state.open).toBe(false)
    })

    it('should prefetch when modal is open', async () => {
      element = await fixture(html`<w3m-modal .enableEmbedded=${true}></w3m-modal>`)

      expect(ApiController.prefetch).toHaveBeenCalled()
    })
  })

  describe('Standard Mode', () => {
    let element: W3mModal

    beforeEach(async () => {
      vi.spyOn(ApiController, 'prefetch').mockImplementation(() => Promise.resolve([]))
      vi.spyOn(ApiController, 'fetchWalletsByPage').mockImplementation(() => Promise.resolve())
      vi.spyOn(ApiController, 'prefetchAnalyticsConfig').mockImplementation(() => Promise.resolve())
      OptionsController.setEnableEmbedded(false)
      ModalController.close()
      element = await fixture(html`<w3m-modal></w3m-modal>`)
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should not be visible when closed', () => {
      expect(HelpersUtil.getByTestId(element, 'w3m-modal-overlay')).toBeNull()
    })

    it('should prefetch when modal is open', async () => {
      await ModalController.open()

      element.requestUpdate()
      await elementUpdated(element)

      expect(ApiController.prefetch).toHaveBeenCalled()
    })

    it('should be visible when opened', async () => {
      await ModalController.open()

      element.requestUpdate()
      await elementUpdated(element)

      expect(HelpersUtil.getByTestId(element, 'w3m-modal-overlay')).toBeTruthy()
      expect(HelpersUtil.getByTestId(element, 'w3m-modal-card')).toBeTruthy()
    })

    it('should handle overlay click', async () => {
      ModalController.open()
      element.requestUpdate()
      await elementUpdated(element)

      const overlay = HelpersUtil.getByTestId(element, 'w3m-modal-overlay')
      overlay?.click()
      element.requestUpdate()
      await elementUpdated(element)

      expect(ModalController.state.open).toBe(false)
    })

    it('should add shake class when shaking', async () => {
      ModalController.open()
      element.requestUpdate()
      await elementUpdated(element)

      ModalController.shake()
      element.requestUpdate()
      await elementUpdated(element)

      const card = HelpersUtil.getByTestId(element, 'w3m-modal-card')
      expect(card?.getAttribute('shake')).toBe('true')
    })

    it('prevents closing on unsupported chain', async () => {
      const shakeSpy = vi.spyOn(ModalController, 'shake')
      ModalController.open({ view: 'UnsupportedChain' })

      element.requestUpdate()
      await elementUpdated(element)

      const overlay = HelpersUtil.getByTestId(element, 'w3m-modal-overlay')
      overlay?.click()

      expect(shakeSpy).toHaveBeenCalled()
      expect(ModalController.state.open).toBe(true)
    })
  })

  describe('Network Changes', () => {
    let element: W3mModal

    beforeEach(async () => {
      vi.restoreAllMocks()
      global.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn()
      }))
      vi.spyOn(ChainController, 'state', 'get').mockReturnValue({
        ...ChainController.state,
        activeChain: 'eip155'
      })
      vi.spyOn(ChainController, 'getAccountData').mockReturnValue({
        caipAddress: 'eip155:1:0x123'
      } as unknown as AccountState)
      vi.spyOn(ApiController, 'prefetch').mockImplementation(() => Promise.resolve([]))
      vi.spyOn(ApiController, 'fetchWalletsByPage').mockImplementation(() => Promise.resolve())
      vi.spyOn(ApiController, 'prefetchAnalyticsConfig').mockImplementation(() => Promise.resolve())
      OptionsController.setEnableEmbedded(false)
      element = await fixture(html`<w3m-modal></w3m-modal>`)
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should handle network change when not connected', async () => {
      ModalController.close()
      const goBackSpy = vi.spyOn(RouterController, 'goBack')
      ;(element as any).caipAddress = undefined
      ;(element as any).caipNetwork = mainnet

      ChainController.setActiveCaipNetwork(polygon)
      element.requestUpdate()
      await elementUpdated(element)

      expect(goBackSpy).not.toHaveBeenCalled()
    })

    it('should call goBack when network changed and page is UnsupportedChain', async () => {
      ModalController.open({ view: 'UnsupportedChain' })
      const goBackSpy = vi.spyOn(RouterController, 'goBack')

      ChainController.setActiveCaipNetwork(mainnet) // switch network

      element.requestUpdate()
      await elementUpdated(element)

      expect(goBackSpy).toHaveBeenCalled()
    })

    it('should handle network change when connected', async () => {
      ModalController.close()
      const goBackSpy = vi.spyOn(RouterController, 'goBack')
      ;(element as any).caipAddress = 'eip155:137:0x123'
      ;(element as any).caipNetwork = polygon

      ChainController.setActiveCaipNetwork(mainnet)
      element.requestUpdate()
      await elementUpdated(element)

      expect(goBackSpy).not.toHaveBeenCalled()
    })
  })

  describe('Initialization', () => {
    it('should prefetch analytics config on page load', async () => {
      const prefetchSpy = vi.spyOn(ApiController, 'prefetchAnalyticsConfig')
      await fixture(html`<w3m-modal></w3m-modal>`)

      expect(prefetchSpy).toHaveBeenCalled()
    })

    it('should clean up subscriptions on disconnect', async () => {
      const element: W3mModal = await fixture(html`<w3m-modal></w3m-modal>`)
      const abortSpy = vi.fn()
      ;(element as any).abortController = { abort: abortSpy }

      element.disconnectedCallback()

      expect(abortSpy).toHaveBeenCalled()
    })
  })

  describe('SIWX/SIWE', () => {
    beforeAll(() => {
      // Create w3m-frame iframe
      const w3mFrame = document.createElement('iframe')
      w3mFrame.id = 'w3m-iframe'
      document.body.appendChild(w3mFrame)
    })

    it('should prevent the user from closing the modal when required is set to true', async () => {
      ModalController.open({ view: 'ApproveTransaction' })
      vi.useFakeTimers()

      vi.spyOn(SIWXUtil, 'getSIWX').mockReturnValue({
        getRequired: vi.fn().mockReturnValue(true),
        getSessions: vi.fn().mockResolvedValue([])
      } as unknown as SIWXConfig)

      const element: W3mModal = await fixture(html`<w3m-modal></w3m-modal>`)

      const shakeSpy = vi.spyOn(ModalController, 'shake')
      const closeSpy = vi.spyOn(ModalController, 'close')

      const overlay = HelpersUtil.getByTestId(element, 'w3m-modal-overlay')

      overlay.click()

      await vi.advanceTimersByTimeAsync(200)

      expect(closeSpy).not.toHaveBeenCalled()
      expect(shakeSpy).toHaveBeenCalled()
    })

    it('should allow the user to close the modal when required is set to false', async () => {
      ModalController.open({ view: 'ApproveTransaction' })
      vi.useFakeTimers()

      vi.spyOn(SIWXUtil, 'getSIWX').mockReturnValue({
        getRequired: vi.fn().mockReturnValue(false),
        getSessions: vi.fn().mockResolvedValue([])
      } as unknown as SIWXConfig)

      const element: W3mModal = await fixture(html`<w3m-modal></w3m-modal>`)

      const shakeSpy = vi.spyOn(ModalController, 'shake')
      const closeSpy = vi.spyOn(ModalController, 'close')

      const overlay = HelpersUtil.getByTestId(element, 'w3m-modal-overlay')

      overlay.click()

      await vi.advanceTimersByTimeAsync(200)

      expect(shakeSpy).not.toHaveBeenCalled()
      expect(closeSpy).toHaveBeenCalled()
    })
  })

  describe('Debug Mode', () => {
    let element: W3mModal

    beforeAll(() => {
      ModalController.open()
    })

    beforeEach(async () => {
      vi.spyOn(ApiController, 'prefetch').mockImplementation(() => Promise.resolve([]))
      vi.spyOn(ApiController, 'fetchWalletsByPage').mockImplementation(() => Promise.resolve())
      vi.spyOn(ApiController, 'prefetchAnalyticsConfig').mockImplementation(() => Promise.resolve())
      vi.spyOn(AlertController, 'open')

      // Reset alert state
      AlertController.close()
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should display alert when debug mode is enabled and project ID is not configured', async () => {
      // Set debug mode to true
      OptionsController.setDebug(true)

      // Trigger an alert for missing project ID
      AlertController.open(ErrorUtil.ALERT_ERRORS.PROJECT_ID_NOT_CONFIGURED, 'error')

      // Render the modal
      element = await fixture(html`<w3m-modal></w3m-modal>`)
      await elementUpdated(element)

      // Expect alertbar to be visible
      const alertbar = HelpersUtil.querySelect(element, 'w3m-alertbar')
      expect(alertbar).toBeTruthy()
      expect(AlertController.state.open).toBe(true)
      expect(AlertController.state.message).toBe('Project ID Missing')
      expect(AlertController.state.variant).toBe('error')
    })

    it('should not display alert when debug mode is disabled', async () => {
      // Set debug mode to false
      OptionsController.setDebug(false)

      // Attempt to trigger an alert for missing project ID
      AlertController.open(ErrorUtil.ALERT_ERRORS.PROJECT_ID_NOT_CONFIGURED, 'error')

      // Render the modal
      element = await fixture(html`<w3m-modal></w3m-modal>`)
      await elementUpdated(element)

      // Alert state should not be open since debug mode is disabled
      expect(AlertController.state.open).toBe(false)
    })
  })

  describe('onNewAddress', () => {
    let element: W3mModal

    beforeEach(async () => {
      vi.spyOn(ApiController, 'prefetch').mockImplementation(() => Promise.resolve([]))
      vi.spyOn(ApiController, 'fetchWalletsByPage').mockImplementation(() => Promise.resolve())
      vi.spyOn(ApiController, 'prefetchAnalyticsConfig').mockImplementation(() => Promise.resolve())
      vi.spyOn(SIWXUtil, 'initializeIfEnabled').mockImplementation(() => Promise.resolve())
      vi.spyOn(SIWXUtil, 'getSessions').mockImplementation(() => Promise.resolve([]))
      vi.spyOn(ChainController, 'setIsSwitchingNamespace')
      vi.spyOn(ModalController, 'close')
      vi.spyOn(RouterController, 'goBack')

      element = await fixture(html`<w3m-modal></w3m-modal>`)
    })

    afterEach(() => {
      vi.clearAllMocks()
      RouterController.state.view = 'Connect'
      ChainController.state.isSwitchingNamespace = false
    })

    it('should close modal when address is undefined and not in special states', async () => {
      await (element as any).onNewAddress(undefined)

      expect(ModalController.close).toHaveBeenCalled()
      expect(ChainController.setIsSwitchingNamespace).toHaveBeenCalledWith(false)
      expect(SIWXUtil.initializeIfEnabled).toHaveBeenCalled()
    })

    it('should not close modal when address is undefined but switching namespace', async () => {
      ChainController.state.isSwitchingNamespace = true
      ;(element as any).caipAddress = 'eip155:1:0x123'
      await (element as any).onNewAddress(undefined)

      expect(ModalController.close).not.toHaveBeenCalled()
      expect(ChainController.setIsSwitchingNamespace).toHaveBeenCalledWith(false)
      expect(SIWXUtil.initializeIfEnabled).toHaveBeenCalled()
    })

    it('should handle namespace switching with authenticated session', async () => {
      ChainController.state.isSwitchingNamespace = true
      vi.spyOn(SIWXUtil, 'getSIWX').mockReturnValue({
        getRequired: vi.fn().mockReturnValue(true)
      } as unknown as SIWXConfig)
      vi.spyOn(SIWXUtil, 'getSessions').mockResolvedValue([
        { data: { accountAddress: '0x123' } }
      ] as any)

      await (element as any).onNewAddress('eip155:1:0x123')

      expect(SIWXUtil.initializeIfEnabled).toHaveBeenCalledOnce()
      expect(ChainController.setIsSwitchingNamespace).toHaveBeenCalledWith(false)
    })

    it('should not navigate when in profile view with new address', async () => {
      RouterController.state.view = 'ProfileWallets'

      await (element as any).onNewAddress('eip155:1:0x123')

      expect(RouterController.goBack).not.toHaveBeenCalled()
      expect(ModalController.close).not.toHaveBeenCalled()
      expect(ChainController.setIsSwitchingNamespace).toHaveBeenCalledWith(false)
    })
  })
})
