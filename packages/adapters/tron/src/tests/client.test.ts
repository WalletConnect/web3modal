import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BlockchainApiController } from '@reown/appkit-controllers'

import { TronAdapter } from '../adapter'

const MOCK_ADDRESS = 'TQZnRQHi8ioE4rEQHDWsDR9qM1APYUPbJG'

const MOCK_TRON_MAINNET = {
  id: '0x2b6653dc',
  name: 'TRON',
  chainNamespace: 'tron',
  caipNetworkId: 'tron:0x2b6653dc',
  rpcUrls: {
    default: { http: ['https://rpc.walletconnect.org/v1'] },
    chainDefault: { http: ['https://api.trongrid.io'] }
  },
  nativeCurrency: { name: 'TRX', symbol: 'TRX', decimals: 6 },
  testnet: false
}

const MOCK_TRON_SHASTA = {
  id: '0x94a9059e',
  name: 'TRON Shasta',
  chainNamespace: 'tron',
  caipNetworkId: 'tron:0x94a9059e',
  rpcUrls: {
    default: { http: ['https://rpc.walletconnect.org/v1'] },
    chainDefault: { http: ['https://api.shasta.trongrid.io/'] }
  },
  nativeCurrency: { name: 'TRX', symbol: 'TRX', decimals: 6 },
  testnet: true
}

const mockFetch = vi.fn()

vi.stubGlobal('fetch', mockFetch)

describe('TronAdapter', () => {
  let adapter: TronAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new TronAdapter()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getBalance', () => {
    it('uses the configured TRON fullnode for testnet balances', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ balance: 2500000 })
      })

      const blockchainApiSpy = vi.spyOn(BlockchainApiController, 'getAddressBalance')

      const result = await adapter.getBalance({
        address: MOCK_ADDRESS,
        caipNetwork: MOCK_TRON_SHASTA as any
      })

      expect(result).toEqual({ balance: '2.5', symbol: 'TRX' })
      expect(mockFetch).toHaveBeenCalledWith('https://api.shasta.trongrid.io/wallet/getaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: MOCK_ADDRESS, visible: true })
      })
      expect(blockchainApiSpy).not.toHaveBeenCalled()
    })

    it('keeps using Blockchain API for mainnet balances', async () => {
      vi.spyOn(BlockchainApiController, 'getAddressBalance').mockResolvedValueOnce({
        data: [{ balance: 1000000 }]
      })

      const result = await adapter.getBalance({
        address: MOCK_ADDRESS,
        caipNetwork: MOCK_TRON_MAINNET as any
      })

      expect(result).toEqual({ balance: '1', symbol: 'TRX' })
      expect(BlockchainApiController.getAddressBalance).toHaveBeenCalledWith({
        caipNetworkId: 'tron:0x2b6653dc',
        address: MOCK_ADDRESS,
        method: 'tron_getAddressBalance',
        params: [{ address: MOCK_ADDRESS }]
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
