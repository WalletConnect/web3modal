'use client'

import * as React from 'react'

import { Web3ModalInfo } from './Web3ModalInfo'
import { useSiweSession } from '@web3modal/siwe'

export function AppKitAuthInfo() {
  const { session, status } = useSiweSession()

  return (
    <Web3ModalInfo
      address={session?.address}
      chainId={session?.chainId}
      heading={`SIWE status: ${status}`}
    />
  )
}
