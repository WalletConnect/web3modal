/* eslint-disable no-console */
import { ConstantsUtil } from '@reown/appkit-common'
import { ApiController, OptionsController } from '@reown/appkit-core'
import { formatMessage } from '@walletconnect/utils'
import { AppKitSIWEClient } from '../../src/client.js'
import type { SIWECreateMessageArgs, SIWESession, SIWEVerifyMessageArgs } from './TypeUtils.js'

const headers = {
  ...ApiController._getApiHeaders(),
  'x-project-id': OptionsController.state.projectId
}
export async function getNonce() {
  try {
    const res = await fetch(`${ConstantsUtil.W3M_API_URL}/auth/v1/nonce`, {
      method: 'GET',
      headers,
      credentials: 'include'
    })

    if (!res.ok) {
      return undefined
    }

    const nonceRes = await res.json()

    return nonceRes
  } catch (error) {
    console.error(error)
    throw new Error('Failed to get nonce', {
      cause: error
    })
  }
}

export async function getAppKitAuthSession() {
  try {
    const res = await fetch(`${ConstantsUtil.W3M_API_URL}/auth/v1/me`, {
      method: 'GET',
      headers,
      credentials: 'include'
    })

    if (!res.ok) {
      return undefined
    }

    const sessionRes = await res.json()

    return sessionRes
  } catch (error) {
    console.error(error)
    throw new Error('Failed to get session', {
      cause: error
    })
  }
}

export async function authenticate(payload: {
  message: string
  signature: string
  clientId?: string | null
}) {
  try {
    const res = await fetch(`${ConstantsUtil.W3M_API_URL}/auth/v1/authenticate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      credentials: 'include'
    })

    if (!res.ok) {
      return undefined
    }

    return { success: res.status === 204 }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to authenticate', {
      cause: error
    })
  }
}

export async function updateUserMetadata(metadata: Record<string, unknown>) {
  try {
    const res = await fetch(`${ConstantsUtil.W3M_API_URL}/auth/v1/update-user-metadata`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ metadata }),
      credentials: 'include'
    })

    if (!res.ok) {
      return undefined
    }

    const updateUserRes = await res.json()

    return updateUserRes
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update user metadata', {
      cause: error
    })
  }
}

export async function appKitAuthSignOut() {
  try {
    const res = await fetch(`${ConstantsUtil.W3M_API_URL}/auth/v1/sign-out`, {
      method: 'POST',
      headers,
      credentials: 'include'
    })

    const signOutRes = await res.json()

    return signOutRes
  } catch (error) {
    console.error(error)
    throw new Error('Failed to sign out', {
      cause: error
    })
  }
}

export const appKitAuthConfig = new AppKitSIWEClient({
  signOutOnAccountChange: true,
  signOutOnNetworkChange: true,
  // We don't require any async action to populate params but other apps might
  // eslint-disable-next-line @typescript-eslint/require-await
  getMessageParams: async () => ({
    domain: window.location.host,
    uri: window.location.origin,
    statement: 'Please sign with your account',
    iat: new Date().toISOString()
  }),
  createMessage: ({ address, ...args }: SIWECreateMessageArgs) => {
    const message = formatMessage(args, address)

    return message
  },
  getNonce: async () => {
    const { nonce } = await getNonce()
    if (!nonce) {
      throw new Error('Failed to get nonce!')
    }

    return nonce
  },
  getSession: async () => {
    const session = await getAppKitAuthSession()
    if (!session) {
      return null
    }

    const { address, chainId } = session as unknown as SIWESession

    return { address, chainId }
  },
  verifyMessage: async ({ message, signature, cacao, clientId }: SIWEVerifyMessageArgs) => {
    try {
      /*
       * Signed Cacao (CAIP-74) will be available for further validations if the wallet supports caip-222 signing
       * When personal_sign fallback is used, cacao will be undefined
       */
      if (cacao) {
        // Do something
      }
      await authenticate({ message, signature, clientId })

      return true
    } catch (error) {
      return false
    }
  },
  signOut: async () => {
    try {
      await appKitAuthSignOut()

      return true
    } catch (error) {
      return false
    }
  }
})
