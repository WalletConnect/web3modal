import { PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'
import base58 from 'bs58'

// eslint-disable-next-line @typescript-eslint/require-await
export async function verifySignature({
  address,
  message,
  signature
}: {
  address: string
  message: string
  signature: string
}) {
  try {
    const publicKeyBytes = base58.decode(address)
    const publicKey = new PublicKey(publicKeyBytes)

    const isValid = nacl.sign.detached.verify(
      Buffer.from(message),
      base58.decode(signature),
      publicKey.toBuffer()
    )

    return isValid
  } catch (error) {
    return false
  }
}
