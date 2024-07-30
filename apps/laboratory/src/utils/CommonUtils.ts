import bs58 from 'bs58'

export function parseJSON(str: string) {
  try {
    return JSON.parse(str)
  } catch (error) {
    return { error: `Invalid JSON: ${error}` }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bigIntReplacer(_key: string, value: any) {
  if (typeof value === 'bigint') {
    return `0x${value.toString(16)}`
  }

  return value
}

export function encodeSecp256k1PublicKeyToDID(publicKey: string) {
  // Remove '0x' prefix if present
  const modifiedPublicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey

  // Convert publicKey to Buffer
  const publicKeyBuffer = Buffer.from(modifiedPublicKey, 'hex')

  // Base58 encode the address
  const encodedPublicKey = bs58.encode(publicKeyBuffer)

  // Construct the did:key
  return `did:key:zQ3s${encodedPublicKey}`
}

export function encodePublicKeyToDID(publicKey: string, keyType: string): string {
  // Define the key type to DID prefix mapping
  const keyTypeToDIDPrefix: Record<string, string> = {
    secp256k1: 'did:key:zQ3s',
    secp256r1: 'did:key:zDn',
    ed25519: 'did:key:z6Mk',
    x25519: 'did:key:z6LS',
    rsa: 'did:key:z4MX',
    'p-384': 'did:key:z82L',
    'p-521': 'did:key:z2J9'
  }

  // Check if the key type is supported
  if (!(keyType in keyTypeToDIDPrefix)) {
    throw new Error('Unsupported key type.')
  }

  // Remove '0x' prefix if present
  const modifiedPublicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey

  // Convert publicKey to Buffer
  const publicKeyBuffer = Buffer.from(modifiedPublicKey, 'hex')

  // Base58 encode the public key
  const encodedPublicKey = bs58.encode(publicKeyBuffer)

  // Get the DID prefix for the key type
  const didPrefix = keyTypeToDIDPrefix[keyType]

  // Construct the did:key
  return `${didPrefix}${encodedPublicKey}`
}

export function decodeUncompressedPublicKey(uncompressedPublicKey: string): `0x${string}` {
  const uncompressedPublicKeyBuffer = Buffer.from(uncompressedPublicKey, 'base64')

  if (uncompressedPublicKeyBuffer.length !== 65) {
    throw new Error('Invalid uncompressed public key length')
  }

  const header = uncompressedPublicKeyBuffer[0]
  if (header !== 0x04) {
    throw new Error('Invalid uncompressed public key header')
  }

  const publicKey = uncompressedPublicKeyBuffer.toString('hex')

  return `0x${publicKey}`
}

export function hexStringToBase64(hexString: string): string {
  // Remove the `0x` prefix if it exists
  const cleanedHexString = hexString.replace(/^0x/u, '')

  // Convert the hex string to a Buffer
  const buffer = Buffer.from(cleanedHexString, 'hex')

  // Convert the Buffer to a base64 string
  return buffer.toString('base64')
}
