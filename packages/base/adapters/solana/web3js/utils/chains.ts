import { ConstantsUtil } from '@web3modal/common'

export const solana = {
  chainId: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  name: 'Solana',
  currency: 'SOL',
  explorerUrl: 'https://solscan.io',
  rpcUrl: 'https://rpc.walletconnect.com/v1',
  chain: ConstantsUtil.CHAIN.SOLANA
}

export const solanaTestnet = {
  chainId: '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
  name: 'Solana Testnet',
  currency: 'SOL',
  explorerUrl: 'https://explorer.solana.com/?cluster=testnet',
  rpcUrl: 'https://rpc.walletconnect.org/v1',
  chain: ConstantsUtil.CHAIN.SOLANA
}

export const solanaDevnet = {
  chainId: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  name: 'Solana Devnet',
  currency: 'SOL',
  explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
  rpcUrl: 'https://rpc.walletconnect.org/v1',
  chain: ConstantsUtil.CHAIN.SOLANA
}
