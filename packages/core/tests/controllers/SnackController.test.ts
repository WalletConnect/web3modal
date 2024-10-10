import { describe, expect, it } from 'vitest'
import { SnackController } from '../../exports/index.js'

// -- Tests --------------------------------------------------------------------
describe('SnackController', () => {
  it('should have valid default state', () => {
    expect(SnackController.state).toEqual({
      durationMs: 2500,
      message: '',
      variant: 'success',
      open: false
    })
  })

  it('should update state correctly on showSuccess()', () => {
    SnackController.showSuccess('Success Msg')
    expect(SnackController.state).toEqual({
      durationMs: 2500,
      message: 'Success Msg',
      variant: 'success',
      open: true
    })
  })

  it('should update state correctly on hide()', () => {
    SnackController.hide()
    expect(SnackController.state).toEqual({
      durationMs: 2500,
      message: 'Success Msg',
      variant: 'success',
      open: false
    })
  })

  it('should update state correctly on showError()', () => {
    SnackController.showError('Error Msg')
    expect(SnackController.state).toEqual({
      durationMs: 2500,
      message: 'Error Msg',
      variant: 'error',
      open: true
    })
  })
})
