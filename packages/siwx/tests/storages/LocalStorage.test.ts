import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

import { mockSession } from '@reown/appkit-controllers/testing'

import { LocalStorage } from '../../src'

const previousLocalStorage = globalThis.localStorage
const previousWindow = globalThis.window

afterAll(() => {
  Object.assign(globalThis, { localStorage: previousLocalStorage, window: previousWindow })
})

describe('LocalStorage', () => {
  const key = 'localstorage-key'
  const storage = new LocalStorage({ key })

  const getItem = vi.fn<() => string | null>(() => null)
  const setItem = vi.fn()
  const removeItem = vi.fn()

  beforeAll(() => {
    Object.assign(globalThis, { window: {}, localStorage: { getItem, setItem, removeItem } })
  })

  afterEach(() => {
    getItem.mockClear()
    setItem.mockClear()
    removeItem.mockClear()
  })

  test('should get sessions empty', async () => {
    const sessions = await storage.get('eip155:1', '0x1234567890abcdef')
    expect(sessions).toEqual([])
  })

  test('should get sessions', async () => {
    getItem.mockImplementation(() =>
      JSON.stringify([
        mockSession({ data: { accountAddress: '0x1234567890abcdef', chainId: 'eip155:1' } })
      ])
    )
    const sessions = await storage.get('eip155:1', '0x1234567890abcdef')

    expect(getItem).toHaveBeenCalledWith(key)
    expect(sessions).toHaveLength(1)
  })

  test('should set sessions', async () => {
    const session = mockSession()
    await storage.set([session])

    expect(setItem).toHaveBeenCalledWith(key, JSON.stringify([session]))
  })

  test('should remove only sessions matching the chain and address', async () => {
    const matchingSession = mockSession({
      data: { accountAddress: '0xAAA', chainId: 'eip155:1' }
    })
    const duplicateMatchingSession = mockSession({
      data: { accountAddress: '0xAAA', chainId: 'eip155:1' }
    })
    const sameChainSession = mockSession({
      data: { accountAddress: '0xBBB', chainId: 'eip155:1' }
    })
    const sameAddressSession = mockSession({
      data: { accountAddress: '0xAAA', chainId: 'eip155:137' }
    })
    const unrelatedSession = mockSession({
      data: { accountAddress: '0xBBB', chainId: 'eip155:137' }
    })

    getItem.mockImplementation(() =>
      JSON.stringify([
        matchingSession,
        duplicateMatchingSession,
        sameChainSession,
        sameAddressSession,
        unrelatedSession
      ])
    )

    await storage.delete('eip155:1', '0xAAA')
    expect(getItem).toHaveBeenCalledWith(key)
    expect(setItem).toHaveBeenCalledWith(
      key,
      JSON.stringify([sameChainSession, sameAddressSession, unrelatedSession])
    )
  })
})
