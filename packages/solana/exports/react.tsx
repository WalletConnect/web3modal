'use client'

import { useSnapshot } from 'valtio'
import { ConstantsUtil } from '@web3modal/scaffold-utils'
import { getWeb3Modal } from '@web3modal/base/utils/library/react'
import { AppKit } from '@web3modal/base'
import type { AppKitOptions } from '@web3modal/base'
import { SolanaWeb3JsClient } from '@web3modal/base/adapters/solana/web3js'
import { SolStoreUtil } from '@web3modal/scaffold-utils/solana'
import {
  type Chain,
  type Connection,
  type Provider,
  type ProviderType,
  type BaseWalletAdapter
} from '@web3modal/base/adapters/solana/web3js'

// -- Configs -----------------------------------------------------------
export { defaultSolanaConfig } from '@web3modal/base/adapters/solana/web3js'

// -- Setup -------------------------------------------------------------
let appkit: AppKit | undefined = undefined
let solanaAdapter: SolanaWeb3JsClient | undefined = undefined

type SolanaAppKitOptions = Omit<AppKitOptions, 'adapters' | 'sdkType' | 'sdkVersion'> & {
  solanaConfig: ProviderType
  chains: Chain[]
  wallets: BaseWalletAdapter[]
}

export function createWeb3Modal(options: SolanaAppKitOptions) {
  solanaAdapter = new SolanaWeb3JsClient({
    solanaConfig: options.solanaConfig,
    chains: options.chains,
    wallets: options.wallets,
    projectId: options.projectId
  })
  appkit = new AppKit({
    ...options,
    adapters: [solanaAdapter],
    sdkType: 'w3m',
    sdkVersion: `react-solana-${ConstantsUtil.VERSION}`
  })
  getWeb3Modal(appkit)

  return appkit
}

// -- Hooks -------------------------------------------------------------------
export function useWeb3ModalProvider(): {
  walletProvider: Provider | undefined
  connection: Connection | undefined
} {
  const state = useSnapshot(SolStoreUtil.state)

  return {
    walletProvider: state.provider,
    connection: state.connection
  } as {
    walletProvider: Provider | undefined
    connection: Connection | undefined
  }
}

export function useDisconnect() {
  function disconnect() {
    solanaAdapter?.disconnect()
  }

  return {
    disconnect
  }
}

export function useWeb3ModalAccount() {
  const { address, isConnected, chainId, currentChain } = useSnapshot(SolStoreUtil.state)

  return {
    address,
    isConnected,
    currentChain,
    chainId
  }
}

export {
  useWeb3ModalTheme,
  useWeb3Modal,
  useWeb3ModalState,
  useWeb3ModalEvents
} from '@web3modal/base/utils/library/react'
