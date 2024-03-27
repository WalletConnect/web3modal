import { describe, expect, it } from 'vitest'
import { SIWEController } from '../../core/controller/SIWEController.js'

// -- Mocks -------------------------------------------------------------
const session = { address: '0x', chainId: 1 }
const client = {
  signIn: () => Promise.resolve(session),
  options: {
    enabled: true,
    nonceRefetchIntervalMs: 60000,
    sessionRefetchIntervalMs: 120000,
    signOutOnDisconnect: true,
    signOutOnAccountChange: true,
    signOutOnNetworkChange: true
  },
  getNonce: async () => Promise.resolve('mock-nonce'),
  createMessage: () => 'mock-message',
  verifyMessage: async () => Promise.resolve(true),
  getSession: async () => Promise.resolve(session),
  signOut: async () => Promise.resolve(true),
  getMessageParams: () =>
    Promise.resolve({
      chains: [1],
      domain: 'mock-domain',
      uri: 'mock-uri',
      nonce: 'mock-nonce'
    })
}

// -- Tests --------------------------------------------------------------------
describe('SIWEController', () => {
  it('should throw if client not set', () => {
    expect(() => SIWEController._getClient()).toThrow('SIWEController client not set')
  })

  it('should set the SIWE client and update status to READY', () => {
    SIWEController.setSIWEClient(client)

    const state = SIWEController.state
    expect(state._client).toBe(client)
    expect(state.status).toBe('ready')
  })

  it('should set nonce and update status', () => {
    SIWEController.setNonce('mock-nonce')

    const state = SIWEController.state
    expect(state.nonce).toBe('mock-nonce')
  })

  it('should set status', () => {
    SIWEController.setStatus('success')

    const state = SIWEController.state
    expect(state.status).toBe('success')
  })

  it('should set message', () => {
    SIWEController.setMessage('mock-message')

    const state = SIWEController.state
    expect(state.message).toBe('mock-message')
  })

  it('should set session', () => {
    SIWEController.setSession(session)

    const state = SIWEController.state
    expect(state.session).toEqual(session)
  })
})
