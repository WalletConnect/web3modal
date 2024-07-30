import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  AccountController,
  ChainController,
  ConnectionController,
  ConnectorController,
  EnsController,
  NetworkController
} from '../../index.js'
import { W3mFrameProvider } from '@web3modal/wallet'
import { ConstantsUtil } from '@web3modal/common'
// -- Setup --------------------------------------------------------------------
const TEST_NAME = {
  name: 'test',
  registered: true,
  updated: 1,
  addresses: [
    {
      '0x123': {
        address: '0x123',
        created: '1'
      }
    }
  ],
  attributes: []
}
vi.mock('../../src/controllers/BlockchainApiController.js', async importOriginal => {
  const mod =
    await importOriginal<typeof import('../../src/controllers/BlockchainApiController.js')>()

  return {
    ...mod,
    BlockchainApiController: {
      lookupEnsName: async (name: string) => {
        if (name !== 'test') {
          throw new Error('Error resolving ENS name')
        }

        return Promise.resolve(TEST_NAME)
      },
      getEnsNameSuggestions: async (name: string) => {
        const suggestions = [`${name}1`, `${name}2`, `${name}Something`].map(val => ({
          registered: false,
          name: `${val}${ConstantsUtil.WC_NAME_SUFFIX}`
        }))
        if (name === 'test') {
          suggestions.push({ registered: false, name: `${name}${ConstantsUtil.WC_NAME_SUFFIX}` })
        }

        return Promise.resolve({ suggestions })
      },
      reverseLookupEnsName: async ({ address }: { address: string }) => {
        if (address === '0x123') {
          return Promise.resolve([TEST_NAME])
        }

        return Promise.resolve([])
      },

      registerEnsName: async (name: string) => {
        if (name === 'test') {
          throw new Error('Error registering ENS name')
        }

        return Promise.resolve({ success: true })
      }
    }
  }
})

// -- Tests --------------------------------------------------------------------
beforeAll(() => {
  ChainController.initialize([{ chain: ConstantsUtil.CHAIN.EVM }])
})

describe('EnsController', () => {
  it('should have valid default state', () => {
    expect(EnsController.state).toEqual({
      suggestions: [],
      loading: false
    })
  })

  it('should resolve name', async () => {
    const result = await EnsController.resolveName('test')

    expect(result).toEqual(TEST_NAME)
  })

  it('should throw error when resolving invalid name', async () => {
    try {
      await EnsController.resolveName('invalid')
    } catch (e) {
      expect((e as Error).message).toBe('Error resolving name')
    }
  })

  it('should check if name is registered', async () => {
    const result = await EnsController.isNameRegistered('test')

    expect(result).toBe(true)

    const result2 = await EnsController.isNameRegistered('invalid')
    expect(result2).toBe(false)
  })

  it('should get suggestions', async () => {
    // Setup

    const result = await EnsController.getSuggestions('test')
    const mockSuggestions = ['test1', 'test2', 'testSomething', 'test'].map(name => ({
      registered: false,
      name
    }))
    expect(result).toEqual(mockSuggestions)
    expect(EnsController.state.suggestions).toEqual(mockSuggestions)
    expect(EnsController.state.loading).toBe(false)

    const result2 = await EnsController.getSuggestions('name')
    const mockSuggestions2 = ['name1', 'name2', 'nameSomething'].map(name => ({
      registered: false,
      name
    }))
    expect(result2).toEqual(mockSuggestions2)
    expect(EnsController.state.suggestions).toEqual(mockSuggestions2)
    expect(EnsController.state.loading).toBe(false)
  })

  it('should get names for address', async () => {
    // No network set
    const result = await EnsController.getNamesForAddress('0x123')
    expect(result).toEqual([])
    NetworkController.setActiveCaipNetwork({ id: 'test:123', chain: ConstantsUtil.CHAIN.EVM })
    const resultWithNetwork = await EnsController.getNamesForAddress('0x123')
    expect(resultWithNetwork).toEqual([TEST_NAME])

    const result2 = await EnsController.getNamesForAddress('invalid')
    expect(result2).toEqual([])
  })

  it('should register name', async () => {
    // Setup
    NetworkController.setActiveCaipNetwork({ id: 'test:123', chain: ConstantsUtil.CHAIN.EVM })
    AccountController.setCaipAddress('eip155:1:0x123')
    const getAuthConnectorSpy = vi.spyOn(ConnectorController, 'getAuthConnector').mockReturnValue({
      provider: { getEmail: () => 'test@walletconnect.com' } as unknown as W3mFrameProvider,
      id: 'w3mAuth',
      type: 'AUTH',
      chain: ConstantsUtil.CHAIN.EVM
    })
    const signMessageSpy = vi
      .spyOn(ConnectionController, 'signMessage')
      .mockResolvedValueOnce('0x123123123')

    const message = JSON.stringify({
      name: `newname${ConstantsUtil.WC_NAME_SUFFIX}`,
      attributes: {},
      timestamp: Math.floor(Date.now() / 1000)
    })
    await EnsController.registerName('newname')
    expect(getAuthConnectorSpy).toHaveBeenCalled()
    expect(signMessageSpy).toHaveBeenCalledWith(message)
    expect(AccountController.state.profileName).toBe(`newname${ConstantsUtil.WC_NAME_SUFFIX}`)
    expect(EnsController.state.loading).toBe(false)
  })

  it('should validate name correctly', () => {
    const result = EnsController.validateName('test123')
    expect(result).toBe(true)

    const result2 = EnsController.validateName('invalid.name')
    expect(result2).toBe(false)

    const result3 = EnsController.validateName('valid-name')
    expect(result3).toBe(true)

    const result4 = EnsController.validateName('invalid name')
    expect(result4).toBe(false)
  })
})
