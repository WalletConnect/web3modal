import { elementUpdated, fixture } from '@open-wc/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { html } from 'lit'

import type { CaipNetwork } from '@reown/appkit-common'
import {
  AssetController,
  AssetUtil,
  ChainController,
  EventsController,
  ModalController,
  OptionsController,
  RouterController,
  SIWXUtil
} from '@reown/appkit-controllers'

import { W3mHeader } from '../../src/partials/w3m-header'
import { HelpersUtil } from '../utils/HelpersUtil'

// -- Constants ------------------------------------------------------------
const mockNetwork = {
  id: '1',
  name: 'Test Network',
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:1',
  nativeCurrency: { name: 'Test', symbol: 'TEST', decimals: 18 },
  rpcUrls: { default: { http: ['https://test.com'] } }
} as unknown as CaipNetwork

const ACCOUNT_SELECT_NETWORK_TEST_ID = 'w3m-account-select-network'

describe('W3mHeader', () => {
  let element: W3mHeader

  beforeEach(async () => {
    vi.restoreAllMocks()
    Element.prototype.animate = vi.fn().mockReturnValue({ finished: Promise.resolve() })
    vi.spyOn(ChainController, 'getAccountData').mockReturnValue({
      currentTab: 0,
      tokenBalance: [],
      smartAccountDeployed: false,
      addressLabels: new Map(),
      address: '0xAddress',
      caipAddress: 'eip155:1:0xAddress'
    })
    RouterController.reset('Connect')
    element = await fixture(html`<w3m-header></w3m-header>`)
    await element.updateComplete
  })

  describe('Network Selection', () => {
    it('should render network select in Account view', async () => {
      RouterController.push('Account')
      element.requestUpdate()
      await element.updateComplete
      await elementUpdated(element)

      const networkSelect = HelpersUtil.getByTestId(element, 'w3m-account-select-network')
      expect(networkSelect).toBeTruthy()
    })

    it('should update network image when network changes', async () => {
      RouterController.push('Account')
      element.requestUpdate()
      await element.updateComplete

      const getNetworkImageSpy = vi.spyOn(AssetUtil, 'getNetworkImage')
      ChainController.setActiveCaipNetwork(mockNetwork)
      await elementUpdated(element)

      const networkSelect = HelpersUtil.getByTestId(element, 'w3m-account-select-network')
      expect(networkSelect?.getAttribute('active-network')).toBe('Test Network')
      expect(getNetworkImageSpy).toHaveBeenCalledWith(mockNetwork)
    })

    it('should update network image when AssetController emits new images', async () => {
      RouterController.push('Account')
      element.requestUpdate()
      await element.updateComplete

      let subscriberCallback: Function | undefined
      vi.spyOn(AssetController, 'subscribeNetworkImages').mockImplementation(callback => {
        subscriberCallback = callback
        return () => undefined
      })

      element = await fixture(html`<w3m-header></w3m-header>`)
      await element.updateComplete

      ChainController.setActiveCaipNetwork(mockNetwork)
      await elementUpdated(element)

      const getNetworkImageSpy = vi.spyOn(AssetUtil, 'getNetworkImage')

      // Simulate AssetController emitting new network images
      if (subscriberCallback) {
        subscriberCallback()
      }

      expect(getNetworkImageSpy).toHaveBeenCalledWith(mockNetwork)
    })
  })

  describe('Back Button', () => {
    it('should show back button when history length > 1', async () => {
      RouterController.push('Networks')
      await element.updateComplete
      await elementUpdated(element)

      const backButton = HelpersUtil.getByTestId(element, 'header-back')
      expect(backButton).toBeTruthy()
    })

    it('should not show back button in ApproveTransaction view', async () => {
      RouterController.push('ApproveTransaction')
      element.requestUpdate()
      await element.updateComplete
      await elementUpdated(element)

      const backButton = HelpersUtil.getByTestId(element, 'header-back')
      expect(backButton).toBeFalsy()
    })

    it('should call RouterController.goBack when back button is clicked', async () => {
      const goBackSpy = vi.spyOn(RouterController, 'goBack')
      RouterController.push('Networks')
      await element.updateComplete
      await elementUpdated(element)

      const backButton = HelpersUtil.getByTestId(element, 'header-back')
      backButton?.click()

      expect(goBackSpy).toHaveBeenCalled()
    })
  })

  describe('Close Button', () => {
    it('should render close button', async () => {
      const closeButton = HelpersUtil.getByTestId(element, 'w3m-header-close')
      expect(closeButton).toBeTruthy()
    })

    it('should call ModalController.close when close button is clicked', async () => {
      const closeSpy = vi.spyOn(ModalController, 'close')
      vi.spyOn(SIWXUtil, 'isSIWXCloseDisabled').mockResolvedValue(false)

      const closeButton = HelpersUtil.getByTestId(element, 'w3m-header-close')
      await closeButton?.click()

      expect(closeSpy).toHaveBeenCalled()
    })

    it('should shake modal when trying to close in UnsupportedChain view', async () => {
      const shakeSpy = vi.spyOn(ModalController, 'shake')
      RouterController.push('UnsupportedChain')
      element.requestUpdate()
      await element.updateComplete
      await elementUpdated(element)

      const closeButton = HelpersUtil.getByTestId(element, 'w3m-header-close')
      await closeButton?.click()

      expect(shakeSpy).toHaveBeenCalled()
    })
  })

  describe('Smart Sessions', () => {
    it('should show smart sessions button in Account view when enabled', async () => {
      RouterController.push('Account')
      OptionsController.state.features = { smartSessions: true }
      element.requestUpdate()
      await element.updateComplete
      await elementUpdated(element)

      const smartSessionsButton = HelpersUtil.getByTestId(element, 'w3m-header-smart-sessions')
      expect(smartSessionsButton).toBeTruthy()
    })

    it('should not show smart sessions button when disabled', async () => {
      RouterController.push('Account')
      OptionsController.state.features = { smartSessions: false }
      element.requestUpdate()
      await element.updateComplete
      await elementUpdated(element)

      const smartSessionsButton = HelpersUtil.getByTestId(element, 'w3m-header-smart-sessions')
      expect(smartSessionsButton).toBeFalsy()
    })

    it('should navigate to SmartSessionList when smart sessions button is clicked', async () => {
      RouterController.push('Account')
      OptionsController.state.features = { smartSessions: true }
      element.requestUpdate()
      await element.updateComplete
      await elementUpdated(element)

      const smartSessionsButton = HelpersUtil.getByTestId(element, 'w3m-header-smart-sessions')
      smartSessionsButton?.dispatchEvent(new Event('click'))

      expect(RouterController.state.view).toBe('SmartSessionList')
    })
  })

  describe('Help Button', () => {
    it('should show help button in Connect view', async () => {
      RouterController.push('Connect')
      element.requestUpdate()
      await element.updateComplete
      await elementUpdated(element)

      const helpButton = element.shadowRoot?.querySelector('wui-icon-button[icon="helpCircle"]')
      expect(helpButton).toBeTruthy()
    })

    it('should navigate to WhatIsAWallet when help button is clicked', async () => {
      RouterController.push('Connect')
      element.requestUpdate()
      await element.updateComplete
      await elementUpdated(element)

      const helpButton = element.shadowRoot?.querySelector('wui-icon-button[icon="helpCircle"]')
      helpButton?.dispatchEvent(new Event('click'))

      expect(RouterController.state.view).toBe('WhatIsAWallet')
    })

    it('should track help button click event', async () => {
      const trackSpy = vi.spyOn(EventsController, 'sendEvent')
      RouterController.push('Connect')
      element.requestUpdate()
      await element.updateComplete
      await elementUpdated(element)

      const helpButton = element.shadowRoot?.querySelector('wui-icon-button[icon="helpCircle"]')
      helpButton?.dispatchEvent(new Event('click'))

      expect(trackSpy).toHaveBeenCalledWith({ type: 'track', event: 'CLICK_WALLET_HELP' })
    })

    it('should hide help button when not in Connect view', async () => {
      RouterController.state.view = 'Account'
      OptionsController.state.enableNetworkSwitch = false
      element.requestUpdate()
      await element.updateComplete
      await elementUpdated(element)

      const helpButton = element.shadowRoot?.querySelector('wui-icon-button[icon="helpCircle"]')
      expect(helpButton).toBeTruthy()
      expect(helpButton?.getAttribute('data-hidden')).toBe('true')
    })
  })

  describe('Network Selector Visibility', () => {
    it('should show network selector in Account view when enableNetworkSwitch is true', async () => {
      vi.spyOn(RouterController, 'state', 'get').mockReturnValue({
        ...RouterController.state,
        view: 'Account'
      })
      vi.spyOn(ChainController, 'state', 'get').mockReturnValue({
        ...ChainController.state,
        activeCaipNetwork: mockNetwork
      })
      vi.spyOn(OptionsController, 'state', 'get').mockReturnValue({
        ...OptionsController.state,
        enableNetworkSwitch: true
      })

      element.requestUpdate()
      await elementUpdated(element)

      const networkSelect = HelpersUtil.getByTestId(element, ACCOUNT_SELECT_NETWORK_TEST_ID)
      expect(networkSelect).not.toBeNull()
    })

    it('should hide network selector in Account view when enableNetworkSwitch is false', async () => {
      vi.spyOn(RouterController, 'state', 'get').mockReturnValue({
        ...RouterController.state,
        view: 'Account'
      })
      vi.spyOn(ChainController, 'state', 'get').mockReturnValue({
        ...ChainController.state,
        activeCaipNetwork: mockNetwork
      })
      vi.spyOn(OptionsController, 'state', 'get').mockReturnValue({
        ...OptionsController.state,
        enableNetworkSwitch: false
      })

      element.requestUpdate()
      await elementUpdated(element)

      const networkSelect = HelpersUtil.getByTestId(element, ACCOUNT_SELECT_NETWORK_TEST_ID)
      expect(networkSelect).toBeNull()
    })
  })

  describe('Accessible Names', () => {
    it('should label the help and close buttons', async () => {
      const helpButton = element.shadowRoot?.querySelector('wui-icon-button[icon="helpCircle"]')
      const closeButton = HelpersUtil.getByTestId(element, 'w3m-header-close')

      expect(helpButton?.getAttribute('label')).toBe('Help')
      expect(closeButton?.getAttribute('label')).toBe('Close')
    })

    it('should label the back button', async () => {
      RouterController.push('Networks')
      element.requestUpdate()
      await element.updateComplete
      await elementUpdated(element)

      const backButton = HelpersUtil.getByTestId(element, 'header-back')
      expect(backButton?.getAttribute('label')).toBe('Back')
    })
  })
})
