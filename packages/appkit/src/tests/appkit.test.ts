import type { CaipNetwork } from '@reown/appkit-common'
import {
  AccountController,
  AssetUtil,
  BlockchainApiController,
  ChainController,
  ConnectionController,
  ConnectorController,
  EnsController,
  EventsController,
  ModalController,
  OptionsController,
  PublicStateController,
  RouterController,
  SnackController,
  ThemeController,
  type AccountType,
  type CombinedProvider,
  type Connector
} from '@reown/appkit-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppKit } from '../client'
import { mockOptions } from './mocks/Options'

// Mock all controllers and UniversalAdapterClient
vi.mock('@reown/appkit-core')
vi.mock('../universal-adapter/client')

describe('Base', () => {
  let appKit: AppKit

  beforeEach(() => {
    vi.resetAllMocks()
    appKit = new AppKit(mockOptions)
  })

  describe('Base Initialization', () => {
    it('should initialize controllers with required provided options', () => {
      expect(OptionsController.setSdkVersion).toHaveBeenCalledWith(mockOptions.sdkVersion)
      expect(OptionsController.setProjectId).toHaveBeenCalledWith(mockOptions.projectId)
      expect(OptionsController.setMetadata).toHaveBeenCalled()
    })

    it('should initialize adapters in ChainController', () => {
      expect(ChainController.initialize).toHaveBeenCalledWith(mockOptions.adapters)
    })
  })

  describe('Base Public methods', () => {
    it('should open modal', async () => {
      await appKit.open()
      expect(ModalController.open).toHaveBeenCalled()
    })

    it('should close modal', async () => {
      await appKit.close()
      expect(ModalController.close).toHaveBeenCalled()
    })

    it('should set loading state', () => {
      appKit.setLoading(true)
      expect(ModalController.setLoading).toHaveBeenCalledWith(true)
    })

    it('should get theme mode', () => {
      vi.mocked(ThemeController).state = { themeMode: 'dark' } as any
      expect(appKit.getThemeMode()).toBe('dark')
    })

    it('should set theme mode', () => {
      appKit.setThemeMode('light')
      expect(ThemeController.setThemeMode).toHaveBeenCalledWith('light')
    })

    it('should get theme variables', () => {
      vi.mocked(ThemeController).state = {
        themeVariables: { '--w3m-accent': '#000' }
      } as any
      expect(appKit.getThemeVariables()).toEqual({ '--w3m-accent': '#000' })
    })

    it('should set theme variables', () => {
      const themeVariables = { '--w3m-accent': '#fff' }
      appKit.setThemeVariables(themeVariables)
      expect(ThemeController.setThemeVariables).toHaveBeenCalledWith(themeVariables)
    })

    it('should subscribe to theme changes', () => {
      const callback = vi.fn()
      appKit.subscribeTheme(callback)
      expect(ThemeController.subscribe).toHaveBeenCalledWith(callback)
    })

    it('should get wallet info', () => {
      vi.mocked(AccountController).state = { connectedWalletInfo: { name: 'Test Wallet' } } as any
      expect(appKit.getWalletInfo()).toEqual({ name: 'Test Wallet' })
    })

    it('should subscribe to wallet info changes', () => {
      const callback = vi.fn()
      appKit.subscribeWalletInfo(callback)
      expect(AccountController.subscribeKey).toHaveBeenCalledWith('connectedWalletInfo', callback)
    })

    it('should subscribe to address updates', () => {
      const callback = vi.fn()
      appKit.subscribeShouldUpdateToAddress(callback)
      expect(AccountController.subscribeKey).toHaveBeenCalledWith('shouldUpdateToAddress', callback)
    })

    it('should subscribe to CAIP network changes', () => {
      const callback = vi.fn()
      appKit.subscribeCaipNetworkChange(callback)
      expect(ChainController.subscribeKey).toHaveBeenCalledWith('activeCaipNetwork', callback)
    })

    it('should get state', () => {
      vi.mocked(PublicStateController).state = { isConnected: true } as any
      expect(appKit.getState()).toEqual({ isConnected: true })
    })

    it('should subscribe to state changes', () => {
      const callback = vi.fn()
      appKit.subscribeState(callback)
      expect(PublicStateController.subscribe).toHaveBeenCalledWith(callback)
    })

    it('should show error message', () => {
      appKit.showErrorMessage('Test error')
      expect(SnackController.showError).toHaveBeenCalledWith('Test error')
    })

    it('should show success message', () => {
      appKit.showSuccessMessage('Test success')
      expect(SnackController.showSuccess).toHaveBeenCalledWith('Test success')
    })

    it('should get event', () => {
      vi.mocked(EventsController).state = { name: 'test_event' } as any
      expect(appKit.getEvent()).toEqual({ name: 'test_event' })
    })

    it('should subscribe to events', () => {
      const callback = vi.fn()
      appKit.subscribeEvents(callback)
      expect(EventsController.subscribe).toHaveBeenCalledWith(callback)
    })

    it('should replace route', () => {
      appKit.replace('Connect')
      expect(RouterController.replace).toHaveBeenCalledWith('Connect')
    })

    it('should redirect to route', () => {
      appKit.redirect('Networks')
      expect(RouterController.push).toHaveBeenCalledWith('Networks')
    })

    it('should pop transaction stack', () => {
      appKit.popTransactionStack(true)
      expect(RouterController.popTransactionStack).toHaveBeenCalledWith(true)
    })

    it('should check if modal is open', () => {
      vi.mocked(ModalController).state = { open: true } as any
      expect(appKit.isOpen()).toBe(true)
    })

    it('should check if transaction stack is empty', () => {
      vi.mocked(RouterController).state = { transactionStack: [] } as any
      expect(appKit.isTransactionStackEmpty()).toBe(true)
    })

    it('should check if transaction should replace view', () => {
      vi.mocked(RouterController).state = { transactionStack: [{ replace: true }] } as any
      expect(appKit.isTransactionShouldReplaceView()).toBe(true)
    })

    it('should set status', () => {
      appKit.setStatus('connected', 'eip155')
      expect(AccountController.setStatus).toHaveBeenCalledWith('connected', 'eip155')
    })

    it('should set all accounts', () => {
      const addresses = ['0x123', '0x456'] as unknown as AccountType[]
      appKit.setAllAccounts(addresses, 'eip155')
      expect(AccountController.setAllAccounts).toHaveBeenCalledWith(addresses, 'eip155')
      expect(OptionsController.setHasMultipleAddresses).toHaveBeenCalledWith(true)
    })

    it('should add address label', () => {
      appKit.addAddressLabel('0x123', 'eip155 Address', 'eip155')
      expect(AccountController.addAddressLabel).toHaveBeenCalledWith(
        '0x123',
        'eip155 Address',
        'eip155'
      )
    })

    it('should remove address label', () => {
      appKit.removeAddressLabel('0x123', 'eip155')
      expect(AccountController.removeAddressLabel).toHaveBeenCalledWith('0x123', 'eip155')
    })

    it('should get CAIP address', () => {
      vi.mocked(ChainController).state = {
        activeChain: 'eip155',
        activeCaipAddress: 'eip155:1:0x123'
      } as any
      expect(appKit.getCaipAddress()).toBe('eip155:1:0x123')
    })

    it('should get address', () => {
      vi.mocked(AccountController).state = { address: '0x123' } as any
      expect(appKit.getAddress()).toBe('0x123')
    })

    it('should get provider', () => {
      const mockProvider = { request: vi.fn() }
      vi.mocked(AccountController).state = { provider: mockProvider } as any
      expect(appKit.getProvider()).toBe(mockProvider)
    })

    it('should get preferred account type', () => {
      vi.mocked(AccountController).state = { preferredAccountType: 'eoa' } as any
      expect(appKit.getPreferredAccountType()).toBe('eoa')
    })

    it('should set CAIP address', () => {
      appKit.setCaipAddress('eip155:1:0x123', 'eip155')
      expect(appKit.getIsConnectedState()).toBe(true)
      expect(AccountController.setCaipAddress).toHaveBeenCalledWith('eip155:1:0x123', 'eip155')
    })

    it('should set provider', () => {
      const mockProvider = {
        request: vi.fn()
      }
      appKit.setProvider(mockProvider as unknown as CombinedProvider, 'eip155')
      expect(AccountController.setProvider).toHaveBeenCalledWith(mockProvider, 'eip155')
    })

    it('should set balance', () => {
      appKit.setBalance('1.5', 'ETH', 'eip155')
      expect(AccountController.setBalance).toHaveBeenCalledWith('1.5', 'ETH', 'eip155')
    })

    it('should set profile name', () => {
      appKit.setProfileName('John Doe', 'eip155')
      expect(AccountController.setProfileName).toHaveBeenCalledWith('John Doe', 'eip155')
    })

    it('should set profile image', () => {
      appKit.setProfileImage('https://example.com/image.png', 'eip155')
      expect(AccountController.setProfileImage).toHaveBeenCalledWith(
        'https://example.com/image.png',
        'eip155'
      )
    })

    it('should reset account', () => {
      appKit.resetAccount('eip155')
      expect(AccountController.resetAccount).toHaveBeenCalledWith('eip155')
    })

    it('should set CAIP network', () => {
      const caipNetwork = { id: 'eip155:1', name: 'Ethereum' } as unknown as CaipNetwork
      appKit.setCaipNetwork(caipNetwork)
      expect(ChainController.setActiveCaipNetwork).toHaveBeenCalledWith(caipNetwork)
    })

    it('should get CAIP network', () => {
      vi.mocked(ChainController).state = {
        activeCaipNetwork: { id: 'eip155:1', name: 'Ethereum' }
      } as any
      expect(appKit.getCaipNetwork()).toEqual({ id: 'eip155:1', name: 'Ethereum' })
    })

    it('should set requested CAIP networks', () => {
      const requestedNetworks = [{ id: 'eip155:1', name: 'Ethereum' }] as unknown as CaipNetwork[]
      appKit.setRequestedCaipNetworks(requestedNetworks, 'eip155')
      expect(ChainController.setRequestedCaipNetworks).toHaveBeenCalledWith(
        requestedNetworks,
        'eip155'
      )
    })

    it('should set connectors', () => {
      const existingConnectors = [
        { id: 'phantom', name: 'Phantom', chain: 'eip155', type: 'INJECTED' }
      ] as Connector[]

      vi.mocked(ConnectorController.getConnectors).mockReturnValue(existingConnectors)
      const connectors = [
        { id: 'metamask', name: 'MetaMask', chain: 'eip155', type: 'INJECTED' }
      ] as Connector[]
      appKit.setConnectors(connectors)
      expect(ConnectorController.setConnectors).toHaveBeenCalledWith([
        ...existingConnectors,
        ...connectors
      ])
    })

    it('should add connector', () => {
      const connector = {
        id: 'metamask',
        name: 'MetaMask',
        chain: 'eip155',
        type: 'INJECTED'
      } as Connector
      appKit.addConnector(connector)
      expect(ConnectorController.addConnector).toHaveBeenCalledWith(connector)
    })

    it('should get connectors', () => {
      const mockConnectors = [
        { id: 'metamask', name: 'MetaMask', chain: 'eip155:1', type: 'INJECTED' as const }
      ] as any
      vi.mocked(ConnectorController.getConnectors).mockReturnValue(mockConnectors)
      expect(appKit.getConnectors()).toEqual(mockConnectors)
    })

    it('should get approved CAIP network IDs', () => {
      vi.mocked(ChainController.getAllApprovedCaipNetworkIds).mockReturnValue(['eip155:1'])
      expect(appKit.getApprovedCaipNetworkIds()).toEqual(['eip155:1'])
    })

    it('should set approved CAIP networks data', () => {
      appKit.setApprovedCaipNetworksData('eip155')
      expect(ChainController.setApprovedCaipNetworksData).toHaveBeenCalledWith('eip155')
    })

    it('should reset network', () => {
      appKit.resetNetwork('eip155')
      expect(ChainController.resetNetwork).toHaveBeenCalled()
    })

    it('should reset WC connection', () => {
      appKit.resetWcConnection()
      expect(ConnectionController.resetWcConnection).toHaveBeenCalled()
    })

    it('should fetch identity', async () => {
      const mockRequest = { caipChainId: 'eip155:1', address: '0x123' }
      vi.mocked(BlockchainApiController.fetchIdentity).mockResolvedValue({
        name: 'John Doe',
        avatar: null
      })
      const result = await appKit.fetchIdentity(mockRequest)
      expect(BlockchainApiController.fetchIdentity).toHaveBeenCalledWith(mockRequest)
      expect(result).toEqual({ name: 'John Doe', avatar: null })
    })

    it('should set address explorer URL', () => {
      appKit.setAddressExplorerUrl('https://etherscan.io/address/0x123', 'eip155')
      expect(AccountController.setAddressExplorerUrl).toHaveBeenCalledWith(
        'https://etherscan.io/address/0x123',
        'eip155'
      )
    })

    it('should set smart account deployed', () => {
      appKit.setSmartAccountDeployed(true, 'eip155')
      expect(AccountController.setSmartAccountDeployed).toHaveBeenCalledWith(true, 'eip155')
    })

    it('should set connected wallet info', () => {
      const walletInfo = { name: 'MetaMask', icon: 'icon-url' }
      appKit.setConnectedWalletInfo(walletInfo, 'eip155')
      expect(AccountController.setConnectedWalletInfo).toHaveBeenCalledWith(walletInfo, 'eip155')
    })

    it('should set smart account enabled networks', () => {
      const networks = [1, 137]
      appKit.setSmartAccountEnabledNetworks(networks, 'eip155')
      expect(ChainController.setSmartAccountEnabledNetworks).toHaveBeenCalledWith(
        networks,
        'eip155'
      )
    })

    it('should set preferred account type', () => {
      appKit.setPreferredAccountType('eoa', 'eip155')
      expect(AccountController.setPreferredAccountType).toHaveBeenCalledWith('eoa', 'eip155')
    })

    it('should get Reown name', async () => {
      vi.mocked(EnsController.getNamesForAddress).mockResolvedValue([
        {
          name: 'john.reown.id',
          addresses: { eip155: { address: '0x123', created: '0' } },
          attributes: [],
          registered: 0,
          updated: 0
        }
      ])
      const result = await appKit.getReownName('john.reown.id')
      expect(EnsController.getNamesForAddress).toHaveBeenCalledWith('john.reown.id')
      expect(result).toEqual([
        {
          name: 'john.reown.id',
          addresses: { eip155: { address: '0x123', created: '0' } },
          attributes: [],
          registered: 0,
          updated: 0
        }
      ])
    })

    it('should resolve Reown name', async () => {
      vi.mocked(EnsController.resolveName).mockResolvedValue({
        addresses: { eip155: { address: '0x123', created: '0' } },
        name: 'john.reown.id',
        registered: 0,
        updated: 0,
        attributes: []
      })
      const result = await appKit.resolveReownName('john.reown.id')
      expect(EnsController.resolveName).toHaveBeenCalledWith('john.reown.id')
      expect(result).toBe('0x123')
    })

    it('should set EIP6963 enabled', () => {
      appKit.setEIP6963Enabled(true)
      expect(OptionsController.setEIP6963Enabled).toHaveBeenCalledWith(true)
    })

    it('should set client ID', () => {
      appKit.setClientId('client-123')
      expect(BlockchainApiController.setClientId).toHaveBeenCalledWith('client-123')
    })

    it('should get connector image', () => {
      vi.mocked(AssetUtil.getConnectorImage).mockReturnValue('connector-image-url')
      const result = appKit.getConnectorImage({ id: 'metamask', type: 'INJECTED', chain: 'eip155' })
      expect(AssetUtil.getConnectorImage).toHaveBeenCalledWith({
        id: 'metamask',
        type: 'INJECTED',
        chain: 'eip155'
      })
      expect(result).toBe('connector-image-url')
    })
  })
})
