import { isValidEip191Signature, isValidEip1271Signature } from '@walletconnect/utils'

export async function verifySignature({
  address,
  message,
  signature,
  chainId,
  projectId
}: {
  address: string
  message: string
  signature: string
  chainId: string
  projectId: string
}) {
  let isValid = isValidEip191Signature(address, message, signature)
  if (!isValid) {
    isValid = await isValidEip1271Signature(address, message, signature, chainId, projectId)
  }

  return isValid
}
