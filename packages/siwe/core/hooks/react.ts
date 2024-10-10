import { OptionsController } from '@reown/appkit-core'
import { useEffect, useState } from 'react'
import { SIWEController } from '../controller/SIWEController.js'

export function useSiweSession() {
  if (
    SIWEController.state.status !== 'uninitialized' &&
    !SIWEController.state._client &&
    !OptionsController.state.enableAuth
  ) {
    throw new Error(
      'Please provide a "siweConfig" or enable AppKit Auth before using "useSiweSession" hook'
    )
  }
  const [session, setSession] = useState(SIWEController.state.session)
  const [status, setStatus] = useState(SIWEController.state.status)

  useEffect(() => {
    const unsubscribe = SIWEController.subscribeKey('session', newSession => {
      if (!newSession?.address || !newSession?.chainId) {
        setSession(undefined)
      }
      setSession(newSession)
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    const unsubscribe = SIWEController.subscribeKey('status', newStatus => {
      setStatus(newStatus)
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  return {
    session,
    status,
    getRemoteSession: SIWEController.getSession
  }
}
