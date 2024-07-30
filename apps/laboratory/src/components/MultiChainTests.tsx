import * as React from 'react'
import { useWeb3ModalState } from '@web3modal/base/react'
import { WagmiTests } from './Wagmi/WagmiTests'
import { SolanaTests } from './Solana/SolanaTests'

export function MultiChainTests() {
  const { activeChain } = useWeb3ModalState()

  return (
    <>
      {activeChain === 'evm' ? <WagmiTests /> : null}
      {activeChain === 'solana' ? <SolanaTests /> : null}
    </>
  )
}
