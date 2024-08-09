import { getCsrfToken, signIn, signOut, getSession } from 'next-auth/react'
import type { SIWSVerifyMessageArgs, SIWSCreateMessageArgs, SIWSSession } from '@web3modal/siws'
import { createSIWSConfig, formatMessage } from '@web3modal/siws'
import { SolanaConstantsUtil } from './SolanaConstants'

export const siwsConfig = createSIWSConfig({
  signOutOnAccountChange: true,
  signOutOnNetworkChange: true,
  // We don't require any async action to populate params but other apps might
  // eslint-disable-next-line @typescript-eslint/require-await
  getMessageParams: async () => ({
    domain: window.location.host,
    uri: window.location.origin,
    chains: SolanaConstantsUtil.chains.map(chain => chain.chainId),
    statement: 'Please sign with your account',
    iat: new Date().toISOString()
  }),

  createMessage: ({ address, ...args }: SIWSCreateMessageArgs) =>
    formatMessage({ ...args, address }),

  getNonce: async () => {
    const nonce = await getCsrfToken()
    if (!nonce) {
      throw new Error('Failed to get nonce!')
    }

    return nonce
  },
  getSession: async () => {
    const session = await getSession()
    if (!session) {
      throw new Error('Failed to get session!')
    }

    const { address, chainId } = session as unknown as SIWSSession

    return { address, chainId }
  },
  verifyMessage: async ({ message, signature, cacao }: SIWSVerifyMessageArgs) => {
    try {
      /*
       * Signed Cacao (CAIP-74) will be available for further validations if the wallet supports caip-222 signing
       * When personal_sign fallback is used, cacao will be undefined
       */
      if (cacao) {
        // Do something
      }

      const response = await signIn('credentials', {
        message,
        redirect: false,
        signature,
        callbackUrl: '/protected'
      })

      return Boolean(response?.ok)
    } catch (error) {
      return false
    }
  },
  signOut: async () => {
    try {
      await signOut({
        redirect: false
      })

      return true
    } catch (error) {
      return false
    }
  }
})
