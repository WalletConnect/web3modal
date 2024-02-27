/* eslint-disable no-console */
import { nanoid } from 'nanoid'
import { openDB, type DBSchema } from 'idb'

const STORE_KEY_PRIVATE_KEY = 'STORE_KEY_PRIVATE_KEY'
const STORE_KEY_PUBLIC_JWK = 'STORE_KEY_PUBLIC_JWK'
const ALGO_NAME = 'ECDSA'
const ALGO_CURVE = 'P-256'

const EC_GEN_PARAMS: EcKeyGenParams = {
  name: ALGO_NAME,
  namedCurve: ALGO_CURVE
}

interface KeysIndexedDBStore extends DBSchema {
  keypairs:
    | {
        key: typeof STORE_KEY_PRIVATE_KEY
        value: CryptoKey
      }
    | {
        key: typeof STORE_KEY_PUBLIC_JWK
        value: JsonWebKey
      }
}
export const CryptoUtil = {
  async getIndexedDB() {
    return openDB<KeysIndexedDBStore>('web3modal-indexedDB', 1, {
      upgrade(database) {
        database.createObjectStore('keypairs')
      }
    })
  },

  async generateMagicKP() {
    const db = await this.getIndexedDB()
    const { subtle } = window.crypto
    // Export the public key, while keeping private key non-extractable
    const kp = await subtle.generateKey(EC_GEN_PARAMS, false, ['sign'])

    const jwkPublicKey = await subtle.exportKey('jwk', kp.publicKey)

    await db.put('keypairs', kp.privateKey, STORE_KEY_PRIVATE_KEY)
    await db.put('keypairs', jwkPublicKey, STORE_KEY_PUBLIC_JWK)
  },

  async getOrCreateMagicPublicKey() {
    try {
      const db = await this.getIndexedDB()
      const storedKey = await db.get('keypairs', STORE_KEY_PUBLIC_JWK)
      if (storedKey) {
        return storedKey
      }

      await this.generateMagicKP()

      return db.get('keypairs', STORE_KEY_PUBLIC_JWK) as JsonWebKey
    } catch (e) {
      console.error('getPublicKey error', e)

      return null
    }
  },

  async createJwt() {
    const publicJwk = await this.getOrCreateMagicPublicKey()
    if (!publicJwk) {
      console.info('unable to create public key or webcrypto is unsupported')

      return undefined
    }

    const { subtle } = window.crypto

    const db = await this.getIndexedDB()

    const privateJwk = (await db.get('keypairs', STORE_KEY_PRIVATE_KEY)) as CryptoKey | undefined
    if (!privateJwk || !subtle) {
      console.info('unable to find private key or webcrypto unsupported')

      return undefined
    }

    const claims = {
      iat: Math.floor(new Date().getTime() / 1000),
      jti: nanoid()
    }

    const headers = {
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk: publicJwk
    }

    const jws = {
      protected: this.strToUrlBase64(JSON.stringify(headers)),
      claims: this.strToUrlBase64(JSON.stringify(claims))
    }
    const data = this.strToUint8(`${jws.protected}.${jws.claims}`)
    const sigType = { name: ALGO_NAME, hash: { name: 'SHA-256' } }

    const sig = this.uint8ToUrlBase64(new Uint8Array(await subtle.sign(sigType, privateJwk, data)))

    return `${jws.protected}.${jws.claims}.${sig}`
  },
  strToUrlBase64(str: string) {
    return this.binToUrlBase64(this.utf8ToBinaryString(str))
  },

  strToUint8(str: string) {
    return new TextEncoder().encode(str)
  },

  binToUrlBase64(bin: string) {
    return Buffer.from(bin, 'latin1')
      .toString('base64')
      .replace(/\+/gu, '-')
      .replace(/\//gu, '_')
      .replace(/[=]+/gu, '')
  },

  utf8ToBinaryString(str: string) {
    const escstr = encodeURIComponent(str)

    return escstr.replace(/%(?:[0-9A-F]{2})/gu, (_, p1) => String.fromCharCode(parseInt(p1, 16)))
  },

  uint8ToUrlBase64(uint8: Uint8Array) {
    let bin = ''
    uint8.forEach(code => {
      bin += String.fromCharCode(code)
    })

    return this.binToUrlBase64(bin)
  }
}
