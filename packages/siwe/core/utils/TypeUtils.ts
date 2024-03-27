export interface SIWESession {
  address: string
  chainId: number
}

interface CacaoHeader {
  t: 'caip122'
}

export interface SIWECreateMessageArgs {
  chainId: number
  domain: string
  nonce: string
  uri: string
  address: string
  version: '1'
  type?: CacaoHeader['t']
  nbf?: string
  exp?: string
  statement?: string
  requestId?: string
  resources?: string[]
  expiry?: number
}
export type SIWEMessageArgs = {
  chains: number[]
  methods?: string[]
} & Omit<SIWECreateMessageArgs, 'address' | 'chainId' | 'nonce' | 'version'>

export interface SIWEVerifyMessageArgs {
  message: string
  signature: string
}

export interface SIWEClientMethods {
  getNonce: (address?: string) => Promise<string>
  getMessageParams: () => Promise<SIWEMessageArgs>
  createMessage: (args: SIWECreateMessageArgs) => string
  verifyMessage: (args: SIWEVerifyMessageArgs) => Promise<boolean>
  getSession: () => Promise<SIWESession | null>
  signOut: () => Promise<boolean>
  onSignIn?: (session?: SIWESession) => void
  onSignOut?: () => void
}

export interface SIWEConfig extends SIWEClientMethods {
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
