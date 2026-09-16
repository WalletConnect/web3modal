import { describe, expect, test } from 'vitest'

import { NetworkUtil } from '../src/utils/NetworkUtil.js'
import { type CaipNetwork } from '../src/utils/TypeUtil.js'

describe('NetworkUtil', () => {
  const mockNetworks: CaipNetwork[] = [
    {
      id: 'eip155:1',
      name: 'Ethereum',
      chainNamespace: 'eip155'
    } as CaipNetwork,
    {
      id: 'eip155:137',
      name: 'Polygon',
      chainNamespace: 'eip155'
    } as CaipNetwork,
    {
      id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      name: 'Solana',
      chainNamespace: 'solana'
    } as CaipNetwork
  ]

  describe('getNetworksByNamespace', () => {
    test('should return networks filtered by namespace', () => {
      const eip155Networks = NetworkUtil.getNetworksByNamespace(mockNetworks, 'eip155')
      expect(eip155Networks).toHaveLength(2)
      expect(eip155Networks?.[0]?.name).toBe('Ethereum')
      expect(eip155Networks?.[1]?.name).toBe('Polygon')

      const solanaNetworks = NetworkUtil.getNetworksByNamespace(mockNetworks, 'solana')
      expect(solanaNetworks).toHaveLength(1)
      expect(solanaNetworks?.[0]?.name).toBe('Solana')
    })

    test('should return empty array for non-existent namespace', () => {
      const networks = NetworkUtil.getNetworksByNamespace(mockNetworks, 'bip122')
      expect(networks).toHaveLength(0)
    })
  })

  describe('getFirstNetworkByNamespace', () => {
    test('should return first network for namespace', () => {
      const firstEip155Network = NetworkUtil.getFirstNetworkByNamespace(mockNetworks, 'eip155')
      expect(firstEip155Network?.name).toBe('Ethereum')

      const firstSolanaNetwork = NetworkUtil.getFirstNetworkByNamespace(mockNetworks, 'solana')
      expect(firstSolanaNetwork?.name).toBe('Solana')
    })

    test('should return undefined for non-existent namespace', () => {
      const network = NetworkUtil.getFirstNetworkByNamespace(mockNetworks, 'bip122')
      expect(network).toBeUndefined()
    })
  })

  describe('caipNetworkIdToNumber', () => {
    test('converts valid CAIP network ID to number', () => {
      expect(NetworkUtil.caipNetworkIdToNumber('eip155:1')).toBe(1)
      expect(NetworkUtil.caipNetworkIdToNumber('eip155:42')).toBe(42)
    })

    test('returns undefined for undefined input', () => {
      expect(NetworkUtil.caipNetworkIdToNumber(undefined)).toBeUndefined()
    })

    test('returns NaN for invalid CAIP network ID', () => {
      expect(NetworkUtil.caipNetworkIdToNumber('invalid:id' as any)).toBeNaN()
    })
  })

  describe('parseEvmChainId', () => {
    test('parses string CAIP network ID', () => {
      expect(NetworkUtil.parseEvmChainId('eip155:1')).toBe(1)
      expect(NetworkUtil.parseEvmChainId('eip155:42')).toBe(42)
    })

    test('parses numeric string chain ID', () => {
      expect(NetworkUtil.parseEvmChainId('1')).toBe(1)
      expect(NetworkUtil.parseEvmChainId('42')).toBe(42)
    })

    test('returns number input as-is', () => {
      expect(NetworkUtil.parseEvmChainId(1)).toBe(1)
      expect(NetworkUtil.parseEvmChainId(42)).toBe(42)
    })

    test('returns NaN for invalid string input', () => {
      expect(NetworkUtil.parseEvmChainId('invalid')).toBeNaN()
    })
  })
})
