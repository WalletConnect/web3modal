import { describe, expect, it } from 'vitest'
import type { ConnectionControllerClient } from '../../index.js'
import { ConnectionController } from '../../index.js'

// -- Setup --------------------------------------------------------------------
const walletConnectUri = 'wc://uri?=123'
const externalId = 'coinbaseWallet'
const type = 'AUTH'

const client: ConnectionControllerClient = {
  connectWalletConnect: async onUri => {
    onUri(walletConnectUri)
    await Promise.resolve()
  },
  disconnect: async () => Promise.resolve(),
  signMessage: async (message: string) => Promise.resolve(message),
  connectExternal: async _id => Promise.resolve(),
  checkInstalled: _id => true
}

const partialClient: ConnectionControllerClient = {
  connectWalletConnect: async () => Promise.resolve(),
  disconnect: async () => Promise.resolve(),
  signMessage: async (message: string) => Promise.resolve(message)
}

// -- Tests --------------------------------------------------------------------
describe('ConnectionController', () => {
  it('should throw if client not set', () => {
    expect(ConnectionController._getClient).toThrow('ConnectionController client not set')
  })

  it('should have valid default state', () => {
    ConnectionController.setClient(client)

    expect(ConnectionController.state).toEqual({
      wcError: false,
      buffering: false,
      _client: ConnectionController._getClient()
    })
  })

  it('should update state correctly on disconnect()', async () => {
    await ConnectionController.disconnect()
    expect(ConnectionController.state.wcUri).toEqual(undefined)
    expect(ConnectionController.state.wcPairingExpiry).toEqual(undefined)
    expect(ConnectionController.state.wcPromise).toEqual(undefined)
  })

  it('should not throw on connectWalletConnect()', () => {
    ConnectionController.connectWalletConnect()
  })

  it('should not throw on connectExternal()', async () => {
    await ConnectionController.connectExternal({ id: externalId, type })
  })

  it('should not throw on checkInstalled()', () => {
    ConnectionController.checkInstalled([externalId])
  })

  it('should not throw on checkInstalled() without ids', () => {
    ConnectionController.checkInstalled()
  })

  it('should not throw when optional methods are undefined', async () => {
    ConnectionController.setClient(partialClient)
    await ConnectionController.connectExternal({ id: externalId, type })
    ConnectionController.checkInstalled([externalId])
  })

  it('should update state correctly on resetWcConnection()', () => {
    ConnectionController.resetWcConnection()
    expect(ConnectionController.state.wcUri).toEqual(undefined)
    expect(ConnectionController.state.wcPairingExpiry).toEqual(undefined)
    expect(ConnectionController.state.wcPromise).toEqual(undefined)
  })
})
