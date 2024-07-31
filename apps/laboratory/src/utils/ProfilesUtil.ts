import {
  appKitAuthSignOut,
  authenticate,
  createSIWEConfig,
  formatMessage,
  getAppKitAuthSession,
  getNonce,
  type SIWECreateMessageArgs,
  type SIWESession,
  type SIWEVerifyMessageArgs
} from '@web3modal/siwe'

import { type Config, disconnect } from '@wagmi/core'
import { ProfileStore } from './ProfileStoreUtil'

const queryParams = `projectId=24970167f11c121f6eb40b558edb9691&st=w3m&sv=5.0.0`

const devProfileApiUrl = 'https://api-web3modal-auth-staging.walletconnect-v1-bridge.workers.dev'

export async function addCurrentAccountToProfile() {
  try {
    const res = await fetch(`${devProfileApiUrl}/profiles/v1/add-account?${queryParams}`, {
      method: 'POST',
      body: null,
      credentials: 'include'
    })

    if (!res.ok) {
      return undefined
    }

    const accountAddedToProfileRes = await res.json()

    return accountAddedToProfileRes
  } catch (error) {
    throw new Error('Failed to add account to profile', {
      cause: error
    })
  }
}

export async function getProfile() {
  try {
    const res = await fetch(`${devProfileApiUrl}/profiles/v1?${queryParams}`, {
      method: 'GET',
      credentials: 'include'
    })

    if (!res.ok) {
      return undefined
    }

    const profile = await res.json()

    return profile
  } catch (error) {
    throw new Error('Failed to fetch profile', {
      cause: error
    })
  }
}

export async function unlinkAccountFromProfile(accountUuid: string) {
  try {
    const res = await fetch(`${devProfileApiUrl}/profiles/v1/${accountUuid}?${queryParams}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    return { success: res.ok && res.status === 204 }
  } catch (error) {
    throw new Error('Failed to unlink account from profile', {
      cause: error
    })
  }
}

export async function deleteProfile() {
  try {
    const res = await fetch(`${devProfileApiUrl}/profiles/v1?${queryParams}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    return { success: res.ok && res.status === 204 }
  } catch (error) {
    throw new Error('Failed to delete profile', {
      cause: error
    })
  }
}

export async function updateMainAccount(accountUuid: string) {
  try {
    const res = await fetch(
      `${devProfileApiUrl}/profiles/v1/main-account/${accountUuid}?${queryParams}`,
      {
        method: 'PATCH',
        credentials: 'include'
      }
    )

    return { success: res.ok && res.status === 204 }
  } catch (error) {
    throw new Error('Failed to update main account', {
      cause: error
    })
  }
}

export function siweProfilesConfig(wagmiConfig: Config) {
  return createSIWEConfig({
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
        const { token } = await authenticate({ message, signature, clientId })
        await addCurrentAccountToProfile()

        return Boolean(token)
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
    },
    onSignIn: () => {
      Promise.all([
        disconnect(wagmiConfig),
        appKitAuthSignOut(),
        getProfile().then(profile => {
          ProfileStore.setProfile(profile)
        })
      ])
    }
  })
}
