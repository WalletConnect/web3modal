import { describe, expect, it } from 'vitest'
import { RouterController } from '../../exports/index.js'
import { ConstantsUtil } from '@rerock/common'

// -- Tests --------------------------------------------------------------------
describe('RouterController', () => {
  it('should have valid default state', () => {
    expect(RouterController.state).toEqual({
      view: 'Connect',
      history: ['Connect'],
      transactionStack: []
    })
  })

  it('should update state correctly on push()', () => {
    RouterController.push('Account')
    expect(RouterController.state).toEqual({
      view: 'Account',
      history: ['Connect', 'Account'],
      transactionStack: []
    })
  })

  it('should not update state when push() is called with the same view', () => {
    RouterController.push('Account')
    expect(RouterController.state).toEqual({
      view: 'Account',
      history: ['Connect', 'Account'],
      transactionStack: []
    })
  })

  it('should update state correctly on goBack()', () => {
    RouterController.goBack()
    expect(RouterController.state).toEqual({
      view: 'Connect',
      history: ['Connect'],
      transactionStack: []
    })
  })

  it('should not update state when goBack() is called with only one view in history', () => {
    RouterController.goBack()
    expect(RouterController.state).toEqual({
      view: 'Connect',
      history: ['Connect'],
      transactionStack: []
    })
  })

  it('should update state correctly on reset()', () => {
    RouterController.reset('Account')
    expect(RouterController.state).toEqual({
      view: 'Account',
      history: ['Account'],
      transactionStack: []
    })
  })

  it('should update state correctly on replace()', () => {
    RouterController.push('Connect')
    RouterController.replace('Networks')
    expect(RouterController.state).toEqual({
      view: 'Networks',
      history: ['Account', 'Networks'],
      transactionStack: []
    })
  })

  it('should update state correctly on push() with data', () => {
    RouterController.push('ConnectingExternal', {
      connector: { id: 'test', type: 'WALLET_CONNECT', chain: ConstantsUtil.CHAIN.EVM }
    })
    expect(RouterController.state).toEqual({
      view: 'ConnectingExternal',
      history: ['Account', 'Networks', 'ConnectingExternal'],
      data: {
        connector: { id: 'test', type: 'WALLET_CONNECT', chain: ConstantsUtil.CHAIN.EVM }
      },
      transactionStack: []
    })
  })
})
