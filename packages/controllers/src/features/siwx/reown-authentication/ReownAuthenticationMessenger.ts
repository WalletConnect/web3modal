import { type CaipNetworkId, ConstantsUtil, NetworkUtil } from '@reown/appkit-common'

import { ChainController } from '../../../controllers/ChainController.js'
import type { SIWXMessage } from '../../../utils/SIWXUtil.js'

export class ReownAuthenticationMessenger {
  public resources?: SIWXMessage['resources']

  protected getNonce: (params: SIWXMessage.Input) => Promise<SIWXMessage['nonce']>

  constructor(params: ReownAuthenticationMessenger.ConstructorParams) {
    this.getNonce = params.getNonce
  }

  async createMessage(input: SIWXMessage.Input): Promise<SIWXMessage> {
    const params = {
      accountAddress: input.accountAddress,
      chainId: input.chainId,
      version: '1',
      domain: typeof document === 'undefined' ? 'Unknown Domain' : document.location.host,
      uri: typeof document === 'undefined' ? 'Unknown URI' : document.location.href,
      resources: this.resources,
      nonce: await this.getNonce(input),
      issuedAt: this.stringifyDate(new Date()),
      statement: undefined,
      expirationTime: undefined,
      notBefore: undefined
    }

    const methods = {
      toString: () => this.stringify(params)
    } satisfies SIWXMessage.Methods

    return Object.assign(params, methods)
  }

  private stringify(params: SIWXMessage.Data): string {
    const [namespace, reference] = params.chainId.split(':')
    const isEvm = namespace === ConstantsUtil.CHAIN.EVM
    const networkName = this.getNetworkName(params.chainId)
    /*
     * EIP-4361 requires the decimal EIP-155 chain id for EVM (e.g. "1"), not the CAIP-2 id
     * ("eip155:1"). Strict wallet parsers (e.g. Phantom) reject the CAIP form as "invalid
     * formatting". EVM-only — non-EVM namespaces keep their CAIP-2 id.
     */
    const chainId = isEvm ? reference : params.chainId

    return [
      `${params.domain} wants you to sign in with your ${networkName} account:`,
      params.accountAddress,
      /*
       * EIP-4361 (EVM) places the optional statement between two blank lines, so a
       * statement-less message must still emit the empty statement's blank line — otherwise
       * there is a single blank line and strict parsers (e.g. Phantom) reject the message.
       * This mirrors the reference `siwe` serializer. EVM-only, so non-EVM message formats
       * (Solana, Bitcoin, ...) stay byte-for-byte unchanged.
       */
      params.statement ? `\n${params.statement}\n` : isEvm ? '\n' : '',
      `URI: ${params.uri}`,
      `Version: ${params.version}`,
      `Chain ID: ${chainId}`,
      `Nonce: ${params.nonce}`,
      params.issuedAt && `Issued At: ${params.issuedAt}`,
      params.expirationTime && `Expiration Time: ${params.expirationTime}`,
      params.notBefore && `Not Before: ${params.notBefore}`,
      params.requestId && `Request ID: ${params.requestId}`,
      params.resources?.length &&
        params.resources.reduce((acc, resource) => `${acc}\n- ${resource}`, 'Resources:')
    ]
      .filter(line => typeof line === 'string')
      .join('\n')
      .trim()
  }

  private getNetworkName(chainId: CaipNetworkId): string | undefined {
    const requestedNetworks = ChainController.getAllRequestedCaipNetworks()

    return NetworkUtil.getNetworkNameByCaipNetworkId(requestedNetworks, chainId)
  }

  private stringifyDate(date: Date): string {
    return date.toISOString()
  }
}

export namespace ReownAuthenticationMessenger {
  export interface ConstructorParams {
    getNonce: (params: SIWXMessage.Input) => Promise<SIWXMessage['nonce']>
  }
}
