import type { NextApiRequest, NextApiResponse } from 'next'
import nextAuth from 'next-auth'
import credentialsProvider from 'next-auth/providers/credentials'

import { getAddressFromMessage, getChainIdFromMessage } from '@web3modal/core'
import { verifySignature as verifySignatureETH } from '../../../utils/SignatureUtil'
import { verifySignature as verifySignatureSOL } from '@web3modal/siws'
import type { SIWESession } from '@web3modal/siwe'
import type { SIWSSession } from '@web3modal/siws'
import { type IVerifySignatureParams } from '../../../types/siwx'

type SIWXSession = SIWESession & SIWSSession

declare module 'next-auth' {
  interface Session extends SIWXSession {
    address: string
    chainId: string
  }
}
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

  // It's checking what method singIn use in uri headers
  const isSIWS = req.headers.referer?.includes('siws')

  const placeholder = isSIWS ? 'solana' : '0x0'
  const name = isSIWS ? 'Solana' : 'Ethereum'

  const providers = [
    credentialsProvider({
      name,
      credentials: {
        message: {
          label: 'Message',
          type: 'text',
          placeholder
        },
        signature: {
          label: 'Signature',
          type: 'text',
          placeholder
        }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message) {
            throw new Error('SiwxMessage is undefined')
          }
          const { message, signature } = credentials
          const address = getAddressFromMessage(message)
          const chainId = getChainIdFromMessage(message)

          // eslint-disable-next-line func-style
          const verifySignature = async (
            referer: string | undefined,
            params: IVerifySignatureParams
          ) =>
            referer?.includes('siws')
              ? await verifySignatureSOL(params)
              : await verifySignatureETH(params)

          const isValid = await verifySignature(req.headers.referer, {
            address,
            message,
            signature,
            chainId: Number(chainId.split(':')[1])
          })
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

  // Hide Sign-In with Ethereum or Solana from default sign page
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
          session.chainId = chainId
        }

        return session
      }
    }
  })
}
