import { W3mFrameProvider } from '@web3modal/wallet'

import type {
  Connection as SolanaConnection,
  PublicKey,
  Transaction as SolanaWeb3Transaction,
  TransactionSignature,
  VersionedTransaction,
  ConfirmOptions,
  Signer
} from '@solana/web3.js'
import type { SendTransactionOptions } from '@solana/wallet-adapter-base'

export type Connection = SolanaConnection

export interface ISolConfig {
  providers: ProviderType
  defaultChain?: number
  SSR?: boolean
}

export type ProviderType = {
  injected?: Provider
  coinbase?: Provider
  email?: boolean
  EIP6963?: boolean
  metadata: Metadata
}

export interface RequestArguments {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

export interface Provider {
  isConnected: () => boolean
  publicKey: PublicKey
  name: string
  on: <T>(event: string, listener: (data: T) => void) => void
  wallet: Provider
  removeListener: <T>(event: string, listener: (data: T) => void) => void
  emit: (event: string) => void
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  request: <T>(config: { method: string; params?: object }) => Promise<T>
  signAllTransactions: (transactions: SolanaWeb3Transaction[]) => Promise<SolanaWeb3Transaction[]>
  signAndSendAllTransactions: (
    transactions: SolanaWeb3Transaction[]
  ) => Promise<TransactionSignature[]>
  signAndSendTransaction: (
    transaction: SolanaWeb3Transaction | VersionedTransaction,
    signers: Signer[],
    confirmOptions?: ConfirmOptions
  ) => Promise<TransactionSignature>
  signMessage: (message: Uint8Array) => Promise<Uint8Array> | Promise<{ signature: Uint8Array }>
  signTransaction: (transaction: SolanaWeb3Transaction | VersionedTransaction) => Promise<{
    signatures: { signature: Uint8Array }[]
  }>
  sendTransaction: (
    transaction: SolanaWeb3Transaction | VersionedTransaction,
    connection: Connection,
    options?: SendTransactionOptions
  ) => Promise<TransactionSignature>
  sendAndConfirm: (
    transaction: SolanaWeb3Transaction | VersionedTransaction,
    connection: Connection,
    options?: SendTransactionOptions
  ) => Promise<TransactionSignature>
}

export type Metadata = {
  name: string
  description: string
  url: string
  icons: string[]
}

export type CombinedProvider = W3mFrameProvider & Provider

export type Chain = {
  rpcUrl: string
  explorerUrl: string
  currency: string
  name: string
  chainId: string
}

// eslint-disable-next-line no-shadow
export enum Tag {
  Uninitialized = 0,
  ActiveOffer = 1,
  CancelledOffer = 2,
  AcceptedOffer = 3,
  FavouriteDomain = 4,
  FixedPriceOffer = 5,
  AcceptedFixedPriceOffer = 6,
  CancelledFixedPriceOffer = 7
}

export interface Status {
  Ok: null
}

export interface Meta {
  err: null
  fee: number
  innerInstructions: TransactionInstruction[]
  logMessages: string[]
  postBalances: number[]
  postTokenBalances: number[]
  preBalances: number[]
  preTokenBalances: number[]
  rewards: null
  status: Status
}

interface TransactionInstruction {
  accounts: number[]
  data: string
  programIdIndex: number
}

export interface TransactionElement {
  meta: Meta
  transaction: TransactionData
}

export interface TransactionData {
  message: Message
  signatures: string[]
}

export interface Transaction {
  message: Message
  signatures: string[]
}

export interface TransactionResult {
  meta: Meta
  slot: number
  transaction: Transaction
}

export interface Message {
  accountKeys: string[]
  header: Header
  instructions: Instruction[]
  recentBlockhash: string
}

export interface Header {
  numReadonlySignedAccounts: number
  numReadonlyUnsignedAccounts: number
  numRequiredSignatures: number
}

export interface Instruction {
  accounts: number[]
  data: string
  programIdIndex: number
}

export interface BlockResult {
  blockHeight: number
  blockTime: null
  blockhash: string
  parentSlot: number
  previousBlockhash: string
  transactions: TransactionElement[]
}

export interface AccountInfo {
  data: string[]
  executable: boolean
  lamports: number
  owner: string
  rentEpoch: number
}

export type FilterObject =
  | {
      memcmp: {
        offset: number
        bytes: string
        encoding?: string
      }
    }
  | { dataSize: number }

export interface TransactionInstructionRq {
  programId: string
  data: string
  keys: {
    isSigner: boolean
    isWritable: boolean
    pubkey: string
  }[]
}

interface VersionedInstractionRequest {
  data: string
  programIdIndex: number
  accountKeyIndexes: number[]
}

/**
 * Request methods to the solana RPC.
 * @see {@link https://solana.com/docs/rpc/http}
 */
export interface RequestMethods {
  solana_signMessage: {
    params: {
      message: string
      pubkey: string
    }
    returns: {
      signature: string
    }
  }
  solana_signTransaction: {
    params: {
      feePayer: string
      instructions: TransactionInstructionRq[] | VersionedInstractionRequest[]
      recentBlockhash: string
      signatures?: {
        pubkey: string
        signature: string
      }[]
    }
    returns: {
      signature: string
    }
  }
  signMessage: {
    params: {
      message: Uint8Array
      format: string
    }
    returns: {
      signature: string
    } | null
  }

  signTransaction: {
    params: {
      // Serialized transaction
      message: string
    }
    returns: {
      serialize: () => string
    } | null
  }
}

export interface TransactionArgs {
  transfer: {
    params: {
      to: string
      amountInLamports: number
      feePayer: 'from' | 'to'
    }
  }
  program: {
    params: {
      programId: string
      isWritableSender: boolean
      data: Record<string, unknown>
    }
  }
}

export type TransactionType = keyof TransactionArgs

export interface ClusterRequestMethods {
  sendTransaction: {
    // Signed, serialized transaction
    params: string[]
    returns: string
  }

  getFeeForMessage: {
    params: [string]
    returns: number
  }

  getBlock: {
    params: [number]
    returns: BlockResult | null
  }

  getBalance: {
    params: [string, { commitment: 'processed' | 'finalized' }]
    returns: {
      value: number
    }
  }

  getProgramAccounts: {
    params: [
      string,
      {
        filters?: FilterObject[]
        encoding: 'base58' | 'base64' | 'jsonParsed'
        withContext?: boolean
      }
    ]
    returns: {
      value: { account: AccountInfo }[]
    }
  }

  getAccountInfo: {
    params: [string, { encoding: 'base58' | 'base64' | 'jsonParsed' }] | [string]
    returns?: {
      value: AccountInfo | null
    }
  }

  getTransaction: {
    params: [
      string,
      {
        encoding: 'base58' | 'base64' | 'jsonParsed'
        commitment: 'confirmed' | 'finalized'
      }
    ]
    returns: TransactionResult | null
  }

  getLatestBlockhash: {
    params: [{ commitment?: string }]
    returns: {
      value: {
        blockhash: string
      }
    }
  }
}

export interface ClusterSubscribeRequestMethods {
  signatureSubscribe: {
    params: string[]
    returns: Transaction
  }
  signatureUnsubscribe: {
    params: number[]
    returns: unknown
  }
}
