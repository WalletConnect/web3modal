import type {
  BaseSignInMessageSignerWalletAdapter,
  BaseWalletAdapter
} from '@solana/wallet-adapter-base'
import type { SignatureType } from '@learnweb3dao/siwx-common'

export type ExtendedBaseWalletAdapter = BaseWalletAdapter &
  BaseSignInMessageSignerWalletAdapter & {
    isAnnounced: boolean
  }

export interface SIWSSession {
  address: string
  chainId: string
}

interface CacaoHeader {
  t: 'caip122'
}

export interface SIWSCreateMessageArgs {
  chainId: string
  domain: string
  nonce: string
  uri: string
  address: string
  version: '1'
  type?: SignatureType
  nbf?: string
  exp?: string
  statement?: string
  requestId?: string
  resources?: string[]
  expiry?: number
  iat?: string
}

export type SIWSMessageArgs = {
  chains: string[]
  methods?: string[]
} & Omit<SIWSCreateMessageArgs, 'address' | 'chainId' | 'nonce' | 'version'>
// Signed Cacao (CAIP-74)
interface CacaoPayload {
  domain: string
  aud: string
  nonce: string
  iss: string
  version?: string
  iat?: string
  nbf?: string
  exp?: string
  statement?: string
  requestId?: string
  resources?: string[]
  type?: string
}

interface Cacao {
  h: CacaoHeader
  p: CacaoPayload
  s: {
    t: 'eip191' | 'eip1271'
    s: string
    m?: string
  }
}

export interface SIWSVerifyMessageArgs {
  message: string
  signature: string
  cacao?: Cacao
}

export interface SIWSClientMethods {
  getNonce: (address?: string) => Promise<string>
  getMessageParams: () => Promise<SIWSMessageArgs>
  createMessage: (args: SIWSCreateMessageArgs) => string
  verifyMessage: (args: SIWSVerifyMessageArgs) => Promise<boolean>
  getSession: () => Promise<SIWSSession | null>
  signOut: () => Promise<boolean>
  onSignIn?: (session?: SIWSSession) => void
  onSignOut?: () => void
}

export interface SIWSConfig extends SIWSClientMethods {
  // Defaults to true
  enabled?: boolean
  // In milliseconds, defaults to 5 minutes
  nonceRefetchIntervalMs?: number
  // In milliseconds, defaults to 5 minutes
  sessionRefetchIntervalMs?: number
  // Defaults to true
  signOutOnDisconnect?: boolean
  // Defaults to true
  signOutOnAccountChange?: boolean
  // Defaults to true
  signOutOnNetworkChange?: boolean
}
