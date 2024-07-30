import {
  BaseWalletAdapter,
  isVersionedTransaction,
  type SendTransactionOptions,
  type StandardWalletAdapter as StandardWalletAdapterType,
  type SupportedTransactionVersions,
  WalletAccountError,
  type WalletAdapterCompatibleStandardWallet,
  WalletConfigError,
  WalletConnectionError,
  WalletDisconnectedError,
  WalletDisconnectionError,
  WalletError,
  type WalletName,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletReadyState,
  WalletSendTransactionError,
  WalletSignInError,
  WalletSignMessageError,
  WalletSignTransactionError
} from '@solana/wallet-adapter-base'
import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  SolanaSignIn,
  type SolanaSignInInput,
  type SolanaSignInOutput,
  SolanaSignMessage,
  SolanaSignTransaction,
  type SolanaSignTransactionFeature
} from '@solana/wallet-standard-features'
import { getChainForEndpoint, getCommitment } from '@solana/wallet-standard-util'
import type { Connection, TransactionSignature } from '@solana/web3.js'
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import type { WalletAccount } from '@wallet-standard/base'
import {
  StandardConnect,
  type StandardConnectInput,
  StandardDisconnect,
  StandardEvents,
  type StandardEventsListeners
} from '@wallet-standard/features'
import { arraysEqual } from '@wallet-standard/wallet'
import bs58 from 'bs58'

/** TODO: docs */
export interface StandardWalletAdapterConfig {
  wallet: WalletAdapterCompatibleStandardWallet
}

/** TODO: docs */
export class StandardWalletAdapter extends BaseWalletAdapter implements StandardWalletAdapterType {
  #account: WalletAccount | null
  #publicKey: PublicKey | null
  #connecting: boolean
  #disconnecting: boolean
  #off: (() => void) | null
  #supportedTransactionVersions: SupportedTransactionVersions
  readonly #wallet: WalletAdapterCompatibleStandardWallet
  readonly #readyState: WalletReadyState =
    typeof window === 'undefined' || typeof document === 'undefined'
      ? WalletReadyState.Unsupported
      : WalletReadyState.Installed

  get name() {
    return this.#wallet.name as WalletName
  }

  readonly url = 'https://github.com/solana-labs/wallet-standard'

  readonly isAnnounced = true

  get icon() {
    return this.#wallet.icon
  }

  get readyState() {
    return this.#readyState
  }

  get publicKey() {
    return this.#publicKey
  }

  get connecting() {
    return this.#connecting
  }

  get supportedTransactionVersions() {
    return this.#supportedTransactionVersions
  }

  get wallet(): WalletAdapterCompatibleStandardWallet {
    return this.#wallet
  }

  get standard() {
    return true as const
  }

  constructor({ wallet }: StandardWalletAdapterConfig) {
    super()

    this.#wallet = wallet
    this.#account = null
    this.#publicKey = null
    this.#connecting = false
    this.#disconnecting = false
    this.#off = this.#wallet.features[StandardEvents].on('change', this.#changed)

    this.#reset()
  }

  destroy(): void {
    this.#account = null
    this.#publicKey = null
    this.#connecting = false
    this.#disconnecting = false

    const off = this.#off
    if (off) {
      this.#off = null
      off()
    }
  }

  override async autoConnect(): Promise<void> {
    return this.#connect({ silent: true })
  }

  async connect(params?: StandardConnectInput): Promise<void> {
    return this.#connect(params)
  }

  async #connect(input?: StandardConnectInput): Promise<void> {
    try {
      if (this.connected || this.connecting) {
        return
      }
      if (this.#readyState !== WalletReadyState.Installed) {
        throw new WalletNotReadyError()
      }

      this.#connecting = true

      if (!this.#wallet.accounts.length) {
        try {
          await this.#wallet.features[StandardConnect].connect(input)
        } catch (error: unknown) {
          throw new WalletConnectionError((error as Error)?.message, error)
        }
      }

      const account = this.#wallet.accounts[0]
      if (!account) {
        throw new WalletAccountError()
      }

      this.#connected(account)
    } catch (error: unknown) {
      this.emit('error', error as WalletError)
      throw error
    } finally {
      this.#connecting = false
    }
  }

  async disconnect(): Promise<void> {
    if (StandardDisconnect in this.#wallet.features) {
      try {
        this.#disconnecting = true
        await this.#wallet.features[StandardDisconnect].disconnect()
      } catch (error: unknown) {
        this.emit('error', new WalletDisconnectionError((error as Error)?.message, error))
      } finally {
        this.#disconnecting = false
      }
    }

    this.#disconnected()
  }

  #connected(account: WalletAccount) {
    let publicKey: PublicKey | undefined = undefined
    try {
      // Use account.address instead of account.publicKey since address could be a PDA
      publicKey = new PublicKey(account.address)
    } catch (error: unknown) {
      throw new WalletPublicKeyError((error as Error)?.message, error)
    }

    this.#account = account
    this.#publicKey = publicKey
    this.#reset()
    this.emit('connect', publicKey)
  }

  #disconnected(): void {
    this.#account = null
    this.#publicKey = null
    this.#reset()
    this.emit('disconnect')
  }

  #reset() {
    const supportedTransactionVersions =
      SolanaSignAndSendTransaction in this.#wallet.features
        ? this.#wallet.features[SolanaSignAndSendTransaction].supportedTransactionVersions
        : this.#wallet.features[SolanaSignTransaction].supportedTransactionVersions
    this.#supportedTransactionVersions = arraysEqual(supportedTransactionVersions, ['legacy'])
      ? null
      : new Set(supportedTransactionVersions)

    if (
      SolanaSignTransaction in this.#wallet.features &&
      this.#account?.features.includes(SolanaSignTransaction)
    ) {
      this.signTransaction = this.#signTransaction
      this.signAllTransactions = this.#signAllTransactions
    } else {
      delete this.signTransaction
      delete this.signAllTransactions
    }

    if (
      SolanaSignMessage in this.#wallet.features &&
      this.#account?.features.includes(SolanaSignMessage)
    ) {
      this.signMessage = this.#signMessage
    } else {
      delete this.signMessage
    }

    if (SolanaSignIn in this.#wallet.features) {
      this.signIn = this.#signIn
    } else {
      delete this.signIn
    }
  }

  #changed: StandardEventsListeners['change'] = properties => {
    // If accounts have changed on the wallet, reflect this on the adapter.
    if ('accounts' in properties) {
      const account = this.#wallet.accounts[0]
      // If the adapter isn't connected, or is disconnecting, or the first account hasn't changed, do nothing.
      if (this.#account && !this.#disconnecting && account !== this.#account) {
        // If there's a connected account, connect the adapter. Otherwise, disconnect it.
        if (account) {
          // Connect the adapter.
          this.#connected(account)
        } else {
          // Emit an error because the wallet spontaneously disconnected.
          this.emit('error', new WalletDisconnectedError())
          // Disconnect the adapter.
          this.#disconnected()
        }
      }
    }

    // After reflecting account changes, if features have changed on the wallet, reflect this on the adapter.
    if ('features' in properties) {
      this.#reset()
    }
  }

  async sendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    connection: Connection,
    options: SendTransactionOptions = {}
  ): Promise<TransactionSignature> {
    try {
      const account = this.#account
      if (!account) {
        throw new WalletNotConnectedError()
      }

      let feature: typeof SolanaSignAndSendTransaction | typeof SolanaSignTransaction | undefined =
        undefined
      if (SolanaSignAndSendTransaction in this.#wallet.features) {
        if (account.features.includes(SolanaSignAndSendTransaction)) {
          feature = SolanaSignAndSendTransaction
        } else if (
          SolanaSignTransaction in this.#wallet.features &&
          account.features.includes(SolanaSignTransaction)
        ) {
          feature = SolanaSignTransaction
        } else {
          throw new WalletAccountError()
        }
      } else if (SolanaSignTransaction in this.#wallet.features) {
        if (!account.features.includes(SolanaSignTransaction)) {
          throw new WalletAccountError()
        }
        feature = SolanaSignTransaction
      } else {
        throw new WalletConfigError()
      }

      const chain = getChainForEndpoint(connection.rpcEndpoint)
      if (!account.chains.includes(chain)) {
        throw new WalletSendTransactionError()
      }

      try {
        const { signers, ...sendOptions } = options

        let serializedTransaction: Uint8Array | undefined = undefined
        if (isVersionedTransaction(transaction)) {
          if (signers?.length) {
            transaction.sign(signers)
          }
          serializedTransaction = transaction.serialize()
        } else {
          const _transaction = (await this.prepareTransaction(
            transaction,
            connection,
            sendOptions
          )) as T
          if (signers?.length) {
            ;(_transaction as Transaction).partialSign(...signers)
          }
          serializedTransaction = new Uint8Array(
            (_transaction as Transaction).serialize({
              requireAllSignatures: false,
              verifySignatures: false
            })
          )
        }

        if (feature === SolanaSignAndSendTransaction) {
          const [output] = await (this.#wallet.features as SolanaSignAndSendTransactionFeature)[
            SolanaSignAndSendTransaction
          ].signAndSendTransaction({
            account,
            chain,
            transaction: serializedTransaction,
            options: {
              preflightCommitment: getCommitment(
                sendOptions.preflightCommitment || connection.commitment
              ),
              skipPreflight: sendOptions.skipPreflight,
              maxRetries: sendOptions.maxRetries,
              minContextSlot: sendOptions.minContextSlot
            }
          })

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return bs58.encode(output!.signature)
        }
        const [output] = await (this.#wallet.features as SolanaSignTransactionFeature)[
          SolanaSignTransaction
        ].signTransaction({
          account,
          chain,
          transaction: serializedTransaction,
          options: {
            preflightCommitment: getCommitment(
              sendOptions.preflightCommitment || connection.commitment
            ),
            minContextSlot: sendOptions.minContextSlot
          }
        })

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await connection.sendRawTransaction(output!.signedTransaction, {
          ...sendOptions,
          preflightCommitment: getCommitment(
            sendOptions.preflightCommitment || connection.commitment
          )
        })
      } catch (error: unknown) {
        if (error instanceof WalletError) {
          throw error
        }
        throw new WalletSendTransactionError((error as Error)?.message, error)
      }
    } catch (error: unknown) {
      this.emit('error', error as WalletError)
      throw error
    }
  }

  signTransaction:
    | (<T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>)
    | undefined
  async #signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    try {
      const account = this.#account
      if (!account) {
        throw new WalletNotConnectedError()
      }

      if (!(SolanaSignTransaction in this.#wallet.features)) {
        throw new WalletConfigError()
      }
      if (!account.features.includes(SolanaSignTransaction)) {
        throw new WalletAccountError()
      }
      try {
        const signedTransactions = await this.#wallet.features[
          SolanaSignTransaction
        ].signTransaction({
          account,
          transaction: isVersionedTransaction(transaction)
            ? transaction.serialize()
            : new Uint8Array(
                transaction.serialize({
                  requireAllSignatures: false,
                  verifySignatures: false
                })
              )
        })

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const serializedTransaction = signedTransactions[0]!.signedTransaction

        return (
          isVersionedTransaction(transaction)
            ? VersionedTransaction.deserialize(serializedTransaction)
            : Transaction.from(serializedTransaction)
        ) as T
      } catch (error: unknown) {
        if (error instanceof WalletError) {
          throw error
        }
        throw new WalletSignTransactionError((error as Error)?.message, error)
      }
    } catch (error: unknown) {
      this.emit('error', error as WalletError)
      throw error
    }
  }

  signAllTransactions:
    | (<T extends Transaction | VersionedTransaction>(transaction: T[]) => Promise<T[]>)
    | undefined
  async #signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    try {
      const account = this.#account
      if (!account) {
        throw new WalletNotConnectedError()
      }

      if (!(SolanaSignTransaction in this.#wallet.features)) {
        throw new WalletConfigError()
      }
      if (!account.features.includes(SolanaSignTransaction)) {
        throw new WalletAccountError()
      }

      try {
        const signedTransactions = await this.#wallet.features[
          SolanaSignTransaction
        ].signTransaction(
          ...transactions.map(transaction => ({
            account,
            transaction: isVersionedTransaction(transaction)
              ? transaction.serialize()
              : new Uint8Array(
                  transaction.serialize({
                    requireAllSignatures: false,
                    verifySignatures: false
                  })
                )
          }))
        )

        return transactions.map((transaction, index) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const signedTransaction = signedTransactions[index]!.signedTransaction

          return (
            isVersionedTransaction(transaction)
              ? VersionedTransaction.deserialize(signedTransaction)
              : Transaction.from(signedTransaction)
          ) as T
        })
      } catch (error: unknown) {
        throw new WalletSignTransactionError((error as Error)?.message, error)
      }
    } catch (error: unknown) {
      this.emit('error', error as WalletError)
      throw error
    }
  }

  signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined
  async #signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const account = this.#account
      if (!account) {
        throw new WalletNotConnectedError()
      }

      if (!(SolanaSignMessage in this.#wallet.features)) {
        throw new WalletConfigError()
      }
      if (!account.features.includes(SolanaSignMessage)) {
        throw new WalletAccountError()
      }

      try {
        const signedMessages = await this.#wallet.features[SolanaSignMessage].signMessage({
          account,
          message
        })

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return signedMessages[0]!.signature
      } catch (error: unknown) {
        throw new WalletSignMessageError((error as Error)?.message, error)
      }
    } catch (error: unknown) {
      this.emit('error', error as WalletError)
      throw error
    }
  }

  signIn: ((input?: SolanaSignInInput) => Promise<SolanaSignInOutput>) | undefined
  async #signIn(input: SolanaSignInInput = {}): Promise<SolanaSignInOutput> {
    try {
      if (!(SolanaSignIn in this.#wallet.features)) {
        throw new WalletConfigError()
      }

      let output: SolanaSignInOutput | undefined = undefined
      try {
        ;[output] = await this.#wallet.features[SolanaSignIn].signIn(input)
      } catch (error: unknown) {
        throw new WalletSignInError((error as Error)?.message, error)
      }

      if (!output) {
        throw new WalletSignInError()
      }
      this.#connected(output.account)

      return output
    } catch (error: unknown) {
      this.emit('error', error as WalletError)
      throw error
    }
  }
}
