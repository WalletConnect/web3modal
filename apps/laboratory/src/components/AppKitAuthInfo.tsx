'use client'

import * as React from 'react'

import { AppKitInfo } from './AppKitInfo'
import { useSiweSession } from '@reown/appkit-siwe'

export function AppKitAuthInfo() {
  const { session, status } = useSiweSession()

  return (
    <AppKitInfo
      address={session?.address}
      chainId={session?.chainId}
      heading={`SIWE status: ${status}`}
    />
  )
}
