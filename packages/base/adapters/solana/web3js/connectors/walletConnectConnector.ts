import base58 from 'bs58'
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'

import { SolStoreUtil } from '../utils/scaffold/index.js'
import { UniversalProviderFactory } from './universalProvider.js'
import { BaseConnector } from './baseConnector.js'

import type { Signer } from '@solana/web3.js'
import type UniversalProvider from '@walletconnect/universal-provider'

import type { Connector } from './baseConnector.js'
import type { Chain } from '../utils/scaffold/SolanaTypesUtil.js'
import {
  getChainsFromChainId,
  getDefaultChainFromSession,
  type ChainIDType
} from '../utils/chainPath/index.js'

export interface WalletConnectAppMetadata {
  name: string
  description: string
  url: string
  icons: string[]
}

export class WalletConnectConnector extends BaseConnector implements Connector {
  id = 'WalletConnect'
  name = 'WalletConnect'
  ready = true
  chains: Chain[]

  protected provider: UniversalProvider | undefined
  protected qrcode: boolean

  public constructor({
    projectId,
    relayerRegion,
    metadata,
    qrcode,
    chains
  }: {
    projectId: string
    relayerRegion: string
    metadata: WalletConnectAppMetadata
    qrcode?: boolean
    chains: Chain[]
  }) {
    super()
    this.chains = chains
    this.qrcode = Boolean(qrcode)
    UniversalProviderFactory.setSettings({
      projectId,
      relayerRegion,
      metadata,
      qrcode: this.qrcode
    })

    UniversalProviderFactory.init()
  }

  public static readonly connectorName = 'walletconnect'

  public async disconnect() {
    const provider = await UniversalProviderFactory.getProvider()
    await provider.disconnect()
    SolStoreUtil.setAddress('')
  }

  public override getConnectorName(): string {
    return WalletConnectConnector.connectorName
  }

  public override async getProvider() {
    const provider = await UniversalProviderFactory.getProvider()

    return provider
  }

  public async signMessage(message: Uint8Array) {
    const address = SolStoreUtil.state.address
    if (!address) {
      throw new Error('No signer connected')
    }

    const signedMessage = await this.request('solana_signMessage', {
      message: base58.encode(message),
      pubkey: address
    })
    const { signature } = signedMessage

    return signature
  }

  public async signVersionedTransaction(transaction: VersionedTransaction) {
    if (!SolStoreUtil.state.address) {
      throw new Error('No signer connected')
    }
    const transactionParams = {
      feePayer: new PublicKey(SolStoreUtil.state.address).toBase58(),
      instructions: transaction.message.compiledInstructions.map(instruction => ({
        ...instruction,
        data: base58.encode(instruction.data)
      })),
      recentBlockhash: transaction.message.recentBlockhash ?? ''
    }
    await this.request('solana_signTransaction', transactionParams)

    return { signatures: [{ signature: base58.encode(transaction.serialize()) }] }
  }

  public async signTransaction(transactionParam: Transaction | VersionedTransaction) {
    const version = (transactionParam as VersionedTransaction).version
    if (typeof version === 'number') {
      return this.signVersionedTransaction(transactionParam as VersionedTransaction)
    }
    const transaction = transactionParam as Transaction
    const transactionParams = {
      feePayer: transaction.feePayer?.toBase58() ?? '',
      instructions: transaction.instructions.map(instruction => ({
        data: base58.encode(instruction.data),
        keys: instruction.keys.map(key => ({
          isWritable: key.isWritable,
          isSigner: key.isSigner,
          pubkey: key.pubkey.toBase58()
        })),
        programId: instruction.programId.toBase58()
      })),
      recentBlockhash: transaction.recentBlockhash ?? ''
    }

    const res = await this.request('solana_signTransaction', transactionParams)

    transaction.addSignature(
      new PublicKey(SolStoreUtil.state.address ?? ''),
      Buffer.from(base58.decode(res.signature))
    )

    const validSig = transaction.verifySignatures()

    if (!validSig) {
      throw new Error('Signature invalid.')
    }

    return { signatures: [{ signature: base58.encode(transaction.serialize()) }] }
  }

  private async _sendTransaction(transactionParam: Transaction | VersionedTransaction) {
    const encodedTransaction = (await this.signTransaction(transactionParam)) as {
      signatures: {
        signature: string
      }[]
    }
    const signedTransaction = base58.decode(encodedTransaction.signatures[0]?.signature ?? '')
    const txHash = await SolStoreUtil.state.connection?.sendRawTransaction(signedTransaction)

    return {
      tx: txHash,
      signature: base58.encode(signedTransaction)
    }
  }

  public async sendTransaction(transactionParam: Transaction | VersionedTransaction) {
    const { signature } = await this._sendTransaction(transactionParam)

    return signature
  }

  public async signAndSendTransaction(
    transactionParam: Transaction | VersionedTransaction,
    signers: Signer[]
  ) {
    if (transactionParam instanceof VersionedTransaction) {
      throw Error('Versioned transactions are not supported')
    }

    if (signers.length) {
      transactionParam.partialSign(...signers)
    }

    const { tx } = await this._sendTransaction(transactionParam)

    if (tx) {
      const latestBlockHash = await SolStoreUtil.state.connection?.getLatestBlockhash()
      if (latestBlockHash?.blockhash) {
        await SolStoreUtil.state.connection?.confirmTransaction({
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: tx
        })

        return tx
      }
    }

    throw Error('Transaction Failed')
  }

  /**
   * Connect to user's wallet.
   *
   * If `WalletConnectConnector` was configured with `qrcode = true`, this will
   * open a QRCodeModal, where the user will scan the qrcode and then this
   * function will resolve/return the address of the wallet.
   *
   * If `qrcode = false`, this will return the pairing URI used to generate the
   * QRCode.
   */

  public generateNamespaces(chainId: string) {
    const rpcs = this.chains.reduce<Record<string, string>>((acc, chain) => {
      acc[chain.chainId] = chain.rpcUrl

      return acc
    }, {})
    const rpcMap = {
      [chainId]: rpcs[chainId] ?? ''
    }

    return {
      solana: {
        chains: getChainsFromChainId(`solana:${chainId}` as ChainIDType),
        methods: ['solana_signMessage', 'solana_signTransaction'],
        events: [],
        rpcMap
      }
    }
  }

  public async connect() {
    const currentChainId = SolStoreUtil.state.currentChain?.chainId
    const solanaNamespace = this.generateNamespaces(currentChainId ?? '')

    const provider = await UniversalProviderFactory.getProvider()

    return new Promise<string>((resolve, reject) => {
      provider
        .connect({
          optionalNamespaces: solanaNamespace
        })
        .then(session => {
          if (!session) {
            throw new Error('Failed connection.')
          }
          const address = session.namespaces['solana']?.accounts[0]?.split(':')[2] ?? null
          if (address && this.qrcode) {
            const defaultChain = getDefaultChainFromSession(
              session,
              `solana:${currentChainId}` as ChainIDType
            )
            provider.setDefaultChain(defaultChain)

            resolve(address)
          } else {
            reject(new Error('Could not resolve address'))
          }
        })
    })
  }

  public async onConnector() {
    await this.connect()
  }
}
