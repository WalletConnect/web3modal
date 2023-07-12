import { describe, expect, it } from 'vitest'
import { AccountController } from '../../index'

// -- Setup --------------------------------------------------------------------
const address = 'eip155:1:0x123'
const balance = '0.100'
const profileName = 'john.eth'
const profileImage = 'https://ipfs.com/0x123.png'

// -- Tests --------------------------------------------------------------------
describe('ModalController', () => {
  it('should have valid default state', () => {
    expect(AccountController.state).toEqual({ isConnected: false })
  })

  it('should update state correctly on setIsConnected()', () => {
    AccountController.setIsConnected(true)
    expect(AccountController.state.isConnected).toEqual(true)
  })

  it('should update state correctly on setAddress()', () => {
    AccountController.setAddress(address)
    expect(AccountController.state.address).toEqual(address)
  })

  it('should update state correctly on setBalance()', () => {
    AccountController.setBalance(balance)
    expect(AccountController.state.balance).toEqual(balance)
  })

  it('should update state correctly on setProfileName()', () => {
    AccountController.setProfileName(profileName)
    expect(AccountController.state.profileName).toEqual(profileName)
  })

  it('should update state correctly on setProfileImage()', () => {
    AccountController.setProfileImage(profileImage)
    expect(AccountController.state.profileImage).toEqual(profileImage)
  })
})
