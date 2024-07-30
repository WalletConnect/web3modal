import { sha256 } from '@ethersproject/sha2'
import { Buffer } from 'buffer'
import { PublicKey } from '@solana/web3.js'

import { SolConstantsUtil } from './scaffold/index.js'

export function getHashedName(name: string): Buffer {
  const input = SolConstantsUtil.HASH_PREFIX + name
  const str = sha256(Buffer.from(input, 'utf8')).slice(2)

  return Buffer.from(str, 'hex')
}

if (typeof window !== 'undefined') {
  window.getHashedName = getHashedName
}

export async function getNameAccountKey(
  hashed_name: Buffer,
  nameClass?: PublicKey,
  nameParent?: PublicKey
): Promise<PublicKey> {
  const seeds = [hashed_name]

  if (nameClass) {
    seeds.push(nameClass.toBuffer())
  } else {
    seeds.push(Buffer.alloc(32))
  }

  if (nameParent) {
    seeds.push(nameParent.toBuffer())
  } else {
    seeds.push(Buffer.alloc(32))
  }

  const [nameAccountKey] = await PublicKey.findProgramAddress(
    seeds,
    SolConstantsUtil.NAME_PROGRAM_ID
  )

  return nameAccountKey
}
