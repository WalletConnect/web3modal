import type { SIWESession } from '@web3modal/siwe'
import type { NextApiRequest, NextApiResponse } from 'next'
import nextAuth from 'next-auth'
import credentialsProvider from 'next-auth/providers/credentials'
import { isValidEip191Signature, isValidEip1271Signature } from '@walletconnect/utils'

declare module 'next-auth' {
  interface Session extends SIWESession {
    address: string
    chainId: number
  }
}

const ETH_ADDRESS_PATTERN = /0x[a-fA-F0-9]{40}/u
const ETH_CHAIN_ID_IN_SIWE_PATTERN = /Chain ID: (?<temp1>\d+)/u

/*
 * For more information on each option (and a full list of options) go to
 * https://next-auth.js.org/configuration/options
 */
export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const nextAuthSecret = process.env['NEXTAUTH_SECRET']
  if (!nextAuthSecret) {
    throw new Error('NEXTAUTH_SECRET is not set')
  }
  const projectId = process.env['NEXT_PUBLIC_PROJECT_ID']
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_PROJECT_ID is not set')
  }

  const providers = [
    credentialsProvider({
      name: 'Ethereum',
      credentials: {
        message: {
          label: 'Message',
          type: 'text',
          placeholder: '0x0'
        },
        signature: {
          label: 'Signature',
          type: 'text',
          placeholder: '0x0'
        }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message) {
            throw new Error('SiweMessage is undefined')
          }
          const { message, signature } = credentials
          const address = message.match(ETH_ADDRESS_PATTERN)?.[0] || ''
          const chainId = `eip155:${
            credentials.message.match(ETH_CHAIN_ID_IN_SIWE_PATTERN)?.[1] || 1
          }`
          let isValid = isValidEip191Signature(address, message, signature)
          if (!isValid) {
            isValid = await isValidEip1271Signature(address, message, signature, chainId, projectId)
          }

          if (isValid) {
            return {
              id: `${chainId}:${address}`
            }
          }

          return null
        } catch (e) {
          return null
        }
      }
    })
  ]

  const isDefaultSigninPage = req.method === 'GET' && req.query?.['nextauth']?.includes('signin')

  // Hide Sign-In with Ethereum from default sign page
  if (isDefaultSigninPage) {
    providers.pop()
  }

  return await nextAuth(req, res, {
    // https://next-auth.js.org/configuration/providers/oauth
    secret: nextAuthSecret,
    providers,
    session: {
      strategy: 'jwt'
    },
    callbacks: {
      session({ session, token }) {
        if (!token.sub) {
          return session
        }

        const [, chainId, address] = token.sub.split(':')
        if (chainId && address) {
          session.address = address
          session.chainId = parseInt(chainId, 10)
        }

        return session
      }
    }
  })
}
