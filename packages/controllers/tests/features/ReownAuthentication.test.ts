import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type CaipNetwork,
  NetworkUtil,
  SafeLocalStorage,
  SafeLocalStorageKeys
} from '@reown/appkit-common'
import {
  type AccountState,
  ApiController,
  BlockchainApiController,
  ChainController
} from '@reown/appkit-controllers'
import { ReownAuthentication } from '@reown/appkit-controllers/features'
import {
  extendedMainnet,
  mockChainControllerState,
  mockSession
} from '@reown/appkit-controllers/testing'

vi.useFakeTimers({
  now: new Date('2024-12-05T16:02:32.905Z')
})

vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
})

const mocks = {
  mockFetchResponse: (response: unknown, ok: boolean = true) => {
    return {
      ok,
      json: async () => response,
      text: async () => (typeof response === 'string' ? response : JSON.stringify(response)),
      headers: {
        get: () => 'application/json'
      }
    } as any
  },
  createMockJWT: (payload: any) => {
    // Create a mock JWT token with proper format (header.payload.signature)
    const header = { alg: 'HS256', typ: 'JWT' }
    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(payload))
    const signature = 'mock_signature'

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }
}

describe.each([
  { namespace: 'eip155', id: 1, address: '0x1234567890abcdef1234567890abcdef12345678' },
  {
    namespace: 'solana',
    id: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    address: '2VqKhjZ766ZN3uBtBpb7Ls3cN4HrocP1rzxzekhVEgpU'
  }
] as const)('ReownAuthentication - $namespace', ({ namespace, id, address }) => {
  let siwx: ReownAuthentication
  let mockJWT: string

  beforeAll(() => {
    global.fetch = vi.fn() as unknown as typeof fetch

    // Mock document.location properly
    Object.defineProperty(global, 'document', {
      value: {
        location: {
          host: 'mocked.com',
          href: 'http://mocked.com/'
        }
      },
      writable: true
    })
  })

  beforeEach(() => {
    siwx = new ReownAuthentication()

    // Create a shared mock JWT for all tests
    mockJWT = mocks.createMockJWT({
      aud: 'test-audience',
      iss: 'test-issuer',
      exp: Math.floor(Date.now() / 1000) + 3600,
      projectIdKey: 'test-project-id',
      sub: 'test-subject',
      address: address,
      chainId: namespace === 'eip155' ? id : id.toString(),
      chainNamespace: namespace,
      caip2Network: `${namespace}:${id}`,
      uri: 'http://mocked.com/',
      domain: 'mocked.com',
      projectUuid: 'test-project-uuid',
      profileUuid: 'test-profile-uuid',
      nonce: 'mock_nonce'
    })
  })

  afterAll(() => {
    vi.clearAllMocks()
  })

  describe('createMessage', () => {
    beforeEach(() => {
      vi.spyOn(ChainController, 'getAllRequestedCaipNetworks').mockReturnValue([
        {
          id: 1,
          name: 'Ethereum Mainnet',
          chainNamespace: 'eip155',
          caipNetworkId: `${namespace}:${id}`
        } as unknown as CaipNetwork,
        {
          id: 2,
          name: 'Solana',
          chainNamespace: 'solana',
          caipNetworkId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
        } as unknown as CaipNetwork
      ])
    })
    it('creates a message', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      const setItemSpy = vi.spyOn(localStorage, 'setItem')

      fetchSpy.mockResolvedValueOnce(
        mocks.mockFetchResponse({ token: 'mock_token', nonce: 'mock_nonce' })
      )

      const message = await siwx.createMessage({
        accountAddress: address,
        chainId: `${namespace}:${id}`
      })

      expect(message).toEqual({
        accountAddress: address,
        chainId: `${namespace}:${id}`,
        domain: 'mocked.com',
        expirationTime: undefined,
        issuedAt: '2024-12-05T16:02:32.905Z',
        nonce: 'mock_nonce',
        notBefore: undefined,
        requestId: undefined,
        resources: undefined,
        statement: undefined,
        toString: expect.any(Function),
        uri: 'http://mocked.com/',
        version: '1'
      })

      const networkName = NetworkUtil.getNetworkNameByCaipNetworkId(
        ChainController.getAllRequestedCaipNetworks(),
        `${namespace}:${id}`
      )

      // EVM (EIP-4361) uses the decimal chain id + two blank lines; non-EVM is unchanged
      expect(message.toString())
        .toBe(`mocked.com wants you to sign in with your ${networkName} account:
${address}
${namespace === 'eip155' ? '\n' : ''}
URI: http://mocked.com/
Version: 1
Chain ID: ${namespace === 'eip155' ? id : `${namespace}:${id}`}
Nonce: mock_nonce
Issued At: 2024-12-05T16:02:32.905Z`)

      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(
          'https://api.web3modal.org/auth/v1/nonce?projectId=&st=appkit&sv=html-wagmi-undefined'
        ),
        {
          body: undefined,
          headers: undefined,
          method: 'GET'
        }
      )

      expect(setItemSpy).toHaveBeenCalledWith('@appkit/siwx-nonce-token', 'mock_token')
    })

    it('should throw an text error if response is not json', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        headers: {
          get: () => 'text/plain'
        },
        text: async () => 'mock_error'
      } as any)

      await expect(
        siwx.createMessage({
          accountAddress: address,
          chainId: `${namespace}:${id}`
        })
      ).rejects.toThrowError('mock_error')
    })

    it('should use default domain and uri if document is not available', async () => {
      const documentSpy = vi.spyOn(global, 'document', 'get').mockReturnValue(undefined as any)

      siwx = new ReownAuthentication()

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        mocks.mockFetchResponse({ token: 'mock_token', nonce: 'mock_nonce' })
      )

      const message = await siwx.createMessage({
        accountAddress: address,
        chainId: `${namespace}:${id}`
      })

      expect(message.domain).toBe('Unknown Domain')
      expect(message.uri).toBe('Unknown URI')

      documentSpy.mockRestore()
    })
  })

  describe('addSession', () => {
    it('adds a session', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      const setItemSpy = vi.spyOn(localStorage, 'setItem')

      vi.spyOn(BlockchainApiController.state, 'clientId', 'get').mockReturnValueOnce(null)

      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce('mock_nonce_token')

      fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ token: mockJWT }))

      const session = mockSession({
        data: { accountAddress: address, chainId: `${namespace}:${id}` }
      })
      await siwx.addSession(session)

      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(
          'https://api.web3modal.org/auth/v1/authenticate?projectId=&st=appkit&sv=html-wagmi-undefined'
        ),
        {
          body: `{"data":{"domain":"example.com","accountAddress":"${address}","statement":"This is a statement","chainId":"${namespace}:${id}","uri":"siwx://example.com","version":"1","nonce":"123"},"message":"Hello AppKit!","signature":"0x3c70e0a2d87f677dc0c3faf98fdf6313e99a3d9191bb79f7ecfce0c2cf46b7b33fd4c4bb83bca82fe872e35963382027d0d18018342d7dc36a675918cb73e9061c","clientId":null}`,
          headers: {
            'x-nonce-jwt': 'Bearer mock_nonce_token'
          },
          method: 'POST'
        }
      )
      expect(setItemSpy).toHaveBeenCalledWith('@appkit/siwx-auth-token', mockJWT)
    })

    it('should use correct client id', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')

      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce('mock_nonce_token')
      vi.spyOn(BlockchainApiController.state, 'clientId', 'get').mockReturnValueOnce(
        'mock_client_id'
      )

      fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ token: mockJWT }))

      const session = mockSession({
        data: { accountAddress: address, chainId: `${namespace}:${id}` }
      })
      await siwx.addSession(session)

      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(
          'https://api.web3modal.org/auth/v1/authenticate?projectId=&st=appkit&sv=html-wagmi-undefined'
        ),
        {
          body: `{"data":{"domain":"example.com","accountAddress":"${address}","statement":"This is a statement","chainId":"${namespace}:${id}","uri":"siwx://example.com","version":"1","nonce":"123"},"message":"Hello AppKit!","signature":"0x3c70e0a2d87f677dc0c3faf98fdf6313e99a3d9191bb79f7ecfce0c2cf46b7b33fd4c4bb83bca82fe872e35963382027d0d18018342d7dc36a675918cb73e9061c","clientId":"mock_client_id"}`,
          headers: {
            'x-nonce-jwt': 'Bearer mock_nonce_token'
          },
          method: 'POST'
        }
      )
    })

    it.each([
      {
        walletInfo: {
          name: 'mock_wallet_name',
          icon: 'mock_wallet_icon'
        },
        expectedBody: `{"data":{"domain":"example.com","accountAddress":"${address}","statement":"This is a statement","chainId":"${namespace}:${id}","uri":"siwx://example.com","version":"1","nonce":"123"},"message":"Hello AppKit!","signature":"0x3c70e0a2d87f677dc0c3faf98fdf6313e99a3d9191bb79f7ecfce0c2cf46b7b33fd4c4bb83bca82fe872e35963382027d0d18018342d7dc36a675918cb73e9061c","walletInfo":{"type":"unknown","name":"mock_wallet_name","icon":"mock_wallet_icon"}}`
      },
      {
        walletInfo: {
          type: 'ANNOUNCED',
          name: 'mock_wallet_name',
          icon: 'mock_wallet_icon'
        },
        expectedBody: `{"data":{"domain":"example.com","accountAddress":"${address}","statement":"This is a statement","chainId":"${namespace}:${id}","uri":"siwx://example.com","version":"1","nonce":"123"},"message":"Hello AppKit!","signature":"0x3c70e0a2d87f677dc0c3faf98fdf6313e99a3d9191bb79f7ecfce0c2cf46b7b33fd4c4bb83bca82fe872e35963382027d0d18018342d7dc36a675918cb73e9061c","walletInfo":{"type":"extension","name":"mock_wallet_name","icon":"mock_wallet_icon"}}`
      },
      {
        walletInfo: {
          type: 'WALLET_CONNECT',
          name: 'mock_wallet_name',
          icon: 'mock_wallet_icon'
        },
        expectedBody: `{"data":{"domain":"example.com","accountAddress":"${address}","statement":"This is a statement","chainId":"${namespace}:${id}","uri":"siwx://example.com","version":"1","nonce":"123"},"message":"Hello AppKit!","signature":"0x3c70e0a2d87f677dc0c3faf98fdf6313e99a3d9191bb79f7ecfce0c2cf46b7b33fd4c4bb83bca82fe872e35963382027d0d18018342d7dc36a675918cb73e9061c","walletInfo":{"type":"walletconnect","name":"mock_wallet_name","icon":"mock_wallet_icon"}}`
      },
      {
        walletInfo: {
          type: 'AUTH',
          name: 'AUTH',
          social: 'google',
          identifier: 'mock_identifier'
        },
        expectedBody: `{"data":{"domain":"example.com","accountAddress":"${address}","statement":"This is a statement","chainId":"${namespace}:${id}","uri":"siwx://example.com","version":"1","nonce":"123"},"message":"Hello AppKit!","signature":"0x3c70e0a2d87f677dc0c3faf98fdf6313e99a3d9191bb79f7ecfce0c2cf46b7b33fd4c4bb83bca82fe872e35963382027d0d18018342d7dc36a675918cb73e9061c","walletInfo":{"type":"social","social":"google","identifier":"mock_identifier"}}`
      }
    ])('should use correct wallet info', async ({ walletInfo, expectedBody }) => {
      const fetchSpy = vi.spyOn(global, 'fetch')

      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce('mock_nonce_token')
      vi.spyOn(ChainController, 'getAccountData').mockReturnValueOnce({
        connectedWalletInfo: walletInfo
      } as AccountState)

      fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ token: mockJWT }))

      const session = mockSession({
        data: { accountAddress: address, chainId: `${namespace}:${id}` }
      })
      await siwx.addSession(session)

      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(
          'https://api.web3modal.org/auth/v1/authenticate?projectId=&st=appkit&sv=html-wagmi-undefined'
        ),
        {
          body: expectedBody,
          headers: {
            'x-nonce-jwt': 'Bearer mock_nonce_token'
          },
          method: 'POST'
        }
      )
    })
  })

  describe('getSessions', () => {
    beforeEach(() => {
      vi.spyOn(localStorage, 'getItem').mockReturnValue(mockJWT)
    })

    afterEach(() => {
      vi.spyOn(localStorage, 'getItem').mockRestore()
    })

    it('gets sessions', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')

      fetchSpy.mockResolvedValueOnce(
        mocks.mockFetchResponse({
          address,
          chainId: id,
          caip2Network: `${namespace}:${id}`
        })
      )

      const sessions = await siwx.getSessions(`${namespace}:${id}`, address)

      expect(sessions).toEqual([
        {
          data: {
            accountAddress: address,
            chainId: `${namespace}:${id}`
          },
          message: '',
          signature: ''
        }
      ])

      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(
          'https://api.web3modal.org/auth/v1/me?projectId=&st=appkit&sv=html-wagmi-undefined'
        ),
        {
          body: undefined,
          headers: {
            Authorization: `Bearer ${mockJWT}`
          },
          method: 'GET'
        }
      )
    })

    it('gets sessions when address is not lowercased', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')

      fetchSpy.mockResolvedValueOnce(
        mocks.mockFetchResponse({
          address,
          chainId: id,
          caip2Network: `${namespace}:${id}`
        })
      )

      const sessions = await siwx.getSessions(`${namespace}:${id}`, address)

      expect(sessions).toEqual([
        {
          data: {
            accountAddress: address,
            chainId: `${namespace}:${id}`
          },
          message: '',
          signature: ''
        }
      ])
    })

    it('returns empty array if session is not found', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')

      fetchSpy.mockResolvedValueOnce(
        mocks.mockFetchResponse({
          address: 'different_address',
          chainId: id
        })
      )
      await expect(siwx.getSessions(`${namespace}:${id}`, address)).resolves.toEqual([])

      fetchSpy.mockResolvedValueOnce(
        mocks.mockFetchResponse({
          address,
          chainId: 2
        })
      )
      await expect(siwx.getSessions(`${namespace}:${id}`, address)).resolves.toEqual([])

      fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse(null))
      await expect(siwx.getSessions(`${namespace}:${id}`, address)).resolves.toEqual([])

      fetchSpy.mockRejectedValueOnce(new Error())
      await expect(siwx.getSessions(`${namespace}:${id}`, address)).resolves.toEqual([])
    })

    it('should not request session if no auth token is set', async () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce(null)
      const fetchSpy = vi.spyOn(global, 'fetch')

      await expect(siwx.getSessions(`${namespace}:${id}`, address)).resolves.toEqual([])
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('revokeSession', () => {
    it('revokes a session', async () => {
      const removeItemSpy = vi.spyOn(localStorage, 'removeItem')

      await siwx.revokeSession(`${namespace}:${id}`, '0x1234567890abcdef1234567890abcdef12345678')

      expect(removeItemSpy).toHaveBeenCalledWith('@appkit/siwx-auth-token')
    })
  })

  describe('setSessions', () => {
    it('clears storage token if sessions are empty', async () => {
      const removeItemSpy = vi.spyOn(localStorage, 'removeItem')

      await siwx.setSessions([])

      expect(removeItemSpy).toHaveBeenCalledWith('@appkit/siwx-auth-token')
    })

    it('adds a session with default first item', async () => {
      const addSessionSpy = vi.spyOn(siwx, 'addSession')
      addSessionSpy.mockResolvedValueOnce()

      const session = mockSession({
        data: { accountAddress: address, chainId: `${namespace}:${id}` }
      })
      await siwx.setSessions([session])

      expect(addSessionSpy).toHaveBeenCalledWith(session)
    })

    it('should use the correct session if there are multiple sessions', async () => {
      const addSessionSpy = vi.spyOn(siwx, 'addSession')
      addSessionSpy.mockResolvedValueOnce()

      mockChainControllerState({
        activeCaipNetwork: {
          ...extendedMainnet,
          id: 2,
          caipNetworkId: 'eip155:2'
        }
      })

      const session = mockSession({
        data: { accountAddress: address, chainId: `${namespace}:${id}` }
      })
      const session2 = mockSession({ data: { accountAddress: address, chainId: 'eip155:2' } })
      await siwx.setSessions([session, session2])

      expect(addSessionSpy).toHaveBeenCalledWith(session2)
    })
  })

  describe('getRequired', () => {
    it('should return true for getRequired() by default', () => {
      expect(siwx.getRequired()).toBe(true)
    })

    it('should return false for getRequired()', () => {
      siwx = new ReownAuthentication({ required: false })
      expect(siwx.getRequired()).toBe(false)
    })
  })

  describe('events', () => {
    it('should register event listeners with on() method', () => {
      const callback = vi.fn()
      const unsubscribe = siwx.on('sessionChanged', callback)

      expect(unsubscribe).toBeInstanceOf(Function)
    })

    it('should emit session-changed event when a session is added', async () => {
      const callback = vi.fn()
      siwx.on('sessionChanged', callback)

      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce('mock_nonce_token')
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mocks.mockFetchResponse({ token: mockJWT }))

      const session = mockSession()
      await siwx.addSession(session)

      expect(callback).toHaveBeenCalledWith(session)
    })

    it('should emit session-changed event when sessions are retrieved', async () => {
      const callback = vi.fn()
      siwx.on('sessionChanged', callback)

      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce(mockJWT)
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        mocks.mockFetchResponse({
          address: address,
          chainId: id,
          caip2Network: `${namespace}:${id}`
        })
      )

      await siwx.getSessions(`${namespace}:${id}`, address)

      expect(callback).toHaveBeenCalledWith({
        data: {
          accountAddress: address,
          chainId: `${namespace}:${id}`
        },
        message: '',
        signature: ''
      })
    })

    it('should emit session-changed event with undefined when a session is revoked', async () => {
      const callback = vi.fn()
      siwx.on('sessionChanged', callback)

      await siwx.revokeSession(`${namespace}:${id}`, address)

      expect(callback).toHaveBeenCalledWith(undefined)
    })

    it('should emit session-changed event with undefined when sessions are cleared', async () => {
      const callback = vi.fn()
      siwx.on('sessionChanged', callback)

      await siwx.setSessions([])

      expect(callback).toHaveBeenCalledWith(undefined)
    })

    it('should properly unsubscribe listener when unsubscribe function is called', async () => {
      const callback = vi.fn()
      const unsubscribe = siwx.on('sessionChanged', callback)

      unsubscribe()

      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce('mock_nonce_token')
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mocks.mockFetchResponse({ token: mockJWT }))

      await siwx.addSession(mockSession())

      expect(callback).not.toHaveBeenCalled()
    })

    it('should remove all listeners when removeAllListeners is called', async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      siwx.on('sessionChanged', callback1)
      siwx.on('sessionChanged', callback2)

      siwx.removeAllListeners()

      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce('mock_nonce_token')
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mocks.mockFetchResponse({ token: mockJWT }))

      await siwx.addSession(mockSession())

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })
  })

  describe('getSessionAccount', () => {
    it('should throw an error if not authenticated', async () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce(null)

      await expect(siwx.getSessionAccount()).rejects.toThrow('Not authenticated')
    })

    it('should return session account data when authenticated', async () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce(mockJWT)
      const fetchSpy = vi.spyOn(global, 'fetch')

      const mockAccountData = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
        aud: 'test-aud',
        iss: 'test-iss',
        exp: 1000000000,
        projectIdKey: 'test-project-id-key',
        sub: 'test-sub',
        uri: 'http://mocked.com/',
        domain: 'mocked.com',
        projectUuid: 'test-project-uuid',
        profileUuid: 'test-profile-uuid',
        nonce: 'test-nonce',
        appKitAccount: {
          uuid: 'test-uuid',
          caip2_chain: 'eip155:1',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          profile_uuid: 'test-profile-uuid',
          created_at: '2023-01-01T00:00:00.000Z',
          is_main_account: true,
          verification_status: null,
          connection_method: null,
          metadata: {},
          last_signed_in_at: '2023-01-01T00:00:00.000Z',
          signed_up_at: '2023-01-01T00:00:00.000Z',
          updated_at: '2023-01-01T00:00:00.000Z'
        }
      }

      fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse(mockAccountData))

      const result = await siwx.getSessionAccount()

      expect(result).toEqual(mockAccountData)
      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(
          'https://api.web3modal.org/auth/v1/me?projectId=&st=appkit&sv=html-wagmi-undefined&includeAppKitAccount=true'
        ),
        {
          body: undefined,
          headers: {
            Authorization: `Bearer ${mockJWT}`
          },
          method: 'GET'
        }
      )
    })

    it('should handle request errors when fetching session account', async () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce(mockJWT)
      const fetchSpy = vi.spyOn(global, 'fetch')

      // Simulate a non-JSON response error
      fetchSpy.mockResolvedValueOnce({
        headers: {
          get: () => 'text/plain'
        },
        text: async () => 'Error fetching session account'
      } as any)

      await expect(siwx.getSessionAccount()).rejects.toThrow('Error fetching session account')
    })
  })

  describe('setSessionAccountMetadata', () => {
    it('should throw an error if not authenticated', async () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce(null)

      await expect(siwx.setSessionAccountMetadata({ test: 'value' })).rejects.toThrow(
        'Not authenticated'
      )
    })

    it('should send metadata to API when authenticated', async () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce(mockJWT)
      const fetchSpy = vi.spyOn(global, 'fetch')

      const metadata = {
        displayName: 'Test User',
        avatar: 'https://example.com/avatar.png',
        customField: 'custom value'
      }

      fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ success: true }))

      await siwx.setSessionAccountMetadata(metadata)

      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(
          'https://api.web3modal.org/auth/v1/account-metadata?projectId=&st=appkit&sv=html-wagmi-undefined'
        ),
        {
          body: JSON.stringify({ metadata }),
          headers: {
            Authorization: `Bearer ${mockJWT}`
          },
          method: 'PUT'
        }
      )
    })

    it('should handle request errors when updating metadata', async () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce(mockJWT)
      const fetchSpy = vi.spyOn(global, 'fetch')

      // Simulate a non-JSON response error
      fetchSpy.mockResolvedValueOnce({
        headers: {
          get: () => 'text/plain'
        },
        text: async () => 'Error updating metadata'
      } as any)

      await expect(siwx.setSessionAccountMetadata({ test: 'value' })).rejects.toThrow(
        'Error updating metadata'
      )
    })

    it('should pass empty object as metadata if none provided', async () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValueOnce(mockJWT)
      const fetchSpy = vi.spyOn(global, 'fetch')

      fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ success: true }))

      await siwx.setSessionAccountMetadata()

      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(
          'https://api.web3modal.org/auth/v1/account-metadata?projectId=&st=appkit&sv=html-wagmi-undefined'
        ),
        {
          body: JSON.stringify({ metadata: null }),
          headers: {
            Authorization: `Bearer ${mockJWT}`
          },
          method: 'PUT'
        }
      )
    })
  })
})

describe('Constructor with custom parameters', () => {
  it('should use custom storage keys when provided', () => {
    const customAuth = new ReownAuthentication({
      localAuthStorageKey: '@custom/auth-token',
      localNonceStorageKey: '@custom/nonce-token',
      required: false
    })

    expect(customAuth.getRequired()).toBe(false)

    // Test that custom keys are used internally (we can verify through the behavior)
    vi.spyOn(SafeLocalStorage, 'getItem')
    customAuth['getStorageToken']('@custom/auth-token' as any)
    expect(SafeLocalStorage.getItem).toHaveBeenCalledWith('@custom/auth-token')
  })

  it('should use default values when no parameters provided', () => {
    const defaultAuth = new ReownAuthentication()
    expect(defaultAuth.getRequired()).toBe(true)
  })
})

describe('Email OTP functionality', () => {
  let siwx: ReownAuthentication

  beforeEach(() => {
    siwx = new ReownAuthentication()
  })

  describe('requestEmailOtp', () => {
    it('should request email OTP and set otpUuid', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      const mockUuid = 'mock-otp-uuid-123'

      fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ uuid: mockUuid }))

      const result = await siwx.requestEmailOtp({
        email: 'test@example.com',
        account: 'eip155:1:0x1234567890abcdef1234567890abcdef12345678'
      })

      expect(result).toEqual({ uuid: mockUuid })
      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(
          'https://api.web3modal.org/auth/v1/otp?projectId=&st=appkit&sv=html-wagmi-undefined'
        ),
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            account: 'eip155:1:0x1234567890abcdef1234567890abcdef12345678'
          }),
          headers: undefined
        }
      )

      // Verify that otpUuid is set internally
      expect(siwx['otpUuid']).toBe(mockUuid)

      // Verify that messenger resources are updated
      expect(siwx['messenger'].resources).toEqual(['email:test@example.com'])
    })

    it('should handle null uuid response', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')

      fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ uuid: null }))

      const result = await siwx.requestEmailOtp({
        email: 'test@example.com',
        account: 'eip155:1:0x1234567890abcdef1234567890abcdef12345678'
      })

      expect(result).toEqual({ uuid: null })
      expect(siwx['otpUuid']).toBe(null)
    })

    it('should handle API errors when requesting OTP', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        text: async () => 'OTP request failed'
      } as any)

      await expect(
        siwx.requestEmailOtp({
          email: 'test@example.com',
          account: 'eip155:1:0x1234567890abcdef1234567890abcdef12345678'
        })
      ).rejects.toThrow('OTP request failed')
    })
  })

  describe('confirmEmailOtp', () => {
    beforeEach(() => {
      // Set otpUuid to simulate having requested OTP
      siwx['otpUuid'] = 'mock-otp-uuid-123'
    })

    it('should confirm email OTP with correct headers', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')

      fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse(null))

      await siwx.confirmEmailOtp({ code: '123456' })

      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(
          'https://api.web3modal.org/auth/v1/otp?projectId=&st=appkit&sv=html-wagmi-undefined'
        ),
        {
          method: 'PUT',
          body: JSON.stringify({ code: '123456' }),
          headers: {
            'x-otp': 'mock-otp-uuid-123'
          }
        }
      )
    })

    it('should not include OTP header when otpUuid is null', async () => {
      siwx['otpUuid'] = null
      const fetchSpy = vi.spyOn(global, 'fetch')

      fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse(null))

      await siwx.confirmEmailOtp({ code: '123456' })

      expect(fetchSpy).toHaveBeenCalledWith(
        new URL(
          'https://api.web3modal.org/auth/v1/otp?projectId=&st=appkit&sv=html-wagmi-undefined'
        ),
        {
          method: 'PUT',
          body: JSON.stringify({ code: '123456' }),
          headers: {}
        }
      )
    })

    it('should handle API errors when confirming OTP', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid OTP code'
      } as any)

      await expect(siwx.confirmEmailOtp({ code: '123456' })).rejects.toThrow('Invalid OTP code')
    })
  })

  it('should clear otpUuid when session is added', async () => {
    // Set initial otpUuid
    siwx['otpUuid'] = 'mock-otp-uuid-123'

    const fetchSpy = vi.spyOn(global, 'fetch')
    vi.spyOn(localStorage, 'getItem').mockReturnValueOnce('mock_nonce_token')

    const mockJWT = mocks.createMockJWT({
      aud: 'test-audience',
      iss: 'test-issuer',
      exp: Math.floor(Date.now() / 1000) + 3600,
      projectIdKey: 'test-project-id',
      sub: 'test-subject',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      chainNamespace: 'eip155',
      caip2Network: 'eip155:1',
      uri: 'http://mocked.com/',
      domain: 'mocked.com',
      projectUuid: 'test-project-uuid',
      profileUuid: 'test-profile-uuid',
      nonce: 'mock_nonce'
    })

    fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ token: mockJWT }))

    const session = mockSession({
      data: { accountAddress: '0x1234567890abcdef1234567890abcdef12345678', chainId: 'eip155:1' }
    })

    await siwx.addSession(session)

    // Verify otpUuid is cleared
    expect(siwx['otpUuid']).toBe(null)
  })
})

describe('JWT Decode functionality (tested indirectly)', () => {
  let siwx: ReownAuthentication

  beforeEach(() => {
    siwx = new ReownAuthentication()
  })

  it('should decode valid JWT token correctly through addSession', async () => {
    const payload = {
      aud: 'test-audience',
      iss: 'test-issuer',
      exp: 1234567890,
      projectIdKey: 'test-project-id',
      sub: 'test-subject',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      chainNamespace: 'eip155' as const,
      caip2Network: 'eip155:1',
      uri: 'http://test.com/',
      domain: 'test.com',
      projectUuid: 'test-project-uuid',
      profileUuid: 'test-profile-uuid',
      nonce: 'test-nonce',
      email: 'test@example.com'
    }

    const mockJWT = mocks.createMockJWT(payload)
    const setAccountPropSpy = vi.spyOn(ChainController, 'setAccountProp')
    const fetchSpy = vi.spyOn(global, 'fetch')

    vi.spyOn(localStorage, 'getItem').mockReturnValueOnce('mock_nonce_token')
    fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ token: mockJWT }))

    const session = mockSession({
      data: { accountAddress: '0x1234567890abcdef1234567890abcdef12345678', chainId: 'eip155:1' }
    })

    await siwx.addSession(session)

    // Verify that the JWT was decoded correctly by checking if setAppKitAccountUser was called
    expect(setAccountPropSpy).toHaveBeenCalledWith('user', { email: 'test@example.com' }, 'eip155')

    setAccountPropSpy.mockRestore()
  })

  it('should handle invalid JWT format through addSession', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')

    vi.spyOn(localStorage, 'getItem').mockReturnValueOnce('mock_nonce_token')
    fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ token: 'invalid-token' }))

    const session = mockSession({
      data: { accountAddress: '0x1234567890abcdef1234567890abcdef12345678', chainId: 'eip155:1' }
    })

    await expect(siwx.addSession(session)).rejects.toThrow('Invalid token')
  })

  it('should handle JWT with missing parts through addSession', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')

    vi.spyOn(localStorage, 'getItem').mockReturnValueOnce('mock_nonce_token')
    fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ token: 'header.payload' }))

    const session = mockSession({
      data: { accountAddress: '0x1234567890abcdef1234567890abcdef12345678', chainId: 'eip155:1' }
    })

    await expect(siwx.addSession(session)).rejects.toThrow('Invalid token')
  })

  it('should handle JWT with malformed payload through addSession', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')

    vi.spyOn(localStorage, 'getItem').mockReturnValueOnce('mock_nonce_token')

    // Create a token with malformed base64 payload
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const malformedPayload = 'invalid-base64-!!!'
    const signature = 'signature'
    const malformedToken = `${header}.${malformedPayload}.${signature}`

    fetchSpy.mockResolvedValueOnce(mocks.mockFetchResponse({ token: malformedToken }))

    const session = mockSession({
      data: { accountAddress: '0x1234567890abcdef1234567890abcdef12345678', chainId: 'eip155:1' }
    })

    await expect(siwx.addSession(session)).rejects.toThrow()
  })
})

describe('setAppKitAccountUser functionality', () => {
  let siwx: ReownAuthentication
  let setAccountPropSpy: any

  beforeEach(() => {
    siwx = new ReownAuthentication()
    setAccountPropSpy = vi.spyOn(ChainController, 'setAccountProp')
  })

  afterEach(() => {
    setAccountPropSpy.mockRestore()
  })

  it('should set user email for all chain namespaces when email exists', () => {
    const mockSession = {
      aud: 'test-audience',
      iss: 'test-issuer',
      exp: 1234567890,
      projectIdKey: 'test-project-id',
      sub: 'test-subject',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      chainNamespace: 'eip155' as const,
      caip2Network: 'eip155:1',
      uri: 'http://test.com/',
      domain: 'test.com',
      projectUuid: 'test-project-uuid',
      profileUuid: 'test-profile-uuid',
      nonce: 'test-nonce',
      email: 'test@example.com'
    }

    siwx['setAppKitAccountUser'](mockSession)

    // Should be called for each chain namespace in AppKitConstantsUtil.CHAIN
    expect(setAccountPropSpy).toHaveBeenCalledWith('user', { email: 'test@example.com' }, 'eip155')
    expect(setAccountPropSpy).toHaveBeenCalledWith('user', { email: 'test@example.com' }, 'solana')
    expect(setAccountPropSpy).toHaveBeenCalledWith('user', { email: 'test@example.com' }, 'bip122')
  })

  it('should not set user when email is undefined', () => {
    const mockSession = {
      aud: 'test-audience',
      iss: 'test-issuer',
      exp: 1234567890,
      projectIdKey: 'test-project-id',
      sub: 'test-subject',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      chainNamespace: 'eip155' as const,
      caip2Network: 'eip155:1',
      uri: 'http://test.com/',
      domain: 'test.com',
      projectUuid: 'test-project-uuid',
      profileUuid: 'test-profile-uuid',
      nonce: 'test-nonce'
      // No email property
    }

    siwx['setAppKitAccountUser'](mockSession)

    expect(setAccountPropSpy).not.toHaveBeenCalled()
  })

  it('should not set user when email is empty string', () => {
    const mockSession = {
      aud: 'test-audience',
      iss: 'test-issuer',
      exp: 1234567890,
      projectIdKey: 'test-project-id',
      sub: 'test-subject',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      chainNamespace: 'eip155' as const,
      caip2Network: 'eip155:1',
      uri: 'http://test.com/',
      domain: 'test.com',
      projectUuid: 'test-project-uuid',
      profileUuid: 'test-profile-uuid',
      nonce: 'test-nonce',
      email: ''
    }

    siwx['setAppKitAccountUser'](mockSession)

    expect(setAccountPropSpy).not.toHaveBeenCalled()
  })
})

describe('Edge cases and error handling', () => {
  let siwx: ReownAuthentication

  beforeEach(() => {
    siwx = new ReownAuthentication()
  })

  it('should handle non-JSON response correctly', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => 'text/plain'
      },
      json: async () => {
        throw new Error('Not JSON')
      }
    } as any)

    const result = await siwx['request']({
      method: 'GET',
      key: 'nonce'
    })

    expect(result).toBe(null)
  })

  it('should handle fetch errors gracefully', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')

    fetchSpy.mockRejectedValueOnce(new Error('Network error'))

    await expect(
      siwx['request']({
        method: 'GET',
        key: 'nonce'
      })
    ).rejects.toThrow('Network error')
  })

  it('should handle missing SDK properties', () => {
    const originalGetSdkProperties = ApiController._getSdkProperties
    ApiController._getSdkProperties = vi.fn().mockReturnValue({
      projectId: '',
      st: '',
      sv: ''
    })

    const result = siwx['getSDKProperties']()
    expect(result).toEqual({
      projectId: '',
      st: '',
      sv: ''
    })

    ApiController._getSdkProperties = originalGetSdkProperties
  })

  it('should handle wallet info when connectedWalletInfo is undefined', () => {
    vi.spyOn(ChainController, 'getAccountData').mockReturnValue(undefined)

    const walletInfo = siwx['getWalletInfo']()
    expect(walletInfo).toBeUndefined()
  })

  it('should handle wallet info with missing properties', () => {
    vi.spyOn(ChainController, 'getAccountData').mockReturnValue({
      connectedWalletInfo: {
        type: 'unknown-type'
        // Missing name and icon
      }
    } as unknown as AccountState)

    const walletInfo = siwx['getWalletInfo']()
    expect(walletInfo).toEqual({
      type: 'unknown',
      name: undefined,
      icon: undefined
    })
  })

  it('should handle clearStorageTokens correctly', () => {
    const removeItemSpy = vi.spyOn(SafeLocalStorage, 'removeItem')
    const emitSpy = vi.spyOn(siwx as any, 'emit')

    // Set initial state
    siwx['otpUuid'] = 'test-uuid'

    siwx['clearStorageTokens']()

    expect(siwx['otpUuid']).toBe(null)
    expect(removeItemSpy).toHaveBeenCalledWith(SafeLocalStorageKeys.SIWX_AUTH_TOKEN)
    expect(removeItemSpy).toHaveBeenCalledWith(SafeLocalStorageKeys.SIWX_NONCE_TOKEN)
    expect(emitSpy).toHaveBeenCalledWith('sessionChanged', undefined)
  })
})
