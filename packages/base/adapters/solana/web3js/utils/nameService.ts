import { PublicKey } from '@solana/web3.js'

import type { Schema } from 'borsh'

export class NameRegistry {
  public parentName: PublicKey
  public owner: PublicKey
  public class: PublicKey
  public data: Buffer | undefined

  public constructor(obj: { parentName: Uint8Array; owner: Uint8Array; class: Uint8Array }) {
    this.parentName = new PublicKey(obj.parentName)
    this.owner = new PublicKey(obj.owner)
    this.class = new PublicKey(obj.class)
  }

  public static schema: Schema = new Map([
    [
      NameRegistry,
      {
        kind: 'struct',
        fields: [
          ['parentName', [32]],
          ['owner', [32]],
          ['class', [32]]
        ]
      }
    ]
  ])
}
