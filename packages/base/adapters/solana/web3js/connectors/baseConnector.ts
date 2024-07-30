import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import BN from 'bn.js'
import base58 from 'bs58'
import borsh from 'borsh'
import { Buffer } from 'buffer'

import { registerListener, unregisterListener } from '../utils/clusterFactory.js'
import { SolConstantsUtil, SolStoreUtil } from '../utils/scaffold/index.js'
import { getHashedName, getNameAccountKey } from '../utils/hash.js'
import { NameRegistry } from '../utils/nameService.js'

import type { ConfirmOptions, Signer, TransactionSignature } from '@solana/web3.js'

import type {
  BlockResult,
  AccountInfo,
  ClusterRequestMethods,
  ClusterSubscribeRequestMethods,
  FilterObject,
  RequestMethods,
  TransactionArgs,
  TransactionType
} from '../utils/scaffold/index.js'

export interface Connector {
  id: string
  name: string
  ready: boolean
  getConnectorName: () => string
  disconnect: () => Promise<void>
  connect: () => Promise<string>
  signMessage: (message: Uint8Array) => Promise<string>
  signTransaction: (
    transaction: Transaction | VersionedTransaction
  ) => Promise<{ signatures: { signature: string }[] }>
  sendTransaction: (transaction: Transaction | VersionedTransaction) => Promise<string>
  signAndSendTransaction: (
    transaction: Transaction | VersionedTransaction,
    signers: Signer[],
    confirmOptions?: ConfirmOptions
  ) => Promise<TransactionSignature>
  getAccount: (
    requestedAddress?: string,
    encoding?: 'base58' | 'base64' | 'jsonParsed'
  ) => Promise<AccountInfo | null>
  getBalance: (requestedAddress: string) => Promise<{
    formatted: string
    value: BN
    decimals: number
    symbol: string
  }>
  getTransaction: (
    transactionSignature: string
  ) => Promise<ClusterRequestMethods['getTransaction']['returns']>
  watchTransaction: (
    transactionSignature: string,
    callback: (params: unknown) => void
  ) => Promise<() => void>
  getAddressFromDomain: (address: string) => Promise<string | null>
  getBlock: (slot: number) => Promise<BlockResult | null>
  getFeeForMessage: <Type extends TransactionType>(
    type: Type,
    params: TransactionArgs[Type]['params']
  ) => Promise<number>
}

type Currency = 'lamports' | 'sol'

export class BaseConnector {
  public getConnectorName() {
    return 'base'
  }

  public get publicKey() {
    return new PublicKey(SolStoreUtil.state.address ?? '')
  }

  protected async getProvider(): Promise<{
    /* eslint-disable @typescript-eslint/no-explicit-any */
    request: (args: any) => any
  }> {
    return Promise.reject(new Error('No provider in base connector'))
  }

  protected async constructTransaction<TransType extends keyof TransactionArgs>(
    type: TransType,
    params: TransactionArgs[TransType]['params']
  ) {
    const transaction = new Transaction()
    const fromAddress = SolStoreUtil.state.address

    if (!fromAddress) {
      throw new Error('No address connected')
    }
    const fromPubkey = new PublicKey(fromAddress)

    if (type === 'transfer') {
      const transferParams = params as TransactionArgs['transfer']['params']
      const toPubkey = new PublicKey(transferParams.to)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: new PublicKey(transferParams.to),
          lamports: transferParams.amountInLamports
        })
      )
      transaction.feePayer = transferParams.feePayer === 'from' ? fromPubkey : toPubkey
    } else if (type === 'program') {
      const programParams = params as TransactionArgs['program']['params']
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: fromPubkey, isSigner: true, isWritable: programParams.isWritableSender }
          ],
          programId: new PublicKey(programParams.programId),
          data: Buffer.from(base58.decode(JSON.stringify(programParams.data)))
        })
      )
      transaction.feePayer = fromPubkey
    } else {
      throw new Error(`No transaction configuration for type ${String(type)}`)
    }

    const response = await this.requestCluster('getLatestBlockhash', [{}])

    const { blockhash: recentBlockhash } = response.value
    transaction.recentBlockhash = recentBlockhash

    return transaction
  }

  protected async constructVersionedTransaction(params: TransactionArgs['transfer']['params']) {
    const fromAddress = SolStoreUtil.state.address
    if (!fromAddress) {
      throw new Error('No address connected')
    }
    const fromPubkey = new PublicKey(fromAddress)
    const toPubkey = new PublicKey(params.to)

    const instructions = [
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: params.amountInLamports
      })
    ]

    const response = await this.requestCluster('getLatestBlockhash', [{}])
    const { blockhash: recentBlockhash } = response.value

    const messageV0 = new TransactionMessage({
      payerKey: fromPubkey,
      recentBlockhash,
      instructions
    }).compileToV0Message()

    // Make a versioned transaction
    const transactionV0 = new VersionedTransaction(messageV0)

    return transactionV0
  }

  public async getTransaction(transactionSignature: string) {
    const transaction = await this.requestCluster('getTransaction', [
      transactionSignature,
      { encoding: 'jsonParsed', commitment: 'confirmed' }
    ])

    return transaction
  }

  public async watchTransaction(
    transactionSignature: string,
    callback: (params: Transaction | number) => void
  ) {
    return this.subscribeToCluster('signatureSubscribe', [transactionSignature], callback)
  }

  public async getBalance(requestedAddress: string, currency: Currency = 'sol') {
    try {
      const address = requestedAddress ?? SolStoreUtil.state.address
      const balance = await this.requestCluster('getBalance', [
        address,
        { commitment: 'processed' }
      ])
      const BALANCE_VALUE_DECIMAL_DIVIDER = 1000000000
      const formatted =
        currency === 'lamports'
          ? `${balance?.value || 0} lamports`
          : `${(balance?.value || 0) / BALANCE_VALUE_DECIMAL_DIVIDER} sol`

      return {
        value: new BN(balance.value),
        formatted,
        decimals: balance.value / BALANCE_VALUE_DECIMAL_DIVIDER,
        symbol: currency
      }
    } catch (err) {
      SolStoreUtil.setError("Can't get balance")

      return {
        value: new BN(0),
        formatted: '0 sol',
        decimals: 0,
        symbol: currency
      }
    }
  }

  public async getFeeForMessage<TransType extends keyof TransactionArgs>(
    type: TransType,
    params: TransactionArgs[TransType]['params']
  ) {
    const transaction = await this.constructTransaction(type, params)
    const message = transaction.compileMessage().serialize()
    const encodedMessage = message.toString('base64')

    const result = await this.requestCluster('getFeeForMessage', [encodedMessage])

    return result
  }

  public async getProgramAccounts(requestedAddress: string, filters?: FilterObject[]) {
    const programAccounts = await this.requestCluster('getProgramAccounts', [
      requestedAddress,
      { filters: filters ?? [], encoding: 'jsonParsed', withContext: true }
    ])

    return programAccounts.value
  }

  public async getAllDomains(address: string) {
    const accounts = await this.getProgramAccounts(SolConstantsUtil.NAME_PROGRAM_ID.toBase58(), [
      {
        memcmp: {
          offset: 32,
          bytes: address
        }
      },
      {
        memcmp: {
          offset: 0,
          bytes: SolConstantsUtil.ROOT_DOMAIN_ACCOUNT.toBase58()
        }
      }
    ])

    return accounts.map(({ pubkey }: any) => pubkey)
  }

  public async getAccount(
    nameAccountKey?: string,
    encoding: 'base58' | 'base64' | 'jsonParsed' = 'base58'
  ) {
    const address = nameAccountKey ?? SolStoreUtil.state.address

    if (!address) {
      throw new Error('No address supplied and none connected')
    }

    const response = await this.requestCluster('getAccountInfo', [
      address,
      {
        encoding
      }
    ])

    if (!response) {
      throw new Error('Invalid name account provided')
    }

    const { value: nameAccount } = response

    return nameAccount
  }

  public async getBlock(slot: number) {
    const block = await this.requestCluster('getBlock', [slot])

    return block
  }

  public async getAddressFromDomain(domain: string) {
    const hashed = getHashedName(domain.replace('.sol', ''))

    const nameAccountKey = await getNameAccountKey(
      hashed,
      undefined,
      SolConstantsUtil.ROOT_DOMAIN_ACCOUNT
    )
    const ownerDataRaw = await this.getAccount(nameAccountKey.toBase58(), 'base64')

    if (!ownerDataRaw) {
      return null
    }

    const ownerData = borsh.deserializeUnchecked(
      NameRegistry.schema,
      NameRegistry,
      Buffer.from(String(ownerDataRaw.data[0]), 'base64')
    ) as { owner: any }

    return ownerData.owner.toBase58()
  }

  public async request<Method extends keyof RequestMethods>(
    method: Method,
    params: RequestMethods[Method]['params']
  ): Promise<RequestMethods[Method]['returns']> {
    return (await this.getProvider()).request({ method, params })
  }

  public async subscribeToCluster<Method extends keyof ClusterSubscribeRequestMethods>(
    method: Method,
    params: ClusterSubscribeRequestMethods[Method]['params'],
    callback: (cb_params: Transaction | number) => void
  ) {
    const id = await registerListener(method, params, callback)

    return () => {
      unregisterListener(id)
    }
  }

  public async requestCluster<Method extends keyof ClusterRequestMethods>(
    method: Method,
    params: ClusterRequestMethods[Method]['params']
  ): Promise<ClusterRequestMethods[Method]['returns']> {
    const cluster = SolStoreUtil.getCluster()
    const { endpoint } = cluster
    const res: { result: ClusterRequestMethods[Method]['returns'] } = await fetch(endpoint, {
      method: 'post',
      body: JSON.stringify({
        method,
        params,
        jsonrpc: '2.0',
        id: SolStoreUtil.getNewRequestId()
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(async httpRes => {
      const json = await httpRes.json()

      return json
    })

    return res.result
  }
}
