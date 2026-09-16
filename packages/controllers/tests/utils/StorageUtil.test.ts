import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { SafeLocalStorage, getSafeConnectorIdKey } from '@reown/appkit-common'
import { SafeLocalStorageKeys } from '@reown/appkit-common'
import type { Connection } from '@reown/appkit-common'
import { W3mFrameConstants, W3mFrameHelpers, W3mFrameStorage } from '@reown/appkit-wallet'

import { OptionsController } from '../../src/controllers/OptionsController'
import { StorageUtil } from '../../src/utils/StorageUtil'
import type { SocialProvider, WcWallet } from '../../src/utils/TypeUtil'

const previousLocalStorage = globalThis.localStorage
const previousWindow = globalThis.window
let store: { [key: string]: string } = {}

afterAll(() => {
  Object.assign(globalThis, { localStorage: previousLocalStorage, window: previousWindow })
})

describe('StorageUtil', () => {
  beforeAll(() => {
    Object.assign(globalThis, {
      window: {},
      localStorage: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString()
        },
        removeItem: (key: string) => {
          delete store[key]
        },
        clear: () => {
          store = {}
        }
      }
    })
  })

  beforeEach(() => {
    // Clear localStorage before each test
    SafeLocalStorage.clear()
  })

  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks()
  })

  describe('setWalletConnectDeepLink', () => {
    it('should set WalletConnect deep link in localStorage', () => {
      const deepLink = { href: 'https://example.com', name: 'Example Wallet' }
      StorageUtil.setWalletConnectDeepLink(deepLink)
      expect(SafeLocalStorageKeys.DEEPLINK_CHOICE).toBe('WALLETCONNECT_DEEPLINK_CHOICE')
      const savedDL = SafeLocalStorage.getItem(SafeLocalStorageKeys.DEEPLINK_CHOICE)
      expect(savedDL).toBe(JSON.stringify({ href: deepLink.href, name: deepLink.name }))
    })

    it('should handle errors when setting deep link', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      StorageUtil.setWalletConnectDeepLink({ href: 'https://example.com', name: 'Example Wallet' })
      expect(consoleSpy).toHaveBeenCalledWith('Unable to set WalletConnect deep link')
    })
  })

  describe('getWalletConnectDeepLink', () => {
    it('should get WalletConnect deep link from localStorage', () => {
      const deepLink = { href: 'https://example.com', name: 'Example Wallet' }
      SafeLocalStorage.setItem(
        SafeLocalStorageKeys.DEEPLINK_CHOICE,
        JSON.stringify({ href: deepLink.href, name: deepLink.name })
      )
      expect(StorageUtil.getWalletConnectDeepLink()).toEqual({
        href: deepLink.href,
        name: deepLink.name
      })
    })

    it('should return undefined if deep link is not set', () => {
      expect(StorageUtil.getWalletConnectDeepLink()).toBeUndefined()
    })

    it('should handle errors when getting deep link', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(StorageUtil.getWalletConnectDeepLink()).toBeUndefined()
      expect(consoleSpy).toHaveBeenCalledWith('Unable to get WalletConnect deep link')
    })
  })

  describe('deleteWalletConnectDeepLink', () => {
    it('should delete WalletConnect deep link from localStorage', () => {
      SafeLocalStorage.setItem(
        SafeLocalStorageKeys.DEEPLINK_CHOICE,
        JSON.stringify({ href: 'https://example.com', name: 'Example' })
      )
      StorageUtil.deleteWalletConnectDeepLink()
      expect(SafeLocalStorage.getItem(SafeLocalStorageKeys.DEEPLINK_CHOICE)).toBeUndefined()
    })

    it('should handle errors when deleting deep link', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      StorageUtil.deleteWalletConnectDeepLink()
      expect(consoleSpy).toHaveBeenCalledWith('Unable to delete WalletConnect deep link')
    })
  })

  describe('setAppKitRecent', () => {
    it('should add a new wallet to recent wallets', () => {
      const wallet: WcWallet = { id: 'wallet1', name: 'Wallet 1' }
      StorageUtil.setAppKitRecent(wallet)
      expect(StorageUtil.getRecentWallets()).toEqual([wallet])
    })

    it('should not add duplicate wallets', () => {
      const wallet: WcWallet = { id: 'wallet1', name: 'Wallet 1' }
      StorageUtil.setAppKitRecent(wallet)
      StorageUtil.setAppKitRecent(wallet)
      expect(StorageUtil.getRecentWallets()).toEqual([wallet])
    })

    it('should limit recent wallets to 2', () => {
      const wallet1: WcWallet = { id: 'wallet1', name: 'Wallet 1' }
      const wallet2: WcWallet = { id: 'wallet2', name: 'Wallet 2' }
      const wallet3: WcWallet = { id: 'wallet3', name: 'Wallet 3' }
      StorageUtil.setAppKitRecent(wallet1)
      StorageUtil.setAppKitRecent(wallet2)
      StorageUtil.setAppKitRecent(wallet3)
      expect(StorageUtil.getRecentWallets()).toEqual([wallet3, wallet2])
    })
  })

  describe('getRecentWallets', () => {
    it('should return an empty array if no recent wallets', () => {
      expect(StorageUtil.getRecentWallets()).toEqual([])
    })

    it('should return recent wallets', () => {
      const wallet: WcWallet = { id: 'wallet1', name: 'Wallet 1' }
      SafeLocalStorage.setItem(SafeLocalStorageKeys.RECENT_WALLETS, JSON.stringify([wallet]))
      expect(StorageUtil.getRecentWallets()).toEqual([wallet])
    })
  })

  describe('setConnectedConnectorId', () => {
    it('should set connected connector', () => {
      const connectorId = 'io.metamask'

      StorageUtil.setConnectedConnectorId('eip155', connectorId)
      const key = getSafeConnectorIdKey('eip155')
      expect(SafeLocalStorage.getItem(key)).toBe(connectorId)
    })
  })

  describe('getConnectedConnector', () => {
    it('should get connected connector', () => {
      const connectorId = 'io.metamask'
      const key = getSafeConnectorIdKey('eip155')
      SafeLocalStorage.setItem(key, connectorId)
      expect(StorageUtil.getConnectedConnectorId('eip155')).toBe(connectorId)
    })
  })

  describe('setConnectedSocialProvider', () => {
    it('should set connected social provider', () => {
      const provider: SocialProvider = 'google'
      StorageUtil.setConnectedSocialProvider(provider)
      expect(SafeLocalStorage.getItem(SafeLocalStorageKeys.CONNECTED_SOCIAL)).toBe(provider)
    })
  })

  describe('getConnectedSocialProvider', () => {
    it('should get connected social provider', () => {
      const provider: SocialProvider = 'google'
      SafeLocalStorage.setItem(SafeLocalStorageKeys.CONNECTED_SOCIAL, provider)
      expect(StorageUtil.getConnectedSocialProvider()).toBe(provider)
    })
  })

  describe('getConnectedSocialUsername', () => {
    it('should set username on W3mFrameStorage and get connected social username', () => {
      const username = 'testuser'
      vi.spyOn(W3mFrameHelpers, 'isClient', 'get').mockReturnValue(true)
      W3mFrameStorage.set(W3mFrameConstants.SOCIAL_USERNAME, username)
      expect(StorageUtil.getConnectedSocialUsername()).toBe(username)
    })
  })

  describe('setConnections', () => {
    const mockConnection1 = {
      connectorId: 'connector1',
      accounts: [
        { address: '0x123...', type: 'eoa' },
        { address: '0x456...', type: 'eoa' }
      ],
      caipNetwork: {
        id: 1,
        name: 'Ethereum',
        caipNetworkId: 'eip155:1',
        chainNamespace: 'eip155'
      }
    } as unknown as Connection

    const mockConnection2 = {
      connectorId: 'connector2',
      accounts: [{ address: '0x789...', type: 'eoa' }],
      caipNetwork: {
        id: 1,
        name: 'Ethereum',
        caipNetworkId: 'eip155:1',
        chainNamespace: 'eip155'
      }
    } as unknown as Connection

    beforeEach(() => {
      SafeLocalStorage.clear()
    })

    it('should set connections for a new namespace', () => {
      StorageUtil.setConnections([mockConnection1, mockConnection2], 'eip155')
      const connections = StorageUtil.getConnections()
      expect(connections.eip155).toEqual([mockConnection1, mockConnection2])
    })

    it('should merge new connections with existing ones', () => {
      StorageUtil.setConnections([mockConnection1], 'eip155')
      StorageUtil.setConnections([mockConnection2], 'eip155')

      const connections = StorageUtil.getConnections()
      expect(connections.eip155).toHaveLength(2)
      expect(connections.eip155).toEqual(expect.arrayContaining([mockConnection1, mockConnection2]))
    })

    it('should merge accounts for existing connectors (non-auth)', () => {
      const existingConnection = {
        connectorId: 'connector1',
        accounts: [{ address: '0x123...', type: 'eoa' }]
      } as unknown as Connection

      const newConnection = {
        connectorId: 'connector1',
        accounts: [
          { address: '0x123...', type: 'eoa' },
          { address: '0x999...', type: 'eoa' }
        ]
      } as unknown as Connection

      StorageUtil.setConnections([existingConnection], 'eip155')
      StorageUtil.setConnections([newConnection], 'eip155')

      const connections = StorageUtil.getConnections()
      const connector1 = connections.eip155.find(c => c.connectorId === 'connector1')
      expect(connector1?.accounts).toHaveLength(2)
      expect(connector1?.accounts).toEqual(
        expect.arrayContaining([
          { address: '0x123...', type: 'eoa' },
          { address: '0x999...', type: 'eoa' }
        ])
      )
    })

    it('should replace auth connections instead of merging', () => {
      const existingAuthConnection = {
        connectorId: 'AUTH',
        accounts: [{ address: '0xold...', type: 'eoa' }]
      } as unknown as Connection

      const newAuthConnection = {
        connectorId: 'AUTH',
        accounts: [{ address: '0xnew...', type: 'eoa' }]
      } as unknown as Connection

      StorageUtil.setConnections([existingAuthConnection], 'eip155')
      StorageUtil.setConnections([newAuthConnection], 'eip155')

      const connections = StorageUtil.getConnections()
      const authConnector = connections.eip155.find(c => c.connectorId === 'AUTH')
      expect(authConnector?.accounts).toEqual([{ address: '0xnew...', type: 'eoa' }])
    })

    it('should handle case-insensitive address deduplication', () => {
      const existingConnection = {
        connectorId: 'connector1',
        accounts: [{ address: '0x123ABC...', type: 'eoa' }]
      } as unknown as Connection

      const newConnection = {
        connectorId: 'connector1',
        accounts: [{ address: '0x123abc...', type: 'eoa' }] // same address, different case
      } as unknown as Connection

      StorageUtil.setConnections([existingConnection], 'eip155')
      StorageUtil.setConnections([newConnection], 'eip155')

      const connections = StorageUtil.getConnections()
      const connector1 = connections.eip155.find(c => c.connectorId === 'connector1')
      expect(connector1?.accounts).toHaveLength(1)
    })

    it('should handle storage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(SafeLocalStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      StorageUtil.setConnections([mockConnection1], 'eip155')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to sync connections to storage',
        expect.any(Error)
      )
    })

    it('should preserve connections from other namespaces', () => {
      StorageUtil.setConnections([mockConnection1], 'eip155')
      StorageUtil.setConnections([mockConnection2], 'solana')

      const connections = StorageUtil.getConnections()
      expect(connections.eip155).toEqual([mockConnection1])
      expect(connections.solana).toEqual([mockConnection2])
    })
  })

  describe('getConnections', () => {
    it('should return empty object when no connections stored', () => {
      const connections = StorageUtil.getConnections()
      expect(connections).toEqual({})
    })

    it('should return stored connections', () => {
      const mockConnections = {
        eip155: [{ connectorId: 'connector1', accounts: [] }],
        solana: [{ connectorId: 'connector2', accounts: [] }]
      }

      SafeLocalStorage.setItem(SafeLocalStorageKeys.CONNECTIONS, JSON.stringify(mockConnections))

      const connections = StorageUtil.getConnections()
      expect(connections).toEqual(mockConnections)
    })

    it('should handle storage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(SafeLocalStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      const connections = StorageUtil.getConnections()
      expect(connections).toEqual({})
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to get connections from storage',
        expect.any(Error)
      )
    })

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      SafeLocalStorage.setItem(SafeLocalStorageKeys.CONNECTIONS, 'invalid-json')

      const connections = StorageUtil.getConnections()
      expect(connections).toEqual({})
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to get connections from storage',
        expect.any(Error)
      )
    })
  })

  describe('deleteAddressFromConnection', () => {
    const mockConnection = {
      connectorId: 'connector1',
      accounts: [
        { address: '0x123...', type: 'eoa' },
        { address: '0x456...', type: 'eoa' },
        { address: '0x789...', type: 'eoa' }
      ]
    } as unknown as Connection

    beforeEach(() => {
      SafeLocalStorage.clear()
      StorageUtil.setConnections([mockConnection], 'eip155')
    })

    it('should remove specific address from connection', () => {
      StorageUtil.deleteAddressFromConnection({
        connectorId: 'connector1',
        address: '0x456...',
        namespace: 'eip155'
      })

      const connections = StorageUtil.getConnections()
      const connector = connections.eip155.find(c => c.connectorId === 'connector1')
      expect(connector?.accounts).toHaveLength(2)
      expect(connector?.accounts).not.toContain(expect.objectContaining({ address: '0x456...' }))
    })

    it('should handle case-insensitive address matching', () => {
      StorageUtil.deleteAddressFromConnection({
        connectorId: 'connector1',
        address: '0X123...', // uppercase
        namespace: 'eip155'
      })

      const connections = StorageUtil.getConnections()
      const connector = connections.eip155.find(c => c.connectorId === 'connector1')
      expect(connector?.accounts).toHaveLength(2)
      expect(connector?.accounts).not.toContain(expect.objectContaining({ address: '0x123...' }))
    })

    it('should remove entire connector when no accounts left', () => {
      const singleAccountConnection = {
        connectorId: 'connector2',
        accounts: [{ address: '0xsingle...', type: 'eoa' }]
      } as unknown as Connection

      StorageUtil.setConnections([singleAccountConnection], 'eip155')

      StorageUtil.deleteAddressFromConnection({
        connectorId: 'connector2',
        address: '0xsingle...',
        namespace: 'eip155'
      })

      const connections = StorageUtil.getConnections()
      const connector = connections.eip155.find(c => c.connectorId === 'connector2')
      expect(connector).toBeUndefined()
    })

    it('should do nothing when connector not found', () => {
      const initialConnections = StorageUtil.getConnections()

      StorageUtil.deleteAddressFromConnection({
        connectorId: 'nonexistent',
        address: '0x123...',
        namespace: 'eip155'
      })

      const finalConnections = StorageUtil.getConnections()
      expect(finalConnections).toEqual(initialConnections)
    })

    it('should do nothing when address not found', () => {
      const initialConnections = StorageUtil.getConnections()

      StorageUtil.deleteAddressFromConnection({
        connectorId: 'connector1',
        address: '0xnonexistent...',
        namespace: 'eip155'
      })

      const finalConnections = StorageUtil.getConnections()
      expect(finalConnections).toEqual(initialConnections)
    })

    it('should do nothing when namespace not found', () => {
      const initialConnections = StorageUtil.getConnections()

      StorageUtil.deleteAddressFromConnection({
        connectorId: 'connector1',
        address: '0x123...',
        namespace: 'nonexistent' as any
      })

      const finalConnections = StorageUtil.getConnections()
      expect(finalConnections).toEqual({
        ...initialConnections,
        nonexistent: []
      })
    })

    it('should handle storage errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(SafeLocalStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      StorageUtil.deleteAddressFromConnection({
        connectorId: 'connector1',
        address: '0x123...',
        namespace: 'eip155'
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to remove address "0x123..." from connector "connector1" in namespace "eip155"'
      )
    })

    it('should preserve other namespaces when deleting', () => {
      StorageUtil.setConnections([mockConnection], 'solana')

      StorageUtil.deleteAddressFromConnection({
        connectorId: 'connector1',
        address: '0x123...',
        namespace: 'eip155'
      })

      const connections = StorageUtil.getConnections()
      expect(connections.solana).toEqual([mockConnection])
    })
  })

  describe('getDisconnectedConnectorIds', () => {
    it('should return empty object when no disconnected connectors', () => {
      const result = StorageUtil.getDisconnectedConnectorIds()
      expect(result).toEqual({})
    })

    it('should return stored disconnected connector IDs', () => {
      const mockDisconnectedIds = {
        eip155: ['connector1', 'connector2'],
        solana: ['connector3']
      }

      SafeLocalStorage.setItem(
        SafeLocalStorageKeys.DISCONNECTED_CONNECTOR_IDS,
        JSON.stringify(mockDisconnectedIds)
      )

      const result = StorageUtil.getDisconnectedConnectorIds()
      expect(result).toEqual(mockDisconnectedIds)
    })

    it('should handle storage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      vi.spyOn(SafeLocalStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = StorageUtil.getDisconnectedConnectorIds()
      expect(result).toEqual({})
      expect(consoleSpy).toHaveBeenCalledWith('Unable to get disconnected connector ids')
    })

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      SafeLocalStorage.setItem(SafeLocalStorageKeys.DISCONNECTED_CONNECTOR_IDS, 'invalid-json')

      const result = StorageUtil.getDisconnectedConnectorIds()
      expect(result).toEqual({})
      expect(consoleSpy).toHaveBeenCalledWith('Unable to get disconnected connector ids')
    })
  })

  describe('addDisconnectedConnectorId', () => {
    beforeEach(() => {
      SafeLocalStorage.clear()
    })

    it('should add disconnected connector ID to empty storage', () => {
      StorageUtil.addDisconnectedConnectorId('connector1', 'eip155')

      const result = StorageUtil.getDisconnectedConnectorIds()
      expect(result.eip155).toEqual(['connector1'])
    })

    it('should add disconnected connector ID to existing namespace', () => {
      StorageUtil.addDisconnectedConnectorId('connector1', 'eip155')
      StorageUtil.addDisconnectedConnectorId('connector2', 'eip155')

      const result = StorageUtil.getDisconnectedConnectorIds()
      expect(result.eip155).toEqual(['connector1', 'connector2'])
    })

    it('should add disconnected connector ID to new namespace', () => {
      StorageUtil.addDisconnectedConnectorId('connector1', 'eip155')
      StorageUtil.addDisconnectedConnectorId('connector2', 'solana')

      const result = StorageUtil.getDisconnectedConnectorIds()
      expect(result.eip155).toEqual(['connector1'])
      expect(result.solana).toEqual(['connector2'])
    })

    it('should deduplicate connector IDs', () => {
      StorageUtil.addDisconnectedConnectorId('connector1', 'eip155')
      StorageUtil.addDisconnectedConnectorId('connector1', 'eip155')
      StorageUtil.addDisconnectedConnectorId('connector1', 'eip155')

      const result = StorageUtil.getDisconnectedConnectorIds()
      expect(result.eip155).toEqual(['connector1'])
    })

    it('should handle storage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(SafeLocalStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      StorageUtil.addDisconnectedConnectorId('connector1', 'eip155')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to set disconnected connector id "connector1" for namespace "eip155"'
      )
    })
  })

  describe('removeDisconnectedConnectorId', () => {
    beforeEach(() => {
      SafeLocalStorage.clear()
      StorageUtil.addDisconnectedConnectorId('connector1', 'eip155')
      StorageUtil.addDisconnectedConnectorId('connector2', 'eip155')
      StorageUtil.addDisconnectedConnectorId('connector3', 'solana')
    })

    it('should remove specific disconnected connector ID', () => {
      StorageUtil.removeDisconnectedConnectorId('connector1', 'eip155')

      const result = StorageUtil.getDisconnectedConnectorIds()
      expect(result.eip155).toEqual(['connector2'])
      expect(result.solana).toEqual(['connector3'])
    })

    it('should handle case-insensitive removal', () => {
      StorageUtil.removeDisconnectedConnectorId('CONNECTOR1', 'eip155')

      const result = StorageUtil.getDisconnectedConnectorIds()
      expect(result.eip155).toEqual(['connector2'])
    })

    it('should do nothing when connector ID not found', () => {
      const initialResult = StorageUtil.getDisconnectedConnectorIds()

      StorageUtil.removeDisconnectedConnectorId('nonexistent', 'eip155')

      const finalResult = StorageUtil.getDisconnectedConnectorIds()
      expect(finalResult).toEqual(initialResult)
    })

    it('should do nothing when namespace not found', () => {
      const initialResult = StorageUtil.getDisconnectedConnectorIds()

      StorageUtil.removeDisconnectedConnectorId('connector1', 'nonexistent' as any)

      const finalResult = StorageUtil.getDisconnectedConnectorIds()
      expect(finalResult).toEqual({
        ...initialResult,
        nonexistent: []
      })
    })

    it('should handle empty namespace', () => {
      SafeLocalStorage.clear()

      StorageUtil.removeDisconnectedConnectorId('connector1', 'eip155')

      const result = StorageUtil.getDisconnectedConnectorIds()
      expect(result.eip155).toEqual([])
    })

    it('should handle storage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(SafeLocalStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      StorageUtil.removeDisconnectedConnectorId('connector1', 'eip155')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to remove disconnected connector id "connector1" for namespace "eip155"'
      )
    })
  })

  describe('isConnectorDisconnected', () => {
    beforeEach(() => {
      SafeLocalStorage.clear()
      StorageUtil.addDisconnectedConnectorId('disconnected1', 'eip155')
      StorageUtil.addDisconnectedConnectorId('disconnected2', 'eip155')
      StorageUtil.addDisconnectedConnectorId('disconnected3', 'solana')
    })

    it('should return true for disconnected connector', () => {
      const result = StorageUtil.isConnectorDisconnected('disconnected1', 'eip155')
      expect(result).toBe(true)
    })

    it('should return false for connected connector', () => {
      const result = StorageUtil.isConnectorDisconnected('connected1', 'eip155')
      expect(result).toBe(false)
    })

    it('should handle case-insensitive comparison', () => {
      const result = StorageUtil.isConnectorDisconnected('DISCONNECTED1', 'eip155')
      expect(result).toBe(true)
    })

    it('should return false for connector in different namespace', () => {
      const result = StorageUtil.isConnectorDisconnected('disconnected3', 'eip155')
      expect(result).toBe(false)
    })

    it('should return false when namespace not found', () => {
      const result = StorageUtil.isConnectorDisconnected('disconnected1', 'nonexistent' as any)
      expect(result).toBe(false)
    })

    it('should handle storage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      vi.spyOn(StorageUtil, 'getDisconnectedConnectorIds').mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = StorageUtil.isConnectorDisconnected('disconnected1', 'eip155')
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to get disconnected connector id "disconnected1" for namespace "eip155"'
      )
    })

    it('should return false when no disconnected connectors exist', () => {
      SafeLocalStorage.clear()

      const result = StorageUtil.isConnectorDisconnected('any-connector', 'eip155')
      expect(result).toBe(false)
    })
  })

  describe('debug flag', () => {
    afterEach(() => {
      OptionsController.state.debug = undefined
    })

    it('should suppress console.info when debug is false', () => {
      OptionsController.state.debug = false
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      StorageUtil.setWalletConnectDeepLink({ href: 'https://example.com', name: 'Example Wallet' })
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('should suppress console.error when debug is false', () => {
      OptionsController.state.debug = false
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      StorageUtil.setConnections([], 'eip155')
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('should still log when debug is true', () => {
      OptionsController.state.debug = true
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      StorageUtil.setWalletConnectDeepLink({ href: 'https://example.com', name: 'Example Wallet' })
      expect(consoleSpy).toHaveBeenCalledWith('Unable to set WalletConnect deep link')
    })
  })
})
